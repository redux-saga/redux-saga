/* eslint-disable no-console */
import * as is from '@redux-saga/is'
import { effectTypes } from 'redux-saga/effects'
import { consoleGroup, consoleGroupEnd } from './consoleGroup'
import { CANCELLED, REJECTED } from './constants'
import DescriptorFormatter from './DescriptorFormatter'

export default function logSaga(manager) {
  if (manager.getRootIds().length === 0) {
    console.log('Saga monitor: No effects to log')
  }
  console.log('')
  console.log('Saga monitor:', Date.now(), new Date().toISOString())
  for (const id of manager.getRootIds()) {
    logEffectTree(manager, id)
  }
  console.log('')
}

function logEffectTree(manager, effectId) {
  const desc = manager.get(effectId)
  const childIds = manager.getChildIds(effectId)

  const formatter = getFormatterFromDescriptor(desc)
  if (childIds.length === 0) {
    console[formatter.logMethod](...formatter.getLog())
  } else {
    consoleGroup(...formatter.getLog())
    for (const id of childIds) {
      logEffectTree(manager, id)
    }
    consoleGroupEnd()
  }
}

function getFormatterFromDescriptor(desc) {
  const isCancel = desc.status === CANCELLED
  const isError = desc.status === REJECTED

  const formatter = new DescriptorFormatter(isCancel, isError)

  const winnerInd = desc.winner ? (isError ? '✘' : '✓') : ''
  formatter.addLabel(winnerInd).addLabel(desc.label)

  if (desc.root) {
    formatter
      .addEffectType('root')
      .resetStyle()
      .addCall(desc.saga.name, desc.args)
      .addDescResult(desc)
  } else if (is.iterator(desc.effect)) {
    formatter.addValue(desc.effect.name).addDescResult(desc, true)
  } else if (is.promise(desc.effect)) {
    formatter
      .addEffectType('promise')
      .resetStyle()
      .addDescResult(desc)
  } else if (is.effect(desc.effect)) {
    const { type, payload } = desc.effect

    if (type === effectTypes.TAKE) {
      formatter
        .addEffectType('take')
        .resetStyle()
        .addValue(payload.channel == null ? payload.pattern : payload)
        .addDescResult(desc)
    } else if (type === effectTypes.PUT) {
      formatter
        .addEffectType('put')
        .resetStyle()
        .addDescResult(Object.assign({}, desc, { result: payload }))
    } else if (type === effectTypes.ALL) {
      formatter
        .addEffectType('all')
        .resetStyle()
        .addDescResult(desc, true)
    } else if (type === effectTypes.RACE) {
      formatter
        .addEffectType('race')
        .resetStyle()
        .addDescResult(desc, true)
    } else if (type === effectTypes.CALL) {
      formatter
        .addEffectType('call')
        .resetStyle()
        .addCall(payload.fn.name, payload.args)
        .addDescResult(desc)
    } else if (type === effectTypes.CPS) {
      formatter
        .addEffectType('cps')
        .resetStyle()
        .addCall(payload.fn.name, payload.args)
        .addDescResult(desc)
    } else if (type === effectTypes.FORK) {
      formatter
        .addEffectType(payload.detached ? 'spawn' : 'fork')
        .resetStyle()
        .addCall(payload.fn.name, payload.args)
        .addDescResult(desc)
    } else if (type === effectTypes.JOIN) {
      formatter
        .addEffectType('join')
        .resetStyle()
        .addDescResult(desc)
    } else if (type === effectTypes.CANCEL) {
      formatter
        .addEffectType('cancel')
        .resetStyle()
        .appendData(payload.name)
    } else if (type === effectTypes.SELECT) {
      formatter
        .addEffectType('select')
        .resetStyle()
        .addCall(payload.selector.name, payload.args)
        .addDescResult(desc)
    } else if (type === effectTypes.ACTION_CHANNEL) {
      formatter
        .addEffectType('actionChannel')
        .resetStyle()
        .addValue(payload.buffer == null ? payload.pattern : payload)
        .addDescResult(desc)
    } else if (type === effectTypes.CANCELLED) {
      formatter
        .addEffectType('cancelled')
        .resetStyle()
        .addDescResult(desc)
    } else if (type === effectTypes.FLUSH) {
      formatter
        .addEffectType('flush')
        .resetStyle()
        .addValue(payload)
        .addDescResult(desc)
    } else if (type === effectTypes.GET_CONTEXT) {
      formatter
        .addEffectType('getContext')
        .resetStyle()
        .addValue(payload)
        .addDescResult(desc)
    } else if (type === effectTypes.SET_CONTEXT) {
      formatter
        .addEffectType('setContext')
        .resetStyle()
        .addValue(payload)
        .addDescResult(desc, true)
    } else {
      throw new Error(`Invalid effect type ${type}`)
    }
  } else {
    formatter
      .addEffectType('unknown')
      .resetStyle()
      .addDescResult(desc)
  }

  return formatter
}
