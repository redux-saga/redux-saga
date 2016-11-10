/*eslint-disable no-console*/

import { is, asEffect } from 'redux-saga/utils'

const PENDING = 'PENDING'
const RESOLVED = 'RESOLVED'
const REJECTED = 'REJECTED'
const CANCELLED = 'CANCELLED'

const DEFAULT_STYLE = 'color: black'
const LABEL_STYLE = 'font-weight: bold'
const EFFECT_TYPE_STYLE = 'color: blue'
const ERROR_STYLE = 'color: red'
const CANCEL_STYLE = 'color: #ccc'

const IS_BROWSER = (typeof window !== 'undefined' && window.document)

const globalScope = (
  typeof window.document === 'undefined' && navigator.product === 'ReactNative' ? global
  : IS_BROWSER ? window
  : null
)

// `VERBOSE` can be made a setting configured from the outside.
const VERBOSE = false

function time() {
  if(typeof performance !== 'undefined' && performance.now) {
    return performance.now()
  } else {
    return Date.now()
  }
}

let effectsById = {}
const rootEffects = []

function effectTriggered(desc) {
  if (VERBOSE) {
    console.log('Saga monitor: effectTriggered:', desc)
  }
  effectsById[desc.effectId] = Object.assign({},
    desc,
    {
      status: PENDING,
      start: time()
    }
  )
  if(desc.root) {
    rootEffects.push(desc.effectId)
  }
}

function effectResolved(effectId, result) {
  if (VERBOSE) {
    console.log('Saga monitor: effectResolved:', effectId, result)
  }
  resolveEffect(effectId, result)
}

function effectRejected(effectId, error) {
  if (VERBOSE) {
    console.log('Saga monitor: effectRejected:', effectId, error)
  }
  rejectEffect(effectId, error)
}

function effectCancelled(effectId) {
  if (VERBOSE) {
    console.log('Saga monitor: effectCancelled:', effectId)
  }
  cancelEffect(effectId)
}

function computeEffectDur(effect) {
  const now = time()
  Object.assign(effect, {
    end: now,
    duration: now - effect.start
  })
}

function resolveEffect(effectId, result) {
  const effect = effectsById[effectId]

  if(is.task(result)) {
    result.done.then(
      taskResult => {
        if(result.isCancelled()) {
          cancelEffect(effectId)
        } else {
          resolveEffect(effectId, taskResult)
        }
      },
      taskError  => rejectEffect(effectId, taskError)
    )
  } else {
    computeEffectDur(effect)
    effect.status = RESOLVED
    effect.result = result
    if(effect && asEffect.race(effect.effect)) {
      setRaceWinner(effectId, result)
    }
  }
}

function rejectEffect(effectId, error) {
  const effect = effectsById[effectId]
  computeEffectDur(effect)
  effect.status = REJECTED
  effect.error = error
  if(effect && asEffect.race(effect.effect)) {
    setRaceWinner(effectId, error)
  }
}

function cancelEffect(effectId) {
  const effect = effectsById[effectId]
  computeEffectDur(effect)
  effect.status = CANCELLED
}

function setRaceWinner(raceEffectId, result) {
  const winnerLabel = Object.keys(result)[0]
  const children = getChildEffects(raceEffectId)
  for (var i = 0; i < children.length; i++) {
    const childEffect = effectsById[ children[i] ]
    if(childEffect.label === winnerLabel) {
      childEffect.winner = true
    }
  }
}

function getChildEffects(parentEffectId) {
  return Object.keys(effectsById)
    .filter(effectId => effectsById[effectId].parentEffectId === parentEffectId)
    .map(effectId => +effectId)
}

// Poor man's `console.group` and `console.groupEnd` for Node.
// Can be overridden by the `console-group` polyfill.
// The poor man's groups look nice, too, so whether to use
// the polyfilled methods or the hand-made ones can be made a preference.
let groupPrefix = '';
const GROUP_SHIFT = '   ';
const GROUP_ARROW = '▼';

