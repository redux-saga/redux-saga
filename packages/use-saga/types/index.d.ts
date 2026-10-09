import { NotUndefined } from '@redux-saga/types'
import { Saga, Task } from 'redux-saga'
import { Tail } from 'redux-saga/effects'

export { Tail }

/**
 * Action type put into the saga's channel by `useSaga` whenever the state
 * read by `select` effects has been brought up to date with the reducer.
 */
export const StateUpdated: '@@STATE_UPDATED'

export interface ErrorInfo {
  sagaStack: string
}

export type SagaErrorHandler = (error: Error, errorInfo: ErrorInfo) => void

/**
 * Runs an additional saga attached to the environment (state, dispatch and
 * channel) of the saga started by `useSaga`.
 */
export type RunSaga = <Args extends any[]>(
  options: { onError?: SagaErrorHandler },
  saga: Saga<Args>,
  ...args: Args
) => Task

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
export function useSaga<S, A extends NotUndefined, Args extends any[]>(
  options: {
    state: S
    dispatch: (action: A) => void
    onError?: SagaErrorHandler
  },
  saga: Saga<Args>,
  ...args: Args
): {
  dispatch: (action: A) => void
  runSaga: RunSaga
}

/**
 * A saga function to wait on a certain part of state changing. Uses referentially equality for
 * comparison (`!==`). If the selected state is an array, each element in the array is compared.
 *
 * To compare an array using a shallow equality, pass it as a 1-element array,
 * `waitUntilChanged(context => ([context.list]))`.
 * @param selector The function given to a `select` effect.
 * @param args Any arguments the selector takes in addition to the automatically passed `state`.
 * @returns A 2-element array containing the newly-changed selected state value, and the previous value.
 */
export function waitUntilChanged<S extends (...args: any) => any, T extends Tail<Parameters<S>>>(
  selector: S,
  ...args: T
): Generator<any, [ReturnType<S>, ReturnType<S>], any>

/**
 * Utility saga for ensuring the selected piece of state has a certain condition before proceeding.
 * @param comparator function to compare whether the value has the desired condition.
 * @param selector the state selector function
 * @param args Any arguments the selector takes in addition to the `state`.
 * @returns the selected state.
 */
export function waitUntil<S extends (...args: any) => any, T extends Tail<Parameters<S>>>(
  comparator: (value: ReturnType<S>) => boolean,
  selector: S,
  ...args: T
): Generator<any, ReturnType<S>, any>

/**
 * Saga for waiting until a selected part of state exists. Uses `!= null` to check for existence.
 * Returns the selected value immediately if it already exists.
 * @param selector The state selector function.
 * @param args Any parameters that the selector function needs in addition to the state.
 * @returns The non-null selected state.
 */
export function waitUntilExists<S extends (...args: any) => any, T extends Tail<Parameters<S>>>(
  selector: S,
  ...args: T
): Generator<any, NonNullable<ReturnType<S>>, any>

/**
 * Saga for waiting until a selected part of state is true.
 * @param selector The state selector function. Must return a boolean.
 * @param args Any parameters that the selector function needs in addition to the state.
 * @returns true.
 */
export function waitUntilTrue<S extends (...args: any) => boolean, T extends Tail<Parameters<S>>>(
  selector: S,
  ...args: T
): Generator<any, true, any>
