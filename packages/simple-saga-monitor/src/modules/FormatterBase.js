function argToString(arg) {
  return typeof arg === 'function' ? `${arg.name}` : typeof arg === 'string' ? `'${arg}'` : arg
}

export default class Formatter {
  constructor() {
    this.logs = []
    this.suffix = []
  }

  add(msg, ...args) {
    this.logs.push({ msg, args })
    return this
  }

  appendData(...data) {
    this.suffix.push(...data)
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
