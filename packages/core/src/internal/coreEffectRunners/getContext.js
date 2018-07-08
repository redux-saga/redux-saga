export default function getContext(env, prop, cb, { taskContext }) {
  cb(taskContext[prop])
}
