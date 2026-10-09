import { useCallback, useEffect, useRef, useState } from 'react'
import { runSaga as rootRunSaga, stdChannel } from 'redux-saga'
import { effectTypes, call, select, take } from 'redux-saga/effects'

export const StateUpdated = '@@STATE_UPDATED'

/**
 * Helper saga for pausing selector effects until the useSaga-specific
 * `StateUpdated` action has been dispatched indicating that the state
 * is up-to-date.
 * @param selector The state selector function.
 * @param args Any parameters the selector requires.
 * @returns The result of the given selector.
 */
function* selectWhenStateReady(selector, args) {
  yield take(StateUpdated)
  return yield select(selector, ...args)
}

/**
 * Runs the given Saga wired up to the given state and dispatch, typically
 * created by React's useReducer hook. Automatically cancels the saga when
 * the component is unmounted.
 *
 * Be careful about `args` not changing. `args` should never be React state
 * variables. If `args` changes (or `dispatch` or `saga`) the running saga will
 * be cancelled and restarted, probably leading to unintended side effects.
 *
 * @param state The state the saga will read from when running select effects.
 * @param dispatch The function used to send actions to the reducer.
 * @param onError Optional. Called for uncaught exceptions from the saga.
 * @param saga The root saga to run.
 * @param args Any parameters that the saga function requires.
 * @returns A dispatch function that will send actions to the reducer first
 *   and then the saga.
 */
export function useSaga({ state, dispatch, onError }, saga, ...args) {
  const environment = useRef({
    state,
    stateVersion: 0,
    channel: stdChannel(),
    actions: [],
    stateChangePossible: false,
  })
  // Used to synchronize action dispatches with their corresponding state update
  const [stateVersion, setStateVersion] = useState(0)

  const wrappedDispatch = useCallback(
    (action) => {
      // This does not update the state synchronously. React batches state
      // updates. Because of the we need to queue the actions to be processed
      // into the saga after the state has been updated.
      dispatch(action)
      environment.current.stateChangePossible = true
      environment.current.actions.push(action)
      const newVersion =
        1 +
        // Overflow back to 0 if that's reached
        (environment.current.stateVersion === Number.MAX_VALUE ? 0 : environment.current.stateVersion)
      // This ensures that the useEffect below that handles flushing the
      // actions from the queue into the saga's channel gets executed.
      setStateVersion(newVersion)
      environment.current.stateVersion = newVersion
    },
    [dispatch],
  )

  const runSaga = useCallback(
    ({ onError }, saga, ...args) => {
      return rootRunSaga(
        {
          getState: () => environment.current.state,
          dispatch: wrappedDispatch,
          onError,
          channel: environment.current.channel,
          effectMiddlewares: [
            (next) => (effect) => {
              // For selector effects, when the state may have changed, wait until the
              // state has been freshly updated before executing them.
              if (effect.type === effectTypes.SELECT && environment.current.stateChangePossible) {
                return next(call(selectWhenStateReady, effect.payload.selector, effect.payload.args))
              }
              return next(effect)
            },
          ],
        },
        saga,
        ...args,
      )
    },
    [wrappedDispatch],
  )

  // One-time effect that starts the root saga.
  useEffect(() => {
    const task = runSaga({ onError }, saga, ...args)
    return task.cancel
  }, [wrappedDispatch, saga, ...args])

  // Sync the latest state from the reducer with the state read from within
  // the saga, and send any actions that were dispatched into the saga's
  // channel, resolving any pending `take` effects.
  useEffect(() => {
    // Do not update the state if there were actions dispatched since the state update.
    if (stateVersion === environment.current.stateVersion) {
      environment.current.state = state
      environment.current.stateChangePossible = false
      // Let the selector effects continue that are waiting on fresh state.
      environment.current.channel.put({
        type: StateUpdated,
      })
    }

    if (environment.current.actions.length > 0) {
      // Copy the actions and reset them on the environment so in case any
      // sagas dispatch more actions, they go through the reducer first
      // instead of being immediately processed by sagas.
      const actions = environment.current.actions
      environment.current.actions = []
      // Flush the actions into the saga through the channel.
      actions.forEach(environment.current.channel.put)
    }
  }, [stateVersion, state])

  return { dispatch: wrappedDispatch, runSaga }
}
