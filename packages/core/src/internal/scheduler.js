const queue = []
/**
  Variable to hold a counting semaphore
  - Incrementing adds a lock and puts the scheduler in a `suspended` state (if it's not
    already suspended)
  - Decrementing releases a lock. Zero locks puts the scheduler in a `released` state. This
    triggers flushing the queued tasks.
**/
let lock = false

/**
  Executes a task 'atomically'. Tasks scheduled during this execution will be queued
  and flushed after this task has finished (assuming the scheduler endup in a released
  state).
**/
// function exec(task) {
//   try {
//     task()
//   }
// }

/**
  Executes or queues a task depending on the state of the scheduler (`suspended` or `released`)
**/
export default function schedule(task) {
  queue.push(task)

  if (!lock) {
    suspend()
    flush()
  }
}

/**
  Puts the scheduler in a `suspended` state. Scheduled tasks will be queued until the
  scheduler is released.
**/
function suspend() {
  lock = true
}

/**
  Puts the scheduler in a `released` state.
**/
function release() {
  lock = false
}

/**
  Releases the current lock. Executes all queued tasks if the scheduler is in the released state.
**/
function flush() {
  let task

  // eslint-disable-next-line no-cond-assign
  while ((task = queue.shift())) {
    task()
  }

  release()
}
