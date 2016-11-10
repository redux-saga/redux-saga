const queue = []
let semaphore = 0

export default function asap(task) {
  if(!semaphore) {
    //console.log('suspend + flush')
    asap.suspend()
    task()
    asap.flush()
  } else {
    //console.log('queue task')
    queue.push(task)
  }
}

asap.suspend = () => {
  //console.log('suspend')
  semaphore++
}

asap.flush = () => {
  //console.log('flush start')
  semaphore--
  while(!semaphore && queue.length) {
    const nextTask = queue.shift()
    semaphore++
    nextTask()
    semaphore--
  }
  //console.log('flush end')
}
