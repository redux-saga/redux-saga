import fsmIterator, { safeName } from './fsmIterator'
import { delay, fork, race, take } from '../io'

export default function debounceHelper(delayLengthOrOptions, patternOrChannel, worker, ...args) {
  let action, raceOutput, delayLength, leading, trailing

  if (typeof delayLengthOrOptions === 'number') {
    delayLength = delayLengthOrOptions
    leading = false
    trailing = true
  } else {
    ;({ delayLength, leading = false, trailing = true } = delayLengthOrOptions)
  }

  const yTake = { done: false, value: take(patternOrChannel) }
  const yRace = {
    done: false,
    value: race({
      action: take(patternOrChannel),
      debounce: delay(delayLength),
    }),
  }
  const yFork = (ac) => ({ done: false, value: fork(worker, ...args, ac) })
  const yNoop = (value) => ({ done: false, value })

  const setAction = (ac) => (action = ac)
  const unsetAction = () => (action = undefined)
  const setRaceOutput = (ro) => (raceOutput = ro)

  return fsmIterator(
    {
      q1() {
        return { nextState: 'q2', effect: yTake, stateUpdater: setAction }
      },
      q2() {
        return leading
          ? { nextState: 'q3', effect: yFork(action), stateUpdater: unsetAction }
          : { nextState: 'q3', effect: yNoop }
      },
      q3() {
        return { nextState: 'q4', effect: yRace, stateUpdater: setRaceOutput }
      },
      q4() {
        if (raceOutput.action) {
          return { nextState: 'q3', effect: yNoop(raceOutput.action), stateUpdater: setAction }
        }
        return trailing && action
          ? { nextState: 'q1', effect: yFork(action), stateUpdater: unsetAction }
          : { nextState: 'q1', effect: yNoop }
      },
    },
    'q1',
    `debounce(${safeName(patternOrChannel)}, ${worker.name})`,
  )
}
