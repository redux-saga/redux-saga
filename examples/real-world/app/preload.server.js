import { END } from 'redux-saga'
import { createAppStore } from './store'
import rootSaga from './sagas'

// Runs the app's sagas on the server for one request, and returns the state once the data they fetch is in.
//
// The root saga is made of watchers (`while (true) { yield take(...) }`), so it never completes on its own.
// After dispatching the page's action, we dispatch END: every pending `take` ends, so the watchers return,
// and the root task completes as soon as the fetches the watchers forked are done.
export async function preload(action) {
  const { store, runSaga } = createAppStore()
  const rootTask = runSaga(rootSaga)

  store.dispatch(action)
  store.dispatch(END)
  await rootTask.toPromise()

  return store.getState()
}