function consoleGroup(...args) {
  if(console.group) {
    console.group(...args)
  } else {
    console.log('')
    console.log(groupPrefix + GROUP_ARROW, ...args)
    groupPrefix += GROUP_SHIFT
  }
}

function consoleGroupEnd() {
  if(console.groupEnd) {
    console.groupEnd()
  } else {
    groupPrefix = groupPrefix.substr(0, groupPrefix.length - GROUP_SHIFT.length)
  }
}

function logEffects(topEffects) {
  topEffects.forEach(logEffectTree)
}

function logEffectTree(effectId) {
  const effect = effectsById[effectId]
  const childEffects = getChildEffects(effectId)

  if(!childEffects.length) {
    logSimpleEffect(effect)
  } else {
    const {formatter} = getEffectLog(effect)
    consoleGroup(...formatter.getLog())
    childEffects.forEach(logEffectTree)
    consoleGroupEnd()
  }
}

function logSimpleEffect(effect) {
  const {method, formatter} = getEffectLog(effect)
  console[method](...formatter.getLog())
}

/*eslint-disable no-cond-assign*/
function getEffectLog(effect) {
  let data, log

  if(effect.root) {
    data = effect.effect
    log = getLogPrefix('run', effect)
    log.formatter.addCall(data.saga.name, data.args)
    logResult(effect, log.formatter)
  }
  else if(data = asEffect.take(effect.effect)) {
    log = getLogPrefix('take', effect)
    log.formatter.addValue(data)
    logResult(effect, log.formatter)
  }
  else if(data = asEffect.put(effect.effect)) {
    log = getLogPrefix('put', effect)
    logResult(Object.assign({}, effect, { result: data }), log.formatter)
  }
  else if(data = asEffect.call(effect.effect)) {
    log = getLogPrefix('call', effect)
    log.formatter.addCall(data.fn.name, data.args)
    logResult(effect, log.formatter)
  }
  else if(data = asEffect.cps(effect.effect)) {
    log = getLogPrefix('cps', effect)
    log.formatter.addCall(data.fn.name, data.args)
    logResult(effect, log.formatter)
  }
  else if(data = asEffect.fork(effect.effect)) {
    if(!data.detached) {
      log = getLogPrefix('fork', effect)
    } else {
      log = getLogPrefix('spawn', effect)
    }
    log.formatter.addCall(data.fn.name, data.args)
    logResult(effect, log.formatter)
  }
  else if(data = asEffect.join(effect.effect)) {
    log = getLogPrefix('join', effect)
    logResult(effect, log.formatter)
  }
  else if(data = asEffect.race(effect.effect)) {
    log = getLogPrefix('race', effect)
    logResult(effect, log.formatter, true)
  }
  else if(data = asEffect.cancel(effect.effect)) {
    log = getLogPrefix('cancel', effect)
    log.formatter.appendData(data.name)
  }
  else if(data = asEffect.select(effect.effect)) {
    log = getLogPrefix('select', effect)
    log.formatter.addCall(data.selector.name, data.args)
    logResult(effect, log.formatter)
  }
  else if(is.array(effect.effect)) {
    log = getLogPrefix('parallel', effect)
    logResult(effect, log.formatter, true)
  }
  else if(is.iterator(effect.effect)) {
    log = getLogPrefix('', effect)
    log.formatter.addValue(effect.effect.name)
    logResult(effect, log.formatter, true)
  }
  else {
    log = getLogPrefix('unkown', effect)
    logResult(effect, log.formatter)
  }

  return log
}


