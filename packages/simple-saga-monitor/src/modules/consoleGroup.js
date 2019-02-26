/* eslint-disable no-console */

// Poor man's `console.group` and `console.groupEnd` for Node.
// Can be overridden by the `console-group` polyfill.
// The poor man's groups look nice, too, so whether to use
// the polyfilled methods or the hand-made ones can be made a preference.
let groupPrefix = ''
const GROUP_SHIFT = '   '
const GROUP_ARROW = '▼'

export function consoleGroup(...args) {
  if (console.group) {
    console.group(...args)
  } else {
    console.log('')
    console.log(groupPrefix + GROUP_ARROW, ...args)
    groupPrefix += GROUP_SHIFT
  }
}

export function consoleGroupEnd() {
  if (console.groupEnd) {
    console.groupEnd()
  } else {
    groupPrefix = groupPrefix.substr(0, groupPrefix.length - GROUP_SHIFT.length)
  }
}
