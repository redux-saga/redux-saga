import proc from '../proc'
import { flush, suspend } from '../scheduler'
import { is, makeIterator, noop } from '../utils'
import { getMetaInfo } from '../error-utils'

function createTaskIterator({ context, fn, args }) {
  // catch synchronous failures; see #152 and #441
  let result, error
  try {
    result = fn.apply(context, args)
  } catch (err) {
    error = err
  }

  // i.e. a generator function returns an iterator
  if (is.iterator(result)) {
    return result
  }

  // do not bubble up synchronous failures for detached forks
  // instead create a failed task. See #152 and #441
  return error
    ? makeIterator(() => {
        throw error
      })
    : makeIterator(
        (function() {
          let pc
          const eff = { done: false, value: result }
          const ret = value => ({ done: true, value })
          return arg => {
            if (!pc) {
              pc = true
              return eff
            } else {
              return ret(arg)
            }
          }
        })(),
      )
}

function getIteratorMetaInfo(iterator, fn) {
  if (iterator.isSagaIterator) {
    return { name: iterator.meta.name }
  }
  return getMetaInfo(fn)
}

export default function fork(env, { context, fn, args, detached }, cb, { effectId, taskContext, taskQueue }) {
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
