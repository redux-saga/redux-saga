const queue = []
let isExecuting = false

export default function asap(task) {
  //console.log('asap', isExecuting, queue)
  if(!isExecuting) {
    isExecuting = true
    queue.push(task)
    asap.flush()
    isExecuting = false
  } else {
    queue.push(task)
  }
}

asap.suspend = () => isExecuting = true
asap.flush = () => {
  //console.log('flush', isExecuting, queue)
  let nextTask
  while((nextTask = queue.shift())) {
    nextTask()
  }
  isExecuting = false
}
