import { noop, remove } from './utils'
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
export default function forkQueue(name, mainTask, cb) {
  let tasks = [],
    result,
    completed = false
  addTask(mainTask)

  function abort(err) {
    cancelAll()
    cb(err, true)
  }

  function addTask(task) {
    tasks.push(task)
    task.continuation = (res, isErr) => {
      if (completed) {
        return
      }

      remove(tasks, task)
      task.continuation = noop
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
  }

  function cancelAll() {
    if (completed) {
      return
    }
    completed = true
    tasks.forEach(t => {
      t.continuation = noop
      t.cancel()
    })
    tasks = []
  }

  return {
    addTask,
    cancelAll,
    abort,
    getTasks: () => tasks,
    taskNames: () => tasks.map(t => t.name),
  }
}
