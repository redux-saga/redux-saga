export const MONITOR_ACTION = 'MONITOR_ACTION'
export const EFFECT_TRIGGERED = 'EFFECT_TRIGGERED'
export const EFFECT_RESOLVED = 'EFFECT_RESOLVED'
export const EFFECT_REJECTED = 'EFFECT_REJECTED'
export const EFFECT_CANCELLED = 'EFFECT_CANCELLED'

export function effectTriggered(effectId, parentEffectId, label, effect) {
  return {
    [MONITOR_ACTION]: true,
    type: EFFECT_TRIGGERED,
    effectId, parentEffectId, label, effect
  }
}

export function effectResolved(effectId, result) {
  return {
    [MONITOR_ACTION]: true,
    type: EFFECT_RESOLVED,
    effectId, result
  }
}

export function effectRejected(effectId, error) {
  return {
    [MONITOR_ACTION]: true,
    type: EFFECT_REJECTED,
    effectId, error
  }
}

export function effectCancelled(effectId) {
  return {
    [MONITOR_ACTION]: true,
    type: EFFECT_CANCELLED,
    effectId
  }
}
