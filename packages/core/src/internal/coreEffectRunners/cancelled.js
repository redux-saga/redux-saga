export default function runCancelledEffect(env, payload, cb, { mainTask }) {
  cb(mainTask._isCancelled)
}
