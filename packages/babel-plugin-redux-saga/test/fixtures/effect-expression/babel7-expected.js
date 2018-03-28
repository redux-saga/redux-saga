function* test1() {
  yield function reduxSagaSource() {
    return Object.defineProperty(foo.bar(1, 2, 3), Symbol.for("@@redux-saga/LOCATION"), {
      value: {
        fileName: "effect-expression/source.js",
        lineNumber: 2,
        code: "foo.bar(1, 2, 3)"
      }
    });
  }() || {};
}

Object.defineProperty(test1, Symbol.for("@@redux-saga/LOCATION"), {
  value: {
    fileName: "effect-expression/source.js",
    lineNumber: 1
  }
});
function* test2() {
  yield 1 + 2;
}
Object.defineProperty(test2, Symbol.for("@@redux-saga/LOCATION"), {
  value: {
    fileName: "effect-expression/source.js",
    lineNumber: 5
  }
});