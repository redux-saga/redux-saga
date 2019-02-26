import { IS_BROWSER } from './constants'

function argToString(arg) {
  return typeof arg === 'function' ? `${arg.name}` : typeof arg === 'string' ? `'${arg}'` : arg
}

function isPrimitive(val) {
  return (
    typeof val === 'string' ||
    typeof val === 'number' ||
    typeof val === 'boolean' ||
    typeof val === 'symbol' ||
    val === null ||
    val === undefined
  )
}

export default class Formatter {
  constructor() {
    this.logs = []
    this.suffix = []
  }

  add(msg, ...args) {
    // Remove the `%c` CSS styling that is not supported by the Node console.
    if (!IS_BROWSER && typeof msg === 'string') {
      const prevMsg = msg
      msg = msg.replace(/^%c\s*/, '')
      if (msg !== prevMsg) {
        // Remove the first argument which is the CSS style string.
        args.shift()
      }
    }
    this.logs.push({ msg, args })
    return this
  }

  appendData(...data) {
    this.suffix.push(...data)
    return this
  }

  addValue(value) {
    if (isPrimitive(value)) {
      this.add(value)
    } else {
      // The browser console supports `%O`, the Node console does not.
      if (IS_BROWSER) {
        this.add('%O', value)
      } else {
        this.add('%s', require('util').inspect(value))
      }
    }
    return this
  }

  addCall(name, args) {
    if (!args.length) {
      this.add(`${name}()`)
    } else {
      this.add(name)
      this.add('(')
      args.forEach((arg, i) => {
        this.addValue(argToString(arg))
        this.addValue(i === args.length - 1 ? ')' : ', ')
      })
    }
    return this
  }

  getLog() {
    const msgs = []
    const msgsArgs = []
    for (const { msg, args } of this.logs) {
      msgs.push(msg)
      msgsArgs.push(...args)
    }
    return [msgs.join(''), ...msgsArgs, ...this.suffix]
  }
}
