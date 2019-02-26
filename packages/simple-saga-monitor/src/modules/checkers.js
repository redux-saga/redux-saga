import * as is from '@redux-saga/is'
import { effectTypes } from 'redux-saga/effects'

export const isRaceEffect = eff => is.effect(eff) && eff.type === effectTypes.RACE
