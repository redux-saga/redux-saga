import { asEffect } from './io'

const nullOrWhat = (what, obj) => obj && (!what ? obj : obj[what])

const _get = (what, ...args) => effect =>
  args.reduce((maybe, type) => maybe || nullOrWhat(what, asEffect[type](effect)), null)

export const fn = _get('fn', 'call', 'cps', 'fork')
export const args = _get('args', 'call', 'cps', 'fork', 'select')
export const context = _get('context', 'call', 'cps', 'fork')
export const channel = (...args) => _get(null, 'flush')(...args) || _get('channel', 'put', 'take')(...args)
export const action = _get('action', 'put')
export const resolve = _get('resolve', 'put')
export const pattern = _get('pattern', 'take', 'actionChannel')
export const buffer = _get('buffer', 'actionChannel')
export const detached = _get('detached', 'fork')
export const selector = _get('selector', 'select')
export const maybe = _get('maybe', 'take')
export const task = _get(null, 'cancel', 'join')
export const effects = _get(null, 'all', 'race')
export const prop = _get(null, 'getContext')
export const props = _get(null, 'setContext')
