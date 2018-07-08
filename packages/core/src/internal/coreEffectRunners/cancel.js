import { SELF_CANCELLATION } from '../symbols'

export default function cancel(env, taskToCancel, cb, { task }) {
  if (taskToCancel === SELF_CANCELLATION) {
    taskToCancel = task
  }
  if (taskToCancel.isRunning()) {
    taskToCancel.cancel()
  }
  cb()
  // cancel effects are non cancellables
}
