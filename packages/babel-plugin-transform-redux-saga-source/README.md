Babel plugin for code instrumenting by extending [redux-saga](https://github.com/redux-saga/redux-saga) code fragments with additional meta-data. Meta-data contains information about code fragment location and other details, that could be consumed by developer tools or libraries.

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
function* saga1() {
    yield function reduxSagaSource() {
        var res = foo(1, 2, 3);
        res.__source = {
            fileName: "{{filename}}",
            lineNumber: 2,
            code: "foo(1, 2, 3)"
        };
        return res;
    }();
}

saga1.__source = {
    fileName: "{{filename}}",
    lineNumber: 1
};
function* saga2() {
    yield 2;
}
saga2.__source = {
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
        'babel-plugin-transform-redux-saga-source', { /* options */ }
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
            ['babel-plugin-transform-redux-saga-source', {
                basePath: process.cwd()
            }]
        ]
    }
}
```

### Options

All options are optional.

#### basePath

- Type: `String` or `false`
- Default: `false`

By default plugin gets absolute file paths. But for some reasons relative to some location path required. In this case `basePath` could be used. For example, if option is not set:

```js
    fileName: "/Users/name/git/project/path/to/filename.js"
```

But if `basePath` is set to `'/Users/name/git/project'`,

```js
    fileName: "path/to/filename.js"
```

## Problem solving

### My source code became ugly, I can't read it anymore

Use [source maps](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/). It can't be set up in `babel` settings.

It also can be set up in your building tools setting. See [webpack](#webpack) config for example.
