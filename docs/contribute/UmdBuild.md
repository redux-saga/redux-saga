# Using umd build in the browser

There's an **umd** build of `redux-saga` available in the `dist/` folder. When using the umd build `redux-saga` is available as `ReduxSaga` in the window object.
The umd version is useful if you don't use webpack or browserify. You can access it directly from [npmcdn](npmcdn.com).
The following builds are available:

- [https://npmcdn.com/redux-saga/dist/redux-saga.js](https://npmcdn.com/redux-saga/dist/redux-saga.js)  
- [https://npmcdn.com/redux-saga/dist/redux-saga.min.js](https://npmcdn.com/redux-saga/dist/redux-saga.min.js)

**Important!** If the browser you are targeting doesn't support _es2015 generators_ you must provide a valid polyfill, for example the one provided by *babel*: [browser-polyfill.min.js](https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.25/browser-polyfill.min.js). The polyfill must be imported before **redux-saga**.
