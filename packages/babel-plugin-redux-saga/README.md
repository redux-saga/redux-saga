## NOTE: plugin is still in beta, so use it on your own risk

Babel plugin for code instrumenting by extending `redux-saga` code fragments with additional meta-data. Meta-data contains information about code fragment location and other details, that could be consumed by developer tools or libraries.
Adding the plugin improve logging for errors thrown in your sagas.
Example of setup and demo are available [here](../../examples/error-demo)

## Example

Source:

```js
// src/sagas/index.js
function* saga1(){
    yield call(foo, 1, 2, 3);
}

function* saga2(){
    yield 2;
}
```

Result:

```js
function* saga1() {
    yield Object.defineProperty(call(foo, 1, 2, 3), Symbol.for("@@redux-saga/LOCATION"), {
        value: {
            fileName: "src/sagas/index.js",
            lineNumber: 1,
            code: "call(foo, 1, 2, 3)"
        }
    })
}

Object.defineProperty(saga1, Symbol.for("@@redux-saga/LOCATION"), {
  value: {
    fileName: "src/sagas/index.js",
    lineNumber: 1
  }
})
function* saga2() {
    yield 2;
}
Object.defineProperty(saga2, Symbol.for("@@redux-saga/LOCATION"), {
  value: {
    fileName: "src/sagas/index.js",
    lineNumber: 5
  }
})
```

## Usage

1. with babel
```js
    plugins: [
        'babel-plugin-redux-saga'
    ]
```

2. with [webpack](https://github.com/webpack/webpack/) and [babel-loader](https://github.com/babel/babel-loader):
```js
    loader: 'babel-loader',
    options: {
        plugins: [
            'babel-plugin-redux-saga'
        ]
    }
```

### Options

All options are optional.

#### useAbsolutePath

- Type: `Boolean`
- Default: `false`

By default plugin generates relative to the current cwd file paths. But for some reasons absolute path may be required, for such cases configure `useAbsolutePath` option. For example, if option is not set:

```js
    fileName: "path/to/filename.js"
```

But if `useAbsolutePath` is set to `true`,

```js
    fileName: "/Users/name/git/project/path/to/filename.js"
```

#### useSymbol

- Type: `boolean`
- Default: `true`

By default, the plugin uses Symbol internally. The plugin doesn't try to include any polyfills, so if your runtime environment doesn't support Symbol functionality, you get an error `Symbol is undefined`. In this case, try to disable `useSymbol` option with
```
useSymbol: false
```

## Problem solving

### My source code became ugly, I can't read it anymore

Use [source maps](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/). It can't be set up in `babel` settings.

It also can be set up in your building tools setting. See [webpack](#usage) config for example.
