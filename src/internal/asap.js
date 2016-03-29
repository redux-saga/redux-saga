const queue = []
let isSuspended = false

export default function asap(task) {
  if(!isSuspended) {
    isSuspended = true
    queue.push(task)
    asap.flush()
  } else {
    queue.push(task)
  }
}

asap.suspend = () => isSuspended = true
asap.flush = () => {
  let nextTask
  while((nextTask = queue.shift())) {
    nextTask()
  }
  isSuspended = false
}
