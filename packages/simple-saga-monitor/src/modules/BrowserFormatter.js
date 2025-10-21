import FormatterBase from './FormatterBase'
import isPrimitive from './isPrimitive'

export default class BrowserFormatter extends FormatterBase {
  addValue(value) {
    if (isPrimitive(value)) {
      this.add(value)
    } else {
      this.add('%O', value)
    }
    return this
  }
}
