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
      const effect = effectsById[action.effectId]
      effectsById[action.effectId] = {...effect,
        result: action.result,
        status: RESOLVED
      }
      if(effect && as.race(effect.effect))
        setRaceWinner(action.effectId, action.result)
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
    if(effect)
      console.group( effectToString(effect).join(' ') )
    else
      console.group('root')
    childEffects.forEach(logEffectTree)
    console.groupEnd()
  }
}

/*eslint-disable no-cond-assign*/
function effectToString(effect) {
  let data

  if(data = as.call(effect.effect))
    return ['call', ...callToString(data.fn.name, data.args), ...resultToString(effect)]

  if(data = as.fork(effect.effect))
    return [...callToString(data.task.name, data.args), ...resultToString(effect)]

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
    log('call', effect, ...callToString(data.fn.name, data.args))

  else
    log('unkown effect', effect, effect)
}

function log(type, effect, ...data) {
  const method = effect && effect.status === REJECTED ? 'error' : 'log'
  const winnerInd = effect && effect.winner ? '✓' : ''

  const args = (
    effect && effect.label ?
      [`%c ${winnerInd} ${effect.label}: %c ${type}`, LABEL_STYLE, EFFECT_TYPE_STYLE] :
      [`%c ${winnerInd} ${type}`, EFFECT_TYPE_STYLE]
  )
  .concat(data)
  .concat(effect ? resultToString(effect) : [])

  console[method](...args)
}

function callToString(name, args) {
  return !args.length ?
    [`${name}()`] :
    [
      name, '(',
       ...args.map(argToString),
      ')'
    ]
}

function argToString(arg) {
  return (
      typeof arg === 'function' ? `${arg.name}`
    : typeof arg === 'string'   ? `'${arg}'`
    : arg
  )
}

function resultToString({status, result, error}) {

  if(status === RESOLVED) {
    if(result && result._iterator) {
      return resultToString({
        status: result.isRunning() ? PENDING : (result.error() ? REJECTED : RESOLVED),
        result: result.result(),
        error: result.error()
      })
    } else
      return result !== undefined ? ['->', result] : ''
  }

  if(status === REJECTED)
    return ['-> ⚠', error]

  return [' ⌛']
}
