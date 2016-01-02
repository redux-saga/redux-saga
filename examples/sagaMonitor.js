/*eslint-disable no-console*/

import * as actions from '../src/monitorActions'
import { as } from '../src/io'

const PENDING = 'PENDING'
const RESOLVED = 'RESOLVED'
const REJECTED = 'REJECTED'

export const LOG_EFFECT = 'LOG_EFFECT'
export const logEffect = (effectId = 0) => ({type: LOG_EFFECT, effectId})

const LABEL_STYLE = 'font-weight: bold'
const EFFECT_TYPE_STYLE = 'color: blue'


let effectsById = {}
export default () => next => action => {

  switch (action.type) {
    case actions.EFFECT_TRIGGERED:
      effectsById[action.effectId] = {...action, status: PENDING}
      break;
    case actions.EFFECT_RESOLVED:
      effectsById[action.effectId] = {...effectsById[action.effectId], result: action.result, status: RESOLVED}
      break;
    case actions.EFFECT_REJECTED:
      effectsById[action.effectId] = {...effectsById[action.effectId], error: action.error, status: REJECTED}
      break;
    case LOG_EFFECT:
      logEffectTree(action.effectId || 0)
      break;
    default:
      return next(action)
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
    console.group( effectToString(effect).join(' ') )
    childEffects.forEach(logEffectTree)
    if(effect)
      console.log(...resultToString(effect))
    console.groupEnd()
  }
}

/*eslint-disable no-cond-assign*/
function effectToString(effect) {
  let data
  if(!effect)
    return ['root']

  if(data = as.call(effect.effect))
    return ['call', callToString(data.fn.name, data.args)]

  if(data = as.fork(effect.effect))
    return ['fork', callToString(data.task.name, data.args)]

  if(data = as.race(effect.effect))
    return ['race']

  if(Array.isArray(effect.effect))
    return ['parallel']

  else
    return [`unkown effect`, effect]
}

/*eslint-disable no-cond-assign*/
function logSimpleEffect(effect) {
  let data

  if(data = as.take(effect.effect))
    log('take', effect, data)

  else if(data = as.put(effect.effect))
    log('put', null, data)

  else if(data = as.call(effect.effect))
    log('call', effect, callToString(data.fn.name, data.args))

  else
    log('unkown effect', effect, effect)
}

function log(type, effect, data) {
  const args = (
    effect && effect.label ?
      [`%c ${effect.label}: %c ${type}`, LABEL_STYLE, EFFECT_TYPE_STYLE] :
      [`%c ${type}`, EFFECT_TYPE_STYLE]
  )
  .concat(data)
  .concat(effect ? resultToString(effect) : [])

  console.log(...args)
}

function callToString(name, args) {
  return `${name}(${args.map(argToString).join(',')})`
}

function argToString(arg) {
  return typeof arg === 'function' ?
    `${arg.name}(...)` :
    arg
}

function resultToString({status, result, error}) {
  if(status === PENDING)
    return ['(pending...)']

  if(status === RESOLVED) {
    if(result && result._iterator) {
      return resultToString({
        status: result.isRunning() ? PENDING : (result.result() ? RESOLVED : REJECTED),
        result: result.result(),
        error: result.error()
      })
    } else
      return ['->', result]
  }

  if(status === REJECTED)
    return ['->', error]
}
