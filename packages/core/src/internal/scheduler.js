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
  Puts the scheduler in a `suspended` state. Scheduled tasks will be queued until the
  scheduler is released.
**/
function suspend() {
  semaphore++
}

/**
  Puts the scheduler in a `released` state.
**/
function release() {
  semaphore--
}

/**
  Executes a task 'atomically'. Tasks scheduled during this execution will be queued
  and flushed after this task has finished (assuming the scheduler endup in a released
  state).
**/
function exec(task) {
  try {
    suspend()
    return task()
  } finally {
    release()
  }
}

/**
  Queues a task and flush.
**/
export function asap(task) {
  queue.push(task)
  flush()
}

/**
  Executes a task immediately and flush.
 */
export function immediately(task) {
  try {
    return exec(task)
  } finally {
    flush()
  }
}

/**
  Executes all queued tasks if the scheduler is in the released state.
**/
function flush() {
  let task
  while (!semaphore && (task = queue.shift()) !== undefined) {
    exec(task)
  }
}
