import { data } from 'react-router'
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

// GitHub logins are made of letters, digits and hyphens. Anything else (/robots.txt, /apple-touch-icon.png, ...)
// is a 404, and isn't worth some of the 60 requests per hour the GitHub API allows.
export function assertLogin(login) {
  if (!/^[a-z\d-]+$/i.test(login)) {
    throw data(null, { status: 404, statusText: 'Not Found' })
  }
}