function getLogPrefix(type, effect) {

  const isCancel = effect.status === CANCELLED
  const isError = effect.status === REJECTED

  const method = isError ? 'error' : 'log'
  const winnerInd = effect && effect.winner
    ? ( isError ? '✘' : '✓' )
    : ''

  const style = s =>
      isCancel  ? CANCEL_STYLE
    : isError     ? ERROR_STYLE
    : s

  const formatter = logFormatter()

  if(winnerInd) {
    formatter.add(`%c ${winnerInd}`, style(LABEL_STYLE))
  }
  if(effect && effect.label) {
    formatter.add(`%c ${effect.label}: `,  style(LABEL_STYLE))
  }
  if(type) {
    formatter.add(`%c ${type} `, style(EFFECT_TYPE_STYLE))
  }
  formatter.add('%c', style(DEFAULT_STYLE))

  return {
    method,
    formatter
  }
}

function argToString(arg) {
  return (
      typeof arg === 'function' ? `${arg.name}`
    : typeof arg === 'string'   ? `'${arg}'`
    : arg
  )
}

function logResult({status, result, error, duration}, formatter, ignoreResult) {

  if(status === RESOLVED && !ignoreResult) {
    if( is.array(result) ) {
      formatter.addValue(' → ')
      formatter.addValue(result)
    } else {
      formatter.appendData('→',result)
    }
  }
  else if(status === REJECTED) {
    formatter.appendData('→ ⚠', error)
  }
  else if(status === PENDING) {
    formatter.appendData('⌛')
  }
  else if(status === CANCELLED) {
    formatter.appendData('→ Cancelled!')
  }
  if(status !== PENDING) {
    formatter.appendData(`(${duration.toFixed(2)}ms)`)
  }
}

function isPrimitive(val) {
  return  typeof val === 'string'   ||
          typeof val === 'number'   ||
          typeof val === 'boolean'  ||
          typeof val === 'symbol'   ||
          val === null              ||
          val === undefined;
}

function logFormatter() {
  const logs = []
  let suffix = []

  function add(msg, ...args) {
    // Remove the `%c` CSS styling that is not supported by the Node console.
    if(!IS_BROWSER && typeof msg === 'string') {
      const prevMsg = msg
      msg = msg.replace(/^%c\s*/, '')
      if(msg !== prevMsg) {
        // Remove the first argument which is the CSS style string.
        args.shift()
      }
    }
    logs.push({msg, args})
  }

  function appendData(...data) {
    suffix = suffix.concat(data)
  }

  function addValue(value) {
    if(isPrimitive(value)) {
      add(value)
    } else {
      // The browser console supports `%O`, the Node console does not.
      if(IS_BROWSER) {
        add('%O', value)
      } else {
        add('%s', require('util').inspect(value))
      }
    }
  }

  function addCall(name, args) {
    if(!args.length) {
      add( `${name}()` )
    } else {
      add(name)
      add('(')
      args.forEach( (arg, i) => {
        addValue( argToString(arg) )
        addValue( i === args.length - 1 ? ')' : ', ')
      })
    }
  }

  function getLog() {
    let msgs = [], msgsArgs = []
    for (var i = 0; i < logs.length; i++) {
      msgs.push(logs[i].msg)
      msgsArgs = msgsArgs.concat(logs[i].args)
    }
    return [msgs.join('')].concat(msgsArgs).concat(suffix)
  }

  return {
    add, addValue, addCall, appendData, getLog
  }
}

const logSaga = (...topEffects) => {
  if(!topEffects.length) {
    topEffects = rootEffects
  }
  if(!rootEffects.length) {
    console.log(groupPrefix, 'Saga monitor: No effects to log')
  }
  console.log('')
  console.log('Saga monitor:', Date.now(), (new Date()).toISOString())
  logEffects(topEffects)
  console.log('')
}

// Export the snapshot-logging function to run from the browser console or extensions.
if(globalScope) {
  globalScope.$$LogSagas = logSaga
}

// Export the snapshot-logging function for arbitrary use by external code.
export { logSaga }

// Export the `sagaMonitor` to pass to the middleware.
export default {
  effectTriggered,
  effectResolved,
  effectRejected,
  effectCancelled,
  actionDispatched: () => {}
 }
