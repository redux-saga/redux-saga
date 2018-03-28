function* hasNested() {
  yield function reduxSagaSource() {
    return Object.defineProperty(call(function reduxSagaSource() {
      return Object.defineProperty(function* test2() {
        yield function reduxSagaSource() {
          return Object.defineProperty(call(foo), Symbol.for("@@redux-saga/LOCATION"), {
            value: {
              fileName: "effect-nested/source.js",
              lineNumber: 3,
              code: "call(foo)"
            }
          });
        }();
      }, Symbol.for("@@redux-saga/LOCATION"), {
        value: {
          fileName: "effect-nested/source.js",
          lineNumber: 2,
          code: "function* test2() {\n    yield call(foo)\n  }"
        }
      });
    }()), Symbol.for("@@redux-saga/LOCATION"), {
      value: {
        fileName: "effect-nested/source.js",
        lineNumber: 2,
        code: "call(function* test2() {\n    yield call(foo)\n  })"
      }
    });
  }();
}
Object.defineProperty(hasNested, Symbol.for("@@redux-saga/LOCATION"), {
  value: {
    fileName: "effect-nested/source.js",
    lineNumber: 1
  }
});
