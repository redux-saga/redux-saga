import { remove } from '../utils'

export default function join(env, t, cb, { task }) {
  if (t.isRunning()) {
    const joiner = { task, cb }
    cb.cancel = () => remove(t.joiners, joiner)
    t.joiners.push(joiner)
  } else {
    t.isAborted() ? cb(t.error(), true) : cb(t.result())
  }
}
