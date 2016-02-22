/*eslint-disable no-console*/

import { SagaCancellationException } from 'redux-saga'

import {
  monitorActions as actions,
  is, asEffect,
  MANUAL_CANCEL
} from 'redux-saga/utils'

const PENDING = 'PENDING'
const RESOLVED = 'RESOLVED'
const REJECTED = 'REJECTED'



export const LOG_EFFECT = 'LOG_EFFECT'
export const logEffect = (effectId = 0) => ({type: LOG_EFFECT, effectId})

const DEFAULT_STYLE = 'color: black'
const LABEL_STYLE = 'font-weight: bold'
const EFFECT_TYPE_STYLE = 'color: blue'
const ERROR_STYLE = 'color: red'
const AUTO_CANCEL_STYLE = 'color: lightgray'

const time = () => performance.now()
const env = process.env.NODE_ENV

function checkEnv() {
  if (env !== 'production' && env !== 'development') {
    console.error('Saga Monitor cannot be used outside of NODE_ENV === \'development\'. ' +
      'Consult tools such as loose-envify (https://github.com/zertosh/loose-envify) for browserify ' +
      'and DefinePlugin for webpack (http://stackoverflow.com/questions/30030031) ' +
      'to build with proper NODE_ENV')
  }
}

let effectsById = {}
export default () => next => action => {

  switch (action.type) {
    case actions.EFFECT_TRIGGERED:
      effectsById[action.effectId] = Object.assign({},
        action,
        {
          status: PENDING,
          start: time()
        }
      )
      break;
    case actions.EFFECT_RESOLVED:
      resolveEffect(action.effectId, action.result)
      break;
    case actions.EFFECT_REJECTED:
      rejectEffect(action.effectId, action.error)
      break;
    case LOG_EFFECT:
      checkEnv()
      logEffectTree(action.effectId || 0)
      break;
    default:
      return next(action)
  }
}

window.$$LogSagas = () => {
  checkEnv()
  logEffectTree(0)
}

function resolveEffect(effectId, result) {
  const effect = effectsById[effectId]
  const now = time()

  if(is.task(result)) {
    result.done.then(
      taskResult => resolveEffect(effectId, taskResult),
      taskError  => rejectEffect(effectId, taskError)
    )
  } else {
    effectsById[effectId] = Object.assign({},
      effect,
      {
        result: result,
        status: RESOLVED,
        end: now,
        duration: now - effect.start
      }
    )
    if(effect && asEffect.race(effect.effect))
      setRaceWinner(effectId, result)
  }
}

function rejectEffect(effectId, error) {
  const effect = effectsById[effectId]
  const now = time()
  effectsById[effectId] = Object.assign({},
    effect,
    {
      error: error,
      status: REJECTED,
      end: now,
      duration: now - effect.start
    }
  )
  if(effect && asEffect.race(effect.effect))
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
  if(effectId === undefined) {
    console.log('Saga monitor: No effect data for', effectId)
    return
  }
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

  if(data = asEffect.take(effect.effect)) {
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
    log = getLogPrefix('', effect)
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

  const autoCancel = isAutoCancel(effect.error)
  const isError = effect && effect.status === REJECTED && !autoCancel
  const method = isError ? 'error' : 'log'
  const winnerInd = effect && effect.winner
    ? ( isError ? '✘' : '✓' )
    : ''

  const style = s =>
      autoCancel  ? AUTO_CANCEL_STYLE
    : isError     ? ERROR_STYLE
    : s

  const formatter = logFormatter()

  if(winnerInd)
    formatter.add(`%c ${winnerInd}`, style(LABEL_STYLE))

  if(effect && effect.label)
    formatter.add(`%c ${effect.label}: `,  style(LABEL_STYLE))

  if(type)
    formatter.add(`%c ${type} `, style(EFFECT_TYPE_STYLE))

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
    } else
      formatter.appendData('→',result)
  }

  else if(status === REJECTED) {
    if(isAutoCancel(error))
      return

    if(isManualCancel(error))
      formatter.appendData('→ ⚠', 'Cancelled!')
    else
      formatter.appendData('→ ⚠', error)
  }

  else if(status === PENDING)
    formatter.appendData('⌛')

  if(status !== PENDING)
    formatter.appendData(`(${duration.toFixed(2)}ms)`)
}

function isAutoCancel(error) {
  return error instanceof SagaCancellationException && error.type !== MANUAL_CANCEL
}

function isManualCancel(error) {
  return error instanceof SagaCancellationException && error.type === MANUAL_CANCEL
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
