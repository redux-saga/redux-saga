export default function runCancelledEffect(env, effectPayload, cb, { mainTask }) {
  cb(Boolean(mainTask._isCancelled))
}
