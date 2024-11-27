export const loadingStartedActionType = 'loading'
export const loadingCompleteActionType = 'loadingComplete'
export const errorActionType = 'error'

export default function createSafeEffect(onError, onSuccess) {
  onError
  onSuccess
  return function* (action) {
    yield action
    throw new Error('Not implemented')
  }
}
