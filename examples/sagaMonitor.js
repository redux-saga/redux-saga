/*eslint-disable no-console*/

import * as actions from '../src/monitorActions'
import { as } from '../src/io'
import { is } from '../src/utils'

const PENDING = 'PENDING'
const RESOLVED = 'RESOLVED'
const REJECTED = 'REJECTED'


export const LOG_EFFECT = 'LOG_EFFECT'
export const logEffect = (effectId = 0) => ({type: LOG_EFFECT, effectId})

const DEFAULT_STYLE = 'color: black'
const LABEL_STYLE = 'font-weight: bold'
const EFFECT_TYPE_STYLE = 'color: blue'
const ERROR_STYLE = 'color: red'

const time = () => performance.now()

let effectsById = {}
export default () => next => action => {

  switch (action.type) {
    case actions.EFFECT_TRIGGERED:
      effectsById[action.effectId] = {...action,
        status: PENDING,
        start: time()
      }
      break;
    case actions.EFFECT_RESOLVED:
      resolveEffect(action.effectId, action.result)
      break;
    case actions.EFFECT_REJECTED:
      rejectEffect(action.effectId, action.error)
      break;
    case LOG_EFFECT:
      logEffectTree(action.effectId || 0)
      break;
    default:
      return next(action)
  }
}

function resolveEffect(effectId, result) {
  const effect = effectsById[effectId]
  const now = time()

  if(is.task(result)) {
    result._done.then(
      taskResult => resolveEffect(effectId, taskResult),
      taskError  => rejectEffect(effectId, taskError)
    )
  } else {
    effectsById[effectId] = {...effect,
      result: result,
      status: RESOLVED,
      end: now,
      duration: now - effect.start
    }

    if(effect && as.race(effect.effect))
      setRaceWinner(effectId, result)
  }
}

function rejectEffect(effectId, error) {
  const effect = effectsById[effectId]
  const now = time()
  effectsById[effectId] = {...effect,
    error: error,
    status: REJECTED,
    end: now,
    duration: now - effect.start
  }
  if(effect && as.race(effect.effect))
    setRaceWinner(effectId, error)
}

function setRaceWinner(raceEffectId, result) {
  const winnerLabel = Object.keys(result)[0]
  const children = getChildEffects(raceEffectId)
  for (var i = 0; i < children.length; i++) {
    const childEffect = effectsById[ children[i] ]
    if(childEffect.label === winnerLabel)
      childEffect.winner = true
  }
}

function getChildEffects(parentEffectId) {
  return Object.keys(effectsById)
    .filter(effectId => effectsById[effectId].parentEffectId === parentEffectId)
    .map(effectId => +effectId)
}

function logEffectTree(effectId) {
  const effect = effectsById[effectId]
  const childEffects = getChildEffects(effectId)

  if(!childEffects.length)
    logSimpleEffect(effect)
  else {
    if(effect) {
      const {formatter} = getEffectLog(effect)
      console.group(...formatter.getLog())
    } else
      console.group('root')
    childEffects.forEach(logEffectTree)
    console.groupEnd()
  }
}

function logSimpleEffect(effect) {
  const {method, formatter} = getEffectLog(effect)
  console[method](...formatter.getLog())
}

/*eslint-disable no-cond-assign*/
function getEffectLog(effect) {
  let data, log

  if(data = as.take(effect.effect)) {
    log = getLogPrefix('take', effect)
    log.formatter.addValue(data)
    logResult(effect, log.formatter)
  }

  else if(data = as.put(effect.effect)) {
    log = getLogPrefix('put', effect)
    logResult(effect, log.formatter)
  }

  else if(data = as.call(effect.effect)) {
    log = getLogPrefix('call', effect)
    log.formatter.addCall(data.fn.name, data.args)
    logResult(effect, log.formatter)
  }

  else if(data = as.cps(effect.effect)) {
    log = getLogPrefix('cps', effect)
    log.formatter.addCall(data.fn.name, data.args)
    logResult(effect, log.formatter)
  }

  else if(data = as.fork(effect.effect)) {
    log = getLogPrefix('', effect)
    log.formatter.addCall(data.task.name, data.args)
    logResult(effect, log.formatter)
  }

  else if(data = as.join(effect.effect)) {
    log = getLogPrefix('join', effect)
    logResult(effect, log.formatter)
  }

  else if(data = as.race(effect.effect)) {
    log = getLogPrefix('race', effect)
    logResult(effect, log.formatter, true)
  }

  else if(data = is.array(effect.effect)) {
    log = getLogPrefix('parallel', effect)
    logResult(effect, log.formatter, true)
  }

  else {
    log = getLogPrefix('unkown', effect)
    logResult(effect, log.formatter)
  }

  return log
}


function getLogPrefix(type, effect) {

  const isError = effect && effect.status === REJECTED
  const method = isError ? 'error' : 'log'
  const winnerInd = effect && effect.winner
    ? ( isError ? '✘' : '✓' )
    : ''


  const winnerStyle = isError ? ERROR_STYLE : LABEL_STYLE
  const labelStyle = isError ? ERROR_STYLE : LABEL_STYLE
  const typeStyle = isError ? ERROR_STYLE: EFFECT_TYPE_STYLE

  const formatter = logFormatter()

  if(winnerInd)
    formatter.add(`%c ${winnerInd}`, winnerStyle)

  if(effect && effect.label)
    formatter.add(`%c ${effect.label}: `, labelStyle)

  if(type)
    formatter.add(`%c ${type} `, typeStyle)

  formatter.add('%c', DEFAULT_STYLE)

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
    } else
      formatter.appendData('→',result)
  }

  else if(status === REJECTED)
    formatter.appendData('→ ⚠', error)

  else if(status === PENDING)
    formatter.appendData('⌛')

  if(status !== PENDING)
    formatter.appendData(`(${duration.toFixed(2)}ms)`)
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
    logs.push({msg, args})
  }

  function appendData(...data) {
    suffix = suffix.concat(data)
  }

  function addValue(value) {
    if(isPrimitive(value))
      add(value)
    else
      add('%O', value)
  }

  function addCall(name, args) {
    if(!args.length)
      add( `${name}()` )
    else {
      add(name)
      add('(')
      args.forEach( (arg, i) => {
        addValue( argToString(arg) )
        addValue( i === args.length - 1 ? ')' : ', ')
      })
      add(')')
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
