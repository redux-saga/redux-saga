import deferred from '@redux-saga/deferred'
import * as is from '@redux-saga/is'
import { CANCEL, IO, TERMINATE, TASK, TASK_CANCEL, SELF_CANCELLATION } from '@redux-saga/symbols'
import * as effectTypes from './effectTypes'
import {
  noop,
  check,
  uid as nextEffectId,
  array,
  remove,
  object,
  makeIterator,
  createSetContextWarning,
  shouldCancel,
  shouldTerminate,
  createAllStyleChildCallbacks,
  shouldComplete,
} from './utils'

import { getLocation, addSagaStack, sagaStackToString } from './error-utils'

import { asap, suspend, flush } from './scheduler'
import { channel, isEnd } from './channel'
import matcher from './matcher'

export function getMetaInfo(fn) {
  return {
    name: fn.name || 'anonymous',
    location: getLocation(fn),
  }
}

function getIteratorMetaInfo(iterator, fn) {
  if (iterator.isSagaIterator) {
    return { name: iterator.meta.name }
  }
  return getMetaInfo(fn)
}

/**
  Used to track a parent task and its forks
  In the new fork model, forked tasks are attached by default to their parent
  We model this using the concept of Parent task && main Task
  main task is the main flow of the current Generator, the parent tasks is the
  aggregation of the main tasks + all its forked tasks.
  Thus the whole model represents an execution tree with multiple branches (vs the
  linear execution tree in sequential (non parallel) programming)

  A parent tasks has the following semantics
  - It completes if all its forks either complete or all cancelled
  - If it's cancelled, all forks are cancelled as well
  - It aborts if any uncaught error bubbles up from forks
  - If it completes, the return value is the one returned by the main task
**/
function forkQueue(mainTask, onAbort, cb) {
  let tasks = [],
    result,
    completed = false
  addTask(mainTask)
  const getTasks = () => tasks
  const getTaskNames = () => tasks.map(t => t.meta.name)

  function abort(err) {
    onAbort()
    cancelAll()
    cb(err, true)
  }

  function addTask(task) {
    tasks.push(task)
    task.cont = (res, isErr) => {
      if (completed) {
        return
      }

      remove(tasks, task)
      task.cont = noop
      if (isErr) {
        abort(res)
      } else {
        if (task === mainTask) {
          result = res
        }
        if (!tasks.length) {
          completed = true
          cb(result)
        }
      }
    }
    // task.cont.cancel = task.cancel
  }

  function cancelAll() {
    if (completed) {
      return
    }
    completed = true
    tasks.forEach(t => {
      t.cont = noop
      t.cancel()
    })
    tasks = []
  }

  return {
    addTask,
    cancelAll,
    abort,
    getTasks,
    getTaskNames,
  }
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

export default function proc(env, iterator, parentContext, parentEffectId, meta, cont) {
  const taskContext = Object.create(parentContext)
  const finalRunEffect = env.finalizeRunEffect(runEffect)

  let crashedEffect = null
  const cancelledDueToErrorTasks = []
  /**
    Tracks the current effect cancellation
    Each time the generator progresses. calling runEffect will set a new value
    on it. It allows propagating cancellation to child effects
  **/
  next.cancel = noop

  /**
    Creates a new task descriptor for this generator, We'll also create a main task
    to track the main flow (besides other forked tasks)
  **/
  const task = newTask(parentEffectId, meta, cont)
  const mainTask = { meta, cancel: cancelMain, _isRunning: true, _isCancelled: false }

  const taskQueue = forkQueue(
    mainTask,
    function onAbort() {
      cancelledDueToErrorTasks.push(...taskQueue.getTaskNames())
    },
    end,
  )

  /**
    cancellation of the main task. We'll simply resume the Generator with a Cancel
  **/
  function cancelMain() {
    if (mainTask._isRunning && !mainTask._isCancelled) {
      mainTask._isCancelled = true
      next(TASK_CANCEL)
    }
  }

  /**
    This may be called by a parent generator to trigger/propagate cancellation
    cancel all pending tasks (including the main task), then end the current task.

    Cancellation propagates down to the whole execution tree holded by this Parent task
    It's also propagated to all joiners of this task and their execution tree/joiners

    Cancellation is noop for terminated/Cancelled tasks tasks
  **/
  function cancel() {
    /**
      We need to check both Running and Cancelled status
      Tasks can be Cancelled but still Running
    **/
    if (task._isRunning && !task._isCancelled) {
      task._isCancelled = true
      taskQueue.cancelAll()
      /**
        Ending with a Never result will propagate the Cancellation to all joiners
      **/
      end(TASK_CANCEL)
    }
  }
  /**
    attaches cancellation logic to this task's continuation
    this will permit cancellation to propagate down the call chain
  **/
  cont && (cont.cancel = cancel)

  // kicks up the generator
  next()

  // then return the task descriptor to the caller
  return task

  /**
    This is the generator driver
    It's a recursive async/continuation function which calls itself
    until the generator terminates or throws
  **/
  function next(arg, isErr) {
    // Preventive measure. If we end up here, then there is really something wrong
    if (!mainTask._isRunning) {
      throw new Error('Trying to resume an already finished generator')
    }

    try {
      let result
      if (isErr) {
        result = iterator.throw(arg)
      } else if (shouldCancel(arg)) {
        /**
          getting TASK_CANCEL automatically cancels the main task
          We can get this value here

          - By cancelling the parent task manually
          - By joining a Cancelled task
        **/
        mainTask._isCancelled = true
        /**
          Cancels the current effect; this will propagate the cancellation down to any called tasks
        **/
        next.cancel()
        /**
          If this Generator has a `return` method then invokes it
          This will jump to the finally block
        **/
        result = is.func(iterator.return) ? iterator.return(TASK_CANCEL) : { done: true, value: TASK_CANCEL }
      } else if (shouldTerminate(arg)) {
        // We get TERMINATE flag, i.e. by taking from a channel that ended using `take` (and not `takem` used to trap End of channels)
        result = is.func(iterator.return) ? iterator.return() : { done: true }
      } else {
        result = iterator.next(arg)
      }

      if (!result.done) {
        digestEffect(result.value, parentEffectId, '', next)
      } else {
        /**
          This Generator has ended, terminate the main task and notify the fork queue
        **/
        mainTask._isRunning = false
        mainTask.cont(result.value)
      }
    } catch (error) {
      if (mainTask._isCancelled) {
        env.logError(error)
      }
      mainTask._isRunning = false
      mainTask.cont(error, true)
    }
  }

  function end(result, isErr) {
    task._isRunning = false
    // stdChannel.close()

    if (!isErr) {
      task._result = result
      task._deferredEnd && task._deferredEnd.resolve(result)
    } else {
      addSagaStack(result, {
        meta,
        effect: crashedEffect,
        cancelledTasks: cancelledDueToErrorTasks,
      })

      if (!task.cont) {
        if (result && result.sagaStack) {
          result.sagaStack = sagaStackToString(result.sagaStack)
        }

        if (env.onError) {
          env.onError(result)
        } else {
          // TODO: could we skip this when _deferredEnd is attached?
          env.logError(result)
        }
      }
      task._error = result
      task._isAborted = true
      task._deferredEnd && task._deferredEnd.reject(result)
    }
    task.cont && task.cont(result, isErr)
    task.joiners.forEach(j => j.cb(result, isErr))
    task.joiners = null
  }

  function runEffect(effect, effectId, currCb) {
    /**
      each effect runner must attach its own logic of cancellation to the provided callback
      it allows this generator to propagate cancellation downward.

      ATTENTION! effect runners must setup the cancel logic by setting cb.cancel = [cancelMethod]
      And the setup must occur before calling the callback

      This is a sort of inversion of control: called async functions are responsible
      of completing the flow by calling the provided continuation; while caller functions
      are responsible for aborting the current flow by calling the attached cancel function

      Library users can attach their own cancellation logic to promises by defining a
      promise[CANCEL] method in their returned promises
      ATTENTION! calling cancel must have no effect on an already completed or cancelled effect
    **/
    if (is.promise(effect)) {
      resolvePromise(effect, currCb)
    } else if (is.iterator(effect)) {
      resolveIterator(effect, effectId, meta, currCb)
    } else if (effect && effect[IO]) {
      const { type, payload } = effect
      if (type === effectTypes.TAKE) runTakeEffect(payload, currCb)
      else if (type === effectTypes.PUT) runPutEffect(payload, currCb)
      else if (type === effectTypes.ALL) runAllEffect(payload, effectId, currCb)
      else if (type === effectTypes.RACE) runRaceEffect(payload, effectId, currCb)
      else if (type === effectTypes.CALL) runCallEffect(payload, effectId, currCb)
      else if (type === effectTypes.CPS) runCPSEffect(payload, currCb)
      else if (type === effectTypes.FORK) runForkEffect(payload, effectId, currCb)
      else if (type === effectTypes.JOIN) runJoinEffect(payload, currCb)
      else if (type === effectTypes.CANCEL) runCancelEffect(payload, currCb)
      else if (type === effectTypes.SELECT) runSelectEffect(payload, currCb)
      else if (type === effectTypes.ACTION_CHANNEL) runChannelEffect(payload, currCb)
      else if (type === effectTypes.FLUSH) runFlushEffect(payload, currCb)
      else if (type === effectTypes.CANCELLED) runCancelledEffect(payload, currCb)
      else if (type === effectTypes.GET_CONTEXT) runGetContextEffect(payload, currCb)
      else if (type === effectTypes.SET_CONTEXT) runSetContextEffect(payload, currCb)
      else currCb(effect)
    } else {
      // anything else returned as is
      currCb(effect)
    }
  }

  function digestEffect(effect, parentEffectId, label = '', cb) {
    const effectId = nextEffectId()
    env.sagaMonitor && env.sagaMonitor.effectTriggered({ effectId, parentEffectId, label, effect })

    /**
      completion callback and cancel callback are mutually exclusive
      We can't cancel an already completed effect
      And We can't complete an already cancelled effectId
    **/
    let effectSettled

    // Completion callback passed to the appropriate effect runner
    function currCb(res, isErr) {
      if (effectSettled) {
        return
      }

      effectSettled = true
      cb.cancel = noop // defensive measure
      if (env.sagaMonitor) {
        if (isErr) {
          env.sagaMonitor.effectRejected(effectId, res)
        } else {
          env.sagaMonitor.effectResolved(effectId, res)
        }
      }
      if (isErr) {
        crashedEffect = effect
      }
      cb(res, isErr)
    }
    // tracks down the current cancel
    currCb.cancel = noop

    // setup cancellation logic on the parent cb
    cb.cancel = () => {
      // prevents cancelling an already completed effect
      if (effectSettled) {
        return
      }

      effectSettled = true
      /**
        propagates cancel downward
        catch uncaught cancellations errors; since we can no longer call the completion
        callback, log errors raised during cancellations into the console
      **/
      try {
        currCb.cancel()
      } catch (err) {
        env.logError(err)
      }
      currCb.cancel = noop // defensive measure

      env.sagaMonitor && env.sagaMonitor.effectCancelled(effectId)
    }

    finalRunEffect(effect, effectId, currCb)
  }

  function resolvePromise(promise, cb) {
    const cancelPromise = promise[CANCEL]
    if (is.func(cancelPromise)) {
      cb.cancel = cancelPromise
    } else if (is.func(promise.abort)) {
      cb.cancel = () => promise.abort()
    }
    promise.then(cb, error => cb(error, true))
  }

  function resolveIterator(iterator, effectId, meta, cb) {
    proc(env, iterator, taskContext, effectId, meta, cb)
  }

  function runTakeEffect({ channel = env.stdChannel, pattern, maybe }, cb) {
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

  function runPutEffect({ channel, action, resolve }, cb) {
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

  function runCallEffect({ context, fn, args }, effectId, cb) {
    // catch synchronous failures; see #152
    try {
      const result = fn.apply(context, args)

      if (is.promise(result)) {
        resolvePromise(result, cb)
        return
      }

      if (is.iterator(result)) {
        resolveIterator(result, effectId, getMetaInfo(fn), cb)
        return
      }

      cb(result)
    } catch (error) {
      cb(error, true)
    }
  }

  function runCPSEffect({ context, fn, args }, cb) {
    // CPS (ie node style functions) can define their own cancellation logic
    // by setting cancel field on the cb

    // catch synchronous failures; see #152
    try {
      const cpsCb = (err, res) => (is.undef(err) ? cb(res) : cb(err, true))
      fn.apply(context, args.concat(cpsCb))
      if (cpsCb.cancel) {
        cb.cancel = () => cpsCb.cancel()
      }
    } catch (error) {
      cb(error, true)
    }
  }

  function runForkEffect({ context, fn, args, detached }, effectId, cb) {
    const taskIterator = createTaskIterator({ context, fn, args })
    const meta = getIteratorMetaInfo(taskIterator, fn)
    try {
      suspend()
      const task = proc(env, taskIterator, taskContext, effectId, meta, detached ? null : noop)

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
    } finally {
      flush()
    }
    // Fork effects are non cancellables
  }

  function runJoinEffect(taskOrTasks, cb) {
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

  function runCancelEffect(taskOrTasks, cb) {
    if (taskOrTasks === SELF_CANCELLATION) {
      cancelSingleTask(task)
    } else if (is.array(taskOrTasks)) {
      taskOrTasks.forEach(cancelSingleTask)
    } else {
      cancelSingleTask(taskOrTasks)
    }
    cb()
    // cancel effects are non cancellables
  }

  function cancelSingleTask(taskToCancel) {
    if (taskToCancel.isRunning()) {
      taskToCancel.cancel()
    }
  }

  function runAllEffect(effects, effectId, cb) {
    const keys = Object.keys(effects)
    if (keys.length === 0) {
      cb(is.array(effects) ? [] : {})
      return
    }

    const childCallbacks = createAllStyleChildCallbacks(effects, cb)
    keys.forEach(key => digestEffect(effects[key], effectId, key, childCallbacks[key]))
  }

  function runRaceEffect(effects, effectId, cb) {
    let completed
    const keys = Object.keys(effects)
    const childCbs = {}

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
          const response = { [key]: res }
          cb(is.array(effects) ? array.from({ ...response, length: keys.length }) : response)
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
      digestEffect(effects[key], effectId, key, childCbs[key])
    })
  }

  function runSelectEffect({ selector, args }, cb) {
    try {
      const state = selector(env.getState(), ...args)
      cb(state)
    } catch (error) {
      cb(error, true)
    }
  }

  function runChannelEffect({ pattern, buffer }, cb) {
    // TODO: rethink how END is handled
    const chan = channel(buffer)
    const match = matcher(pattern)

    const taker = action => {
      if (!isEnd(action)) {
        env.stdChannel.take(taker, match)
      }
      chan.put(action)
    }

    env.stdChannel.take(taker, match)
    cb(chan)
  }

  function runCancelledEffect(data, cb) {
    cb(Boolean(mainTask._isCancelled))
  }

  function runFlushEffect(channel, cb) {
    channel.flush(cb)
  }

  function runGetContextEffect(prop, cb) {
    cb(taskContext[prop])
  }

  function runSetContextEffect(props, cb) {
    object.assign(taskContext, props)
    cb()
  }

  function newTask(id, meta, cont) {
    const task = {
      [TASK]: true,
      id,
      meta,
      _deferredEnd: null,
      toPromise() {
        if (task._deferredEnd) {
          return task._deferredEnd.promise
        }

        const def = deferred()
        task._deferredEnd = def

        if (!task._isRunning) {
          if (task._isAborted) {
            def.reject(task._error)
          } else {
            def.resolve(task._result)
          }
        }

        return def.promise
      },
      cont,
      joiners: [],
      cancel,
      _isRunning: true,
      _isCancelled: false,
      _isAborted: false,
      _result: undefined,
      _error: undefined,
      isRunning: () => task._isRunning,
      isCancelled: () => task._isCancelled,
      isAborted: () => task._isAborted,
      result: () => task._result,
      error: () => task._error,
      setContext(props) {
        if (process.env.NODE_ENV === 'development') {
          check(props, is.object, createSetContextWarning('task', props))
        }

        object.assign(taskContext, props)
      },
    }
    return task
  }
}
