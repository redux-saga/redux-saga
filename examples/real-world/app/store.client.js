import sagaMonitor from '@redux-saga/simple-saga-monitor'
import { createAppStore } from './store'
import rootSaga from './sagas'

let browserStore

// The browser keeps one store, and its sagas running, for the whole session.
// It starts from the state the server rendered the first page with.
export function getBrowserStore(preloadedState) {
  if (!browserStore) {
    const { store, runSaga } = createAppStore({ preloadedState, sagaMonitor })
    runSaga(rootSaga)
    browserStore = store
  }
  return browserStore
}

// Sagas and reducers can't be swapped into a store that is already running. In dev, when one of them is edited,
// reload the page instead of hot-updating this module, which would leave the page and the loaders on different stores.
if (import.meta.hot) {
  import.meta.hot.accept(() => window.location.reload())
}
