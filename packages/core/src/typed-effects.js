import * as effects from './effects'

export const effectTypes = effects.effectTypes

export function* take(...args) {
  return yield effects.take(...args)
}

export function* takeMaybe(...args) {
  return yield effects.takeMaybe(...args)
}

export function* takeEvery(...args) {
  return yield effects.takeEvery(...args)
}

export function* takeLatest(...args) {
  return yield effects.takeLatest(...args)
}

export function* takeLeading(...args) {
  return yield effects.takeLeading(...args)
}

export function* put(...args) {
  return yield effects.put(...args)
}

export function* putResolve(...args) {
  return yield effects.putResolve(...args)
}

export function* call(...args) {
  return yield effects.call(...args)
}

export function* apply(...args) {
  return yield effects.apply(...args)
}

export function* cps(...args) {
  return yield effects.cps(...args)
}

export function* fork(...args) {
  return yield effects.fork(...args)
}

export function* spawn(...args) {
  return yield effects.spawn(...args)
}

export function* join(...args) {
  return yield effects.join(...args)
}

export function* cancel(...args) {
  return yield effects.cancel(...args)
}

export function* select(...args) {
  return yield effects.select(...args)
}

export function* actionChannel(...args) {
  return yield effects.actionChannel(...args)
}

export function* flush(...args) {
  return yield effects.flush(...args)
}

export function* cancelled(...args) {
  return yield effects.cancelled(...args)
}

export function* setContext(...args) {
  return yield effects.setContext(...args)
}

export function* getContext(...args) {
  return yield effects.getContext(...args)
}

export function* delay(...args) {
  return yield effects.delay(...args)
}

export function* throttle(...args) {
  return yield effects.throttle(...args)
}

export function* debounce(...args) {
  return yield effects.debounce(...args)
}

export function* retry(...args) {
  return yield effects.retry(...args)
}

export function* all(...args) {
  return yield effects.all(...args)
}

export function* race(...args) {
  return yield effects.race(...args)
}
