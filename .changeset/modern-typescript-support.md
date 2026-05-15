---
"@redux-saga/core": major
"@redux-saga/testing-utils": patch
"@redux-saga/types": major
---

Drop legacy TypeScript compatibility branches and validate declarations with the current TypeScript compiler using NodeNext module resolution. `SagaIterator` now uses `Generator` so sagas annotated with it can be composed with `yield*`, and cloneable generator test helpers now expose the iterable protocol.
