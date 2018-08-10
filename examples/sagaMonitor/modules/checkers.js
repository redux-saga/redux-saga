import { is } from 'redux-saga/utils'
import { effectTypes } from 'redux-saga/effects'

export const isRootEffect = eff => is.effect(eff) && eff.type === effectTypes.ROOT
export const isRaceEffect = eff => is.effect(eff) && eff.type === effectTypes.RACE
