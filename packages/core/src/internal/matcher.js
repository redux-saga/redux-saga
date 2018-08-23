import * as is from '@redux-saga/is'
import { kTrue } from './utils'

export const array = patterns => input => patterns.some(p => matcher(p)(input))
export const predicate = predicate => input => predicate(input)
export const string = pattern => input => input.type === String(pattern)
export const symbol = pattern => input => input.type === pattern
export const wildcard = () => kTrue

export default function matcher(pattern) {
  // prettier-ignore
  const matcherCreator = (
      pattern === '*'            ? wildcard
    : is.string(pattern)         ? string
    : is.array(pattern)          ? array
    : is.stringableFunc(pattern) ? string
    : is.func(pattern)           ? predicate
    : is.symbol(pattern)         ? symbol
    : null
  )

  if (matcherCreator === null) {
    throw new Error(`invalid pattern: ${pattern}`)
  }

  return matcherCreator(pattern)
}
