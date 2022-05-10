---
"@redux-saga/types": patch
"@redux-saga/core": patch
"redux-saga": patch
---

A generic type has been added to the `Task` interface and that should be preferred over using a generic parameter in `Task#result` and `Task#toPromise`.
