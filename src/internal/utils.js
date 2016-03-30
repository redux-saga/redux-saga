export const sym = id => `@@redux-saga/${id}`

export const TASK  = sym('TASK')
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
  array     : Array.isArray,
  promise   : p => p && is.func(p.then),
  iterator  : it => it && is.func(it.next) && is.func(it.throw),
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

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function autoInc(seed = 0) {
  return () => ++seed
}

/**
  Print error in a useful way whether in a browser environment
  (with expandable error stack traces), or in a node.js environment
  (text-only log output)
 **/
export function log(level, message, error) {
  /*eslint-disable no-console*/
  if (typeof window === 'undefined') {
    console.log(`redux-saga ${level}: ${message}\n${error.stack}`)
  } else {
    console[level].call(console, message, error)
  }
}
