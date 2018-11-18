import { SELF_CANCELLATION, TERMINATE } from '@redux-saga/symbols'
import * as is from '@redux-saga/is'
import * as effectTypes from './effectTypes'
import { channel, isEnd } from './channel'
// usage of proc here makes internal circular dependency
// this works fine, but it is a little bit unfortunate
import proc from './proc'
import resolvePromise from './resolvePromise'
import matcher from './matcher'
import { asap, immediately } from './scheduler'
import { getMetaInfo } from './error-utils'
import { current as currentEffectId } from './uid'
import {
  assignWithSymbols,
  createAllStyleChildCallbacks,
  createEmptyArray,
  makeIterator,
  noop,
  remove,
  shouldComplete,
} from './utils'

function getIteratorMetaInfo(iterator, fn) {
  if (iterator.isSagaIterator) {
    return { name: iterator.meta.name }
  }
  return getMetaInfo(fn)
}

function createTaskIterator({ context, fn, args }) {
  // catch synchronous failures; see #152 and #441
  try {
    const result = fn.apply(context, args)

    // i.e. a generator function returns an iterator
    if (is.iterator(result)) {
      return result
    }

    const next = (value = result) => ({
      value,
      done: !is.promise(value),
    })

    return makeIterator(next)
  } catch (err) {
    // do not bubble up synchronous failures for detached forks
    // instead create a failed task. See #152 and #441
    return makeIterator(() => {
      throw err
    })
  }
}

function runPutEffect(env, { channel, action, resolve }, cb) {
  /**
   Schedule the put in case another saga is holding a lock.
   The put will be executed atomically. ie nested puts will execute after
   this put has terminated.
   **/
  asap(() => {
    let result
    try {
      result = (channel ? channel.put : env.dispatch)(action)
    } catch (error) {
      cb(error, true)
      return
    }

    if (resolve && is.promise(result)) {
      resolvePromise(result, cb)
    } else {
      cb(result)
    }
  })
  // Put effects are non cancellables
}

function runTakeEffect(env, { channel = env.channel, pattern, maybe }, cb) {
  const takeCb = input => {
    if (input instanceof Error) {
      cb(input, true)
      return
    }
    if (isEnd(input) && !maybe) {
      cb(TERMINATE)
      return
    }
    cb(input)
  }
  try {
    channel.take(takeCb, is.notUndef(pattern) ? matcher(pattern) : null)
  } catch (err) {
    cb(err, true)
    return
  }
  cb.cancel = takeCb.cancel
}

function runCallEffect(env, { context, fn, args }, cb, { taskContext }) {
  // catch synchronous failures; see #152
  try {
    const result = fn.apply(context, args)

    if (is.promise(result)) {
      resolvePromise(result, cb)
      return
    }

    if (is.iterator(result)) {
      // resolve iterator
      proc(env, result, taskContext, currentEffectId, getMetaInfo(fn), /* isRoot */ false, cb)
      return
    }

    cb(result)
  } catch (error) {
    cb(error, true)
  }
}

function runCPSEffect(env, { context, fn, args }, cb) {
  // CPS (ie node style functions) can define their own cancellation logic
  // by setting cancel field on the cb

  // catch synchronous failures; see #152
  try {
    const cpsCb = (err, res) => {
      if (is.undef(err)) {
        cb(res)
      } else {
        cb(err, true)
      }
    }

    fn.apply(context, args.concat(cpsCb))

    if (cpsCb.cancel) {
      cb.cancel = cpsCb.cancel
    }
  } catch (error) {
    cb(error, true)
  }
}

function runForkEffect(env, { context, fn, args, detached }, cb, { taskContext, taskQueue }) {
  const taskIterator = createTaskIterator({ context, fn, args })
  const meta = getIteratorMetaInfo(taskIterator, fn)

  immediately(() => {
    const task = proc(env, taskIterator, taskContext, currentEffectId, meta, detached, noop)

    if (detached) {
      cb(task)
    } else {
      if (task._isRunning) {
        taskQueue.addTask(task)
        cb(task)
      } else if (task._error) {
        taskQueue.abort(task._error)
      } else {
        cb(task)
      }
    }
  })
  // Fork effects are non cancellables
}

