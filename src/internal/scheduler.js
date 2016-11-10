
const queue = []
/**
  Variable to hold a counting semaphore
  - Incrementing adds a lock and puts the scheduler in a `suspended` state (if it's not
    already suspended)
  - Decrementing releases a lock. Zero locks puts the scheduler in a `released` state. This
    triggers flushing the queued tasks.
**/
let semaphore = 0

/**
  Executes a task 'atomically'. Tasks scheduled during this execution will be queued
  and flushed after this task has finished (assuming the scheduler endup in a released
  state).
**/
function exec(task) {
  try {
    suspend()
    task()
  } finally {
    flush()
  }
}

/**
  Executes or queues a task depending on the state of the scheduler (`suspended` or `released`)
**/
export function asap(task) {
  if(!semaphore) {
    exec(task)
  } else {
    queue.push(task)
  }
}

/**
  Puts the scheduler in a `suspended` state. Scheduled tasks will be queued until the
  scheduler is released.
**/
export function suspend() {
  semaphore++
}

/**
  Releases the current lock. Executes all queued tasks if the scheduler is in the released state.
**/
export function flush() {
  semaphore--
  if(!semaphore && queue.length) {
    exec(queue.shift())
  }
}
