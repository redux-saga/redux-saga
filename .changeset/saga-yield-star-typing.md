---
'@redux-saga/core': patch
'@redux-saga/types': patch
---

Allow sagas typed with the public `Saga` alias to be composed with `yield*`, and remove stale legacy TypeScript metadata from the effects subpath.
