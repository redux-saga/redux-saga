
import { span } from './utils'

export default function actionQueue() {

  let queue = []

  function query(q) {
    return new Promise( resolve => queue.push({resolve, q}) )
  }

  function dispatch(action) {
    const [matching, notMatching] = span(queue, it => it.q.match(action))
    queue = notMatching
    matching.forEach( it => it.resolve(action) )
  }

  function remove(predicate) {
    queue = queue.filter(it => !predicate(it.q))
  }

  return { query, dispatch, remove }

}
