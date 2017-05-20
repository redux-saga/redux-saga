export const sym = id => `@@redux-saga/${id}`

export const TASK = sym('TASK')
export const HELPER = sym('HELPER')
export const MATCH = sym('MATCH')
export const CANCEL = sym('CANCEL_PROMISE')
export const SAGA_ACTION = sym('SAGA_ACTION')
export const SELF_CANCELLATION = sym('SELF_CANCELLATION')
export const konst = v => () => v
export const kTrue = konst(true)
export const kFalse = konst(false)
export const noop = () => {}
export const ident = v => v

export function check(value, predicate, error) {
  if (!predicate(value)) {
    log('error', 'uncaught at check', error)
    throw new Error(error)
  }
}

const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn(object, property) {
  return is.notUndef(object) && hasOwnProperty.call(object, property)
}

export const is = {
  undef: v => v === null || v === undefined,
  notUndef: v => v !== null && v !== undefined,
  func: f => typeof f === 'function',
  number: n => typeof n === 'number',
  string: s => typeof s === 'string',
  array: Array.isArray,
  object: obj => obj && !is.array(obj) && typeof obj === 'object',
  promise: p => p && is.func(p.then),
  iterator: it => it && is.func(it.next) && is.func(it.throw),
  iterable: it => (it && is.func(Symbol) ? is.func(it[Symbol.iterator]) : is.array(it)),
  task: t => t && t[TASK],
  observable: ob => ob && is.func(ob.subscribe),
  buffer: buf => buf && is.func(buf.isEmpty) && is.func(buf.take) && is.func(buf.put),
  pattern: pat => pat && (is.string(pat) || typeof pat === 'symbol' || is.func(pat) || is.array(pat)),
  channel: ch => ch && is.func(ch.take) && is.func(ch.close),
  helper: it => it && it[HELPER],
  stringableFunc: f => is.func(f) && hasOwn(f, 'toString'),
}

export const object = {
  assign(target, source) {
    for (let i in source) {
      if (hasOwn(source, i)) {
        target[i] = source[i]
      }
    }
  },
}

export function remove(array, item) {
  const index = array.indexOf(item)
  if (index >= 0) {
    array.splice(index, 1)
  }
}

export const array = {
  from(obj) {
    const arr = Array(obj.length)
    for (let i in obj) {
      if (hasOwn(obj, i)) {
        arr[i] = obj[i]
      }
    }
    return arr
  },
}

export function deferred(props = {}) {
  let def = { ...props }
  const promise = new Promise((resolve, reject) => {
    def.resolve = resolve
    def.reject = reject
  })
  def.promise = promise
  return def
}

export function arrayOfDeffered(length) {
  const arr = []
  for (let i = 0; i < length; i++) {
    arr.push(deferred())
  }
  return arr
}

export function delay(ms, val = true) {
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

    setRunning: b => (running = b),
    setResult: r => (result = r),
    setError: e => (error = e),
  }
}

export function autoInc(seed = 0) {
  return () => ++seed
}

export const uid = autoInc()

const kThrow = err => {
  throw err
}
const kReturn = value => ({ value, done: true })
export function makeIterator(next, thro = kThrow, name = '', isHelper) {
  const iterator = { name, next, throw: thro, return: kReturn }

  if (isHelper) {
    iterator[HELPER] = true
  }
  if (typeof Symbol !== 'undefined') {
    iterator[Symbol.iterator] = () => iterator
  }
  return iterator
}

/**
  Print error in a useful way whether in a browser environment
  (with expandable error stack traces), or in a node.js environment
  (text-only log output)
 **/
export function log(level, message, error = '') {
  /*eslint-disable no-console*/
  if (typeof window === 'undefined') {
    console.log(`redux-saga ${level}: ${message}\n${(error && error.stack) || error}`)
  } else {
    console[level](message, error)
  }
}

export function deprecate(fn, deprecationWarning) {
  return (...args) => {
    if (process.env.NODE_ENV === 'development') log('warn', deprecationWarning)
    return fn(...args)
  }
}

export const updateIncentive = (deprecated, preferred) =>
  `${deprecated} has been deprecated in favor of ${preferred}, please update your code`

export const internalErr = err =>
  new Error(
    `
  redux-saga: Error checking hooks detected an inconsistent state. This is likely a bug
  in redux-saga code and not yours. Thanks for reporting this in the project's github repo.
  Error: ${err}
`,
  )

export const createSetContextWarning = (ctx, props) =>
  `${ctx ? ctx + '.' : ''}setContext(props): argument ${props} is not a plain object`

export const wrapSagaDispatch = dispatch => action =>
  dispatch(Object.defineProperty(action, SAGA_ACTION, { value: true }))

export const cloneableGenerator = generatorFunc => (...args) => {
  const history = []
  const gen = generatorFunc(...args)
  return {
    next: arg => {
      history.push(arg)
      return gen.next(arg)
    },
    clone: () => {
      const clonedGen = cloneableGenerator(generatorFunc)(...args)
      history.forEach(arg => clonedGen.next(arg))
      return clonedGen
    },
    return: value => gen.return(value),
    throw: exception => gen.throw(exception),
  }
}
