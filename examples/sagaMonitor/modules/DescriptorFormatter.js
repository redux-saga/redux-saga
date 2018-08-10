import { is } from 'redux-saga/utils'
import Formatter from './Formatter'
import { CANCELLED, PENDING, REJECTED, RESOLVED } from './constants'

const DEFAULT_STYLE = 'color: black'
const LABEL_STYLE = 'font-weight: bold'
const EFFECT_TYPE_STYLE = 'color: blue'
const ERROR_STYLE = 'color: red'
const CANCEL_STYLE = 'color: #ccc'

export default class DescriptorFormatter extends Formatter {
  constructor(isCancel, isError) {
    super()
    this.logMethod = isError ? 'error' : 'log'
    this.styleOverride = s => (isCancel ? CANCEL_STYLE : isError ? ERROR_STYLE : s)
  }

  resetStyle() {
    return this.add('%c', this.styleOverride(DEFAULT_STYLE))
  }

  addLabel(text) {
    if (text) {
      return this.add(`%c ${text} `, this.styleOverride(LABEL_STYLE))
    } else {
      return this
    }
  }

  addEffectType(text) {
    return this.add(`%c ${text} `, this.styleOverride(EFFECT_TYPE_STYLE))
  }

  addDescResult(descriptor, ignoreResult) {
    const { status, result, error, duration } = descriptor
    if (status === RESOLVED && !ignoreResult) {
      if (is.array(result)) {
        this.addValue(' 🡲 ')
        this.addValue(result)
      } else {
        this.appendData('🡲', result)
      }
    } else if (status === REJECTED) {
      this.appendData('🡲 ⚠', error)
    } else if (status === PENDING) {
      this.appendData('⌛')
    } else if (status === CANCELLED) {
      this.appendData('🡲 Cancelled!')
    }
    if (status !== PENDING) {
      this.appendData(`(${duration.toFixed(2)}ms)`)
    }

    return this
  }
}
