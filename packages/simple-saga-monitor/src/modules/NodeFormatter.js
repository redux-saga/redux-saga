import util from 'node:util'
import FormatterBase from './FormatterBase'
import isPrimitive from './isPrimitive'

export default class NodeFormatter extends FormatterBase {
  add(msg, ...args) {
    // Remove the `%c` CSS styling that is not supported by the Node console.
    if (typeof msg === 'string') {
      const prevMsg = msg
      msg = msg.replace(/^%c\s*/, '')
      if (msg !== prevMsg) {
        // Remove the first argument which is the CSS style string.
        args.shift()
      }
    }
    return super.add(msg, ...args)
  }

  addValue(value) {
    if (isPrimitive(value)) {
      this.add(value)
    } else {
      // The browser console supports `%O`, the Node console does not.
      this.add('%s', util.inspect(value))
    }
    return this
  }
}
