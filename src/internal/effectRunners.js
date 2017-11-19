import * as io from './io'
import { channel, isEnd } from './channel'
import matcher from './matcher'
import { asap, suspend, flush } from './scheduler'
import { create as createTaskIterator } from './taskIterator'
import { CHANNEL_END, TASK_CANCEL } from './completionValues'
import { CANCEL, SELF_CANCELLATION } from './symbols'
import { is, noop, object, remove } from './utils'

import proc from './proc'

export function resolvePromise(promise, resolve) {
  const cancelPromise = promise[CANCEL]
  if (is.func(cancelPromise)) {
    resolve.cancel = cancelPromise
  } else if (is.func(promise.abort)) {
    resolve.cancel = () => promise.abort()
  }
  promise.then(resolve, error => resolve(error, true))
}

function runTakeEffect({ channel, pattern, maybe }, resolveEffect, sagaState) {
  channel = channel || sagaState.channel

  const takeCb = input => {
    if (input instanceof Error) {
      resolveEffect(input, true)
      return
    }
    if (isEnd(input) && !maybe) {
      resolveEffect(CHANNEL_END)
      return
    }
    resolveEffect(input)
  }

  try {
    channel.take(takeCb, is.notUndef(pattern) ? matcher(pattern) : null)
  } catch (err) {
    resolveEffect(err, true)
    return
  }

  resolveEffect.cancel = takeCb.cancel
}

function runPutEffect({ channel, action, resolve }, resolveEffect, sagaState) {
  /**
    Schedule the put in case another saga is holding a lock.
    The put will be executed atomically. ie nested puts will execute after
    this put has terminated.
  **/
  asap(() => {
    let result
    try {
      result = (channel ? channel.put : sagaState.dispatch)(action)
    } catch (error) {
      resolveEffect(error, true)
      return
    }

    if (resolve && is.promise(result)) {
      resolvePromise(result, resolveEffect)
    } else {
      resolveEffect(result)
      return
    }
  })
  // Put effects are non cancellables
}

function runAllEffect(effects, resolveEffect, sagaState, effectId) {
  const keys = Object.keys(effects)
  const results = is.array(effects) ? [] : {}

  if (!keys.length) {
    resolveEffect(results)
    return
  }

  let completedCount = 0
  let completed

  const childCbs = {}

  function checkEffectEnd() {
    if (completedCount === keys.length) {
      completed = true
      resolveEffect(results)
    }
  }

  keys.forEach(key => {
    const chCbAtKey = (res, isErr) => {
      if (completed) {
        return
      }
      if (isErr || isEnd(res) || res === CHANNEL_END || res === TASK_CANCEL) {
        resolveEffect.cancel()
        resolveEffect(res, isErr)
      } else {
        results[key] = res
        completedCount++
        checkEffectEnd()
      }
    }
    chCbAtKey.cancel = noop
    childCbs[key] = chCbAtKey
  })

  resolveEffect.cancel = () => {
    if (!completed) {
      completed = true
      keys.forEach(key => childCbs[key].cancel())
    }
  }

  keys.forEach(key => sagaState.triggerEffect(effects[key], effectId, key, childCbs[key]))
}

function runRaceEffect(effects, resolveEffect, sagaState, effectId) {
  let completed
  const keys = Object.keys(effects)
  const childCbs = {}

  keys.forEach(key => {
    const chCbAtKey = (res, isErr) => {
      if (completed) {
        return
      }

      if (isErr) {
        // Race Auto cancellation
        resolveEffect.cancel()
        resolveEffect(res, true)
      } else if (!isEnd(res) && res !== CHANNEL_END && res !== TASK_CANCEL) {
        resolveEffect.cancel()
        completed = true
        if (is.array(effects)) {
          const response = new Array(effects.length)
          response[key] = res
          resolveEffect(response)
        } else {
          resolveEffect({ [key]: res })
        }
      }
    }
    chCbAtKey.cancel = noop
    childCbs[key] = chCbAtKey
  })

  resolveEffect.cancel = () => {
    // prevents unnecessary cancellation
    if (!completed) {
      completed = true
      keys.forEach(key => childCbs[key].cancel())
    }
  }

  keys.forEach(key => {
    if (completed) {
      return
    }
    sagaState.triggerEffect(effects[key], effectId, key, childCbs[key])
  })
}