function runJoinEffect(env, taskOrTasks, cb, { task }) {
  if (is.array(taskOrTasks)) {
    if (taskOrTasks.length === 0) {
      cb([])
      return
    }

    const childCallbacks = createAllStyleChildCallbacks(taskOrTasks, cb)
    taskOrTasks.forEach((t, i) => {
      joinSingleTask(t, childCallbacks[i])
    })
  } else {
    joinSingleTask(taskOrTasks, cb)
  }

  function joinSingleTask(taskToJoin, cb) {
    if (taskToJoin.isRunning()) {
      const joiner = { task, cb }
      cb.cancel = () => remove(taskToJoin.joiners, joiner)
      taskToJoin.joiners.push(joiner)
    } else {
      if (taskToJoin.isAborted()) {
        cb(taskToJoin.error(), true)
      } else {
        cb(taskToJoin.result())
      }
    }
  }
}

function runCancelEffect(env, taskOrTasks, cb, { task }) {
  if (taskOrTasks === SELF_CANCELLATION) {
    cancelSingleTask(task)
  } else if (is.array(taskOrTasks)) {
    taskOrTasks.forEach(cancelSingleTask)
  } else {
    cancelSingleTask(taskOrTasks)
  }
  cb()

  // cancel effects are non cancellables

  function cancelSingleTask(taskToCancel) {
    if (taskToCancel.isRunning()) {
      taskToCancel.cancel()
    }
  }
}

function runAllEffect(env, effects, cb, { digestEffect }) {
  const effectId = currentEffectId
  const keys = Object.keys(effects)
  if (keys.length === 0) {
    cb(is.array(effects) ? [] : {})
    return
  }

  const childCallbacks = createAllStyleChildCallbacks(effects, cb)
  keys.forEach(key => {
    digestEffect(effects[key], effectId, childCallbacks[key], key)
  })
}

function runRaceEffect(env, effects, cb, { digestEffect }) {
  const effectId = currentEffectId
  const keys = Object.keys(effects)
  const response = is.array(effects) ? createEmptyArray(keys.length) : {}
  const childCbs = {}
  let completed = false

  keys.forEach(key => {
    const chCbAtKey = (res, isErr) => {
      if (completed) {
        return
      }
      if (isErr || shouldComplete(res)) {
        // Race Auto cancellation
        cb.cancel()
        cb(res, isErr)
      } else {
        cb.cancel()
        completed = true
        response[key] = res
        cb(response)
      }
    }
    chCbAtKey.cancel = noop
    childCbs[key] = chCbAtKey
  })

  cb.cancel = () => {
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
    digestEffect(effects[key], effectId, childCbs[key], key)
  })
}

function runSelectEffect(env, { selector, args }, cb) {
  try {
    const state = selector(env.getState(), ...args)
    cb(state)
  } catch (error) {
    cb(error, true)
  }
}

function runChannelEffect(env, { pattern, buffer }, cb) {
  // TODO: rethink how END is handled
  const chan = channel(buffer)
  const match = matcher(pattern)

  const taker = action => {
    if (!isEnd(action)) {
      env.channel.take(taker, match)
    }
    chan.put(action)
  }

  const { close } = chan

  chan.close = () => {
    taker.cancel()
    close()
  }

  env.channel.take(taker, match)
  cb(chan)
}

function runCancelledEffect(env, data, cb, { mainTask }) {
  cb(mainTask._isCancelled)
}

function runFlushEffect(env, channel, cb) {
  channel.flush(cb)
}

function runGetContextEffect(env, prop, cb, { taskContext }) {
  cb(taskContext[prop])
}

function runSetContextEffect(env, props, cb, { taskContext }) {
  assignWithSymbols(taskContext, props)
  cb()
}

const effectRunnerMap = {
  [effectTypes.TAKE]: runTakeEffect,
  [effectTypes.PUT]: runPutEffect,
  [effectTypes.ALL]: runAllEffect,
  [effectTypes.RACE]: runRaceEffect,
  [effectTypes.CALL]: runCallEffect,
  [effectTypes.CPS]: runCPSEffect,
  [effectTypes.FORK]: runForkEffect,
  [effectTypes.JOIN]: runJoinEffect,
  [effectTypes.CANCEL]: runCancelEffect,
  [effectTypes.SELECT]: runSelectEffect,
  [effectTypes.ACTION_CHANNEL]: runChannelEffect,
  [effectTypes.CANCELLED]: runCancelledEffect,
  [effectTypes.FLUSH]: runFlushEffect,
  [effectTypes.GET_CONTEXT]: runGetContextEffect,
  [effectTypes.SET_CONTEXT]: runSetContextEffect,
}

export default effectRunnerMap
