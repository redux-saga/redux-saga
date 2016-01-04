export const TASK  = Symbol('TASK')
export const kTrue = () => true
export const noop = () => {}

export function check(value, predicate, error) {
  if(! predicate(value) )
    throw new Error(error)
}

function* sampleGen() {}
const genConstructor = sampleGen.constructor

export const is = {
  undef     : v => v === null || v === undefined,
  func      : f => typeof f === 'function',
  array     : Array.isArray,
  promise   : p => p && typeof p.then === 'function',
  generator : g => is.func(g) && g.constructor === genConstructor,
  iterator  : it => it && typeof it.next === 'function',
  throw     : it => it && typeof it.throw === 'function',
  task      : it => it && it[TASK]
}

export function remove(array, item) {
  const index = array.indexOf(item)
  if(index >= 0)
    array.splice(index, 1)
}

export function deferred(props = {}) {
  let def = {...props}
  const promise = new Promise((resolve, reject) => {
    def.resolve = resolve
    def.reject = reject
  })
  def.promise = promise
  return def
}

export function arrayOfDeffered(length) {
  const arr = []
  for (var i = 0; i < length; i++) {
    arr.push(deferred())
  }
  return arr
}

export function autoInc(seed = 0) {
  return () => ++seed
}

export function asap(action) {
  return Promise.resolve(1).then( () => action() )
}
