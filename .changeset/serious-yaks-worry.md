---
'babel-plugin-redux-saga': minor
'@redux-saga/core': minor
'@redux-saga/deferred': minor
'@redux-saga/delay-p': minor
'@redux-saga/is': minor
'redux-saga': minor
'@redux-saga/simple-saga-monitor': major
'@redux-saga/symbols': minor
'@redux-saga/testing-utils': minor
'@redux-saga/types': minor
---

`exports` field has been added to the `package.json` manifest. It limits what files can be imported from a package but we've tried our best to allow importing all the files that were considered to be a part of the public API.
