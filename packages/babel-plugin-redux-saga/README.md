## NOTE: plugin is still in development mode, so use it on your own risk

Babel plugin for code instrumenting by extending `redux-saga` code fragments with additional meta-data. Meta-data contains information about code fragment location and other details, that could be consumed by developer tools or libraries.

## Example

Source:

```js
function* saga1(){
    yield foo(1, 2, 3);
}

function* saga2(){
    yield 2;
}
```

Result:

```js
var _SAGA_LOCATION = require("redux-saga").SAGA_LOCATION

function* saga1() {
    yield function reduxSagaSource() {
        var res = foo(1, 2, 3);
        res[_SAGA_LOCATION] = {
            fileName: "{{filename}}",
            lineNumber: 2,
            code: "foo(1, 2, 3)"
        };
        return res;
    }();
}

saga1[_SAGA_LOCATION] = {
    fileName: "{{filename}}",
    lineNumber: 1
};
function* saga2() {
    yield 2;
}
saga2[_SAGA_LOCATION] = {
    fileName: "{{filename}}",
    lineNumber: 5
};
```

## Usage

1. with babel
```js
babel.transform(content, {
    sourceMaps: true,
    plugins: [
        ['babel-plugin-redux-saga', { /* options */ }]
    ],
    ...
});
```

2. with [webpack](https://github.com/webpack/webpack/) and [babel-loader](https://github.com/babel/babel-loader):
```js
{
    loader: 'babel-loader',
    options: {
        presets: [...],
        plugins: [
            'babel-plugin-redux-saga',
            ...
        ]
    }
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
