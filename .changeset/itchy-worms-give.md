---
'@redux-saga/core': patch
'redux-saga': patch
---

Require `CpsCallback` in all functions passed to the `cps` effect creator. This fixes a regression caused by TS 4.0 changing the behavior around spreading `never` into tuple types
