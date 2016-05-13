export const sym = id => `@@redux-saga/${id}`
export const TASK  = sym('TASK')
export const MATCH = sym('MATCH')
export const CANCEL = sym('cancelPromise')
export const konst = v => () => v
export const kTrue = konst(true)
export const kFalse = konst(false)
export const noop = () => {}
export const ident = v => v

export function check(value, predicate, error) {
  if(!predicate(value)) {
    log('error', 'uncaught at check', error)
    throw new Error(error)
  }
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
  take      : ch => ch && is.func(ch.take),
  put       : ch => ch && is.func(ch.put),
  observable: ob => ob && is.func(ob.subscribe),
  buffer    : buf => buf && is.func(buf.isEmpty) && is.func(buf.take) && is.func(buf.put),
  pattern   : pat => pat && ((typeof pat === 'string') || is.func(pat) || is.array(pat))
}

export function remove(array, item) {
  const index = array.indexOf(item)
  if(index >= 0) {
    array.splice(index, 1)
  }
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
  let timeoutId
  const promise = new Promise(resolve => {
    timeoutId = setTimeout(() => resolve(val), ms)
  })

  promise[CANCEL] = () => clearTimeout(timeoutId)

  return promise
}

export function createMockTask() {
  let running = true
  let result, error

  return {
    [TASK]: true,
    isRunning: () => running,
    result: () => result,
    error: () => error,

    setRunning : b => running = b,
    setResult  : r => result = r,
    setError   : e => error = e
  }
}

export function autoInc(seed = 0) {
  return () => ++seed
}

const kThrow = err => { throw err }
export function makeIterator(next, thro = kThrow, name = '') {
  const iterator = {name, next, throw: thro}
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
  if(typeof window === 'undefined') {
    console.log(`redux-saga ${level}: ${message}\n${(error && error.stack) || error}`)
  } else {
    if (level === 'error') {
      setTimeout(() => { throw error })
    }
    console[level].call(console, message, error)
  }
}

export const internalErr = err => new Error(`
  redux-saga: Error checking hooks detected an inconsisten state. This is likely a bug
  in redux-saga code and not yours. Thanks for reporting this in the project's github repo.
  Error: ${err}
`)
