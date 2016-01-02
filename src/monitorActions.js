
export const EFFECT_TRIGGERED = 'EFFECT_TRIGGERED'
export const EFFECT_RESOLVED = 'EFFECT_RESOLVED'
export const EFFECT_REJECTED = 'EFFECT_REJECTED'

export function effectTriggered(effectId, parentEffectId, label, effect) {
  return {
    type: EFFECT_TRIGGERED,
    effectId, parentEffectId, label, effect
  }
}

export function effectResolved(effectId, result) {
  return {
    type: EFFECT_RESOLVED,
    effectId, result
  }
}

export function effectRejected(effectId, error) {
  return {
    type: EFFECT_REJECTED,
    effectId, error
  }
}