function runCallEffect({ context, fn, args }, resolveEffect, sagaState, effectId) {
  let result
  // catch synchronous failures; see #152
  try {
    result = fn.apply(context, args)
  } catch (error) {
    resolveEffect(error, true)
    return
  }

  if (is.promise(result)) {
    resolvePromise(result, resolveEffect)
  } else if (is.iterator(result)) {
    proc(result, sagaState, effectId, resolveEffect, fn.name)
  } else {
    resolveEffect(result)
  }
}

function runCPSEffect({ context, fn, args }, resolveEffect) {
  // CPS (ie node style functions) can define their own cancellation logic
  // by setting cancel field on the resolveEffect

  // catch synchronous failures; see #152
  try {
    const cpsCb = (err, res) => (is.undef(err) ? resolveEffect(res) : resolveEffect(err, true))

    fn.apply(context, args.concat(cpsCb))

    if (cpsCb.cancel) {
      resolveEffect.cancel = cpsCb.cancel
    }
  } catch (error) {
    resolveEffect(error, true)
    return
  }
}

function runForkEffect({ context, fn, args, detached }, resolveEffect, sagaState, effectId) {
  const taskIterator = createTaskIterator({ context, fn, args })

  try {
    suspend()

    const task = proc(
      taskIterator,
      sagaState,
      effectId,
      // this is quite weird
      // need to explore when continuation is actually a function worth to be called
      // possibly only for top level tasks?
      detached ? null : noop,
      fn.name,
    )

    if (detached) {
      resolveEffect(task)
    } else {
      if (taskIterator._isRunning) {
        sagaState.taskQueue.addTask(task)
        resolveEffect(task)
      } else if (taskIterator._error) {
        sagaState.taskQueue.abort(taskIterator._error)
      } else {
        resolveEffect(task)
      }
    }
  } finally {
    flush()
  }
  // Fork effects are non cancellables
}

function runJoinEffect(t, resolveEffect, sagaState) {
  if (t.isRunning()) {
    const joiner = { task: sagaState.task, cb: resolveEffect }
    resolveEffect.cancel = () => remove(t.joiners, joiner)
    t.joiners.push(joiner)
  } else {
    t.isAborted() ? resolveEffect(t.error(), true) : resolveEffect(t.result())
  }
}

function runCancelEffect(taskToCancel, resolveEffect, sagaState) {
  if (taskToCancel === SELF_CANCELLATION) {
    taskToCancel = sagaState.task
  }
  if (taskToCancel.isRunning()) {
    taskToCancel.cancel()
  }
  resolveEffect()
  // cancel effects are non cancellables
}

function runSelectEffect({ selector, args }, resolveEffect, sagaState) {
  try {
    const state = selector(sagaState.getState(), ...args)
    resolveEffect(state)
  } catch (error) {
    resolveEffect(error, true)
  }
}

function runChannelEffect({ pattern, buffer }, resolveEffect, sagaState) {
  // TODO: rethink how END is handled
  const chan = channel(buffer)
  const match = matcher(pattern)

  const taker = action => {
    if (!isEnd(action)) {
      sagaState.channel.take(taker, match)
    }
    chan.put(action)
  }

  sagaState.channel.take(taker, match)
  resolveEffect(chan)
}

function runCancelledEffect(data, resolveEffect, sagaState) {
  resolveEffect(!!sagaState.mainTask.isCancelled)
}

function runFlushEffect(channel, resolveEffect) {
  channel.flush(resolveEffect)
}

function runGetContextEffect(prop, resolveEffect, sagaState) {
  resolveEffect(sagaState.taskContext[prop])
}

function runSetContextEffect(props, resolveEffect, sagaState) {
  object.assign(sagaState.taskContext, props)
  resolveEffect()
}

export default {
  [io.TAKE]: runTakeEffect,
  [io.PUT]: runPutEffect,
  [io.ALL]: runAllEffect,
  [io.RACE]: runRaceEffect,
  [io.CALL]: runCallEffect,
  [io.CPS]: runCPSEffect,
  [io.FORK]: runForkEffect,
  [io.JOIN]: runJoinEffect,
  [io.CANCEL]: runCancelEffect,
  [io.SELECT]: runSelectEffect,
  [io.ACTION_CHANNEL]: runChannelEffect,
  [io.CANCELLED]: runCancelledEffect,
  [io.FLUSH]: runFlushEffect,
  [io.GET_CONTEXT]: runGetContextEffect,
  [io.SET_CONTEXT]: runSetContextEffect,
}
