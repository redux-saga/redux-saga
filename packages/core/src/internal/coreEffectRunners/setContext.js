import { object } from '../utils'

export default function setContext(env, props, cb, { taskContext }) {
  object.assign(taskContext, props)
  cb()
}
