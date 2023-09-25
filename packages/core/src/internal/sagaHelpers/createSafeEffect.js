export const loadingActionPrefix = 'loading/'
export const errorActionPrefix = 'success/'

export default function createSafeEffect(onError, onSuccess) {
  onError
  onSuccess
  return function* (action) {
    yield action
    throw new Error('Not implemented')
  }
}
