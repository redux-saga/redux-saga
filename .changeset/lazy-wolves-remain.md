---
'@redux-saga/core': minor
'@redux-saga/deferred': minor
'@redux-saga/delay-p': minor
'redux-saga': minor
---

author: @Andarist
author: @neurosnap
pr: #2308
commit: 8207e33

`exports` field has been added to the `package.json` manifest. It limits what files can be imported from a package but we've tried our best to allow importing all the files that were considered to be a part of the public API.

This should fix the compatibility with Node.js ESM support.
