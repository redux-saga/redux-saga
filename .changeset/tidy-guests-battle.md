---
"babel-plugin-redux-saga": patch
---

Fix crash when a saga yields a call expression that returns a primitive value. Location metadata is now attached through a single hoisted helper that guards `Object.defineProperty` against non-objects, so yielding numbers, strings, `null` or `undefined` no longer throws.
