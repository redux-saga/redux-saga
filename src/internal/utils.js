export const sym = (id) => `@@redux-saga/${id}`
export const TASK  = sym('TASK')
export const MATCH = sym('MATCH')
export const kTrue = () => true
export const noop = () => {}
export function ident(v) {
  return v
}

export const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development'

export function check(value, predicate, error) {
  if(! predicate(value) )
    throw new Error(error)
}

export const is = {
  undef     : v => v === null || v === undefined,
  notUndef  : v => v !== null && v !== undefined,
  func      : f => typeof f === 'function',
  number    : n => typeof n === 'number',
  array     : Array.isArray,
  promise   : p => p && is.func(p.then),
  iterator  : it => it && is.func(it.next) && is.func(it.throw),
  task      : t => t && t[TASK],
  channel   : ch => ch && is.func(ch.take),
  buffer    : buf => buf && is.func(buf.isEmpty) && is.func(buf.isFull) && is.func(buf.take) && is.func(buf.put)
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

export function delay(ms, val=true) {
  return new Promise((resolve) => setTimeout(() => resolve(val), ms))
}

export function autoInc(seed = 0) {
  return () => ++seed
}

const kThrow = err => { throw err }
export function makeIterator(next, thro = kThrow, name='') {
  const iterator = { name, next, throw: thro  }
  if(typeof Symbol !== 'undefined') {
    iterator[Symbol.iterator] = () => iterator
  }
  return iterator
}

/**
  Print error in a useful way whether in a browser environment
  (with expandable error stack traces), or in a node.js environment
  (text-only log output)
 **/
export function log(level, message, error) {
  /*eslint-disable no-console*/
  if (typeof window === 'undefined') {
    console.log(`redux-saga ${level}: ${message}\n${error.stack || error}`)
  } else {
    console[level].call(console, message, error)
  }
}

export const internalErr = (err) => new Error(`
  redux-saga: Error checking hooks detected an inconsisten state. This is likely a bug
  in redux-saga code and not yours. Thanks for reporting this in the project's github repo.
  Error: ${err}
`)
