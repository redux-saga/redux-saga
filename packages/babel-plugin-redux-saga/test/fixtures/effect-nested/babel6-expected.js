function* hasNested() {
  yield function (value) {
    if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
      Object.defineProperty(value, "@@redux-saga/LOCATION", {
        value: {
          fileName: "test/fixtures/effect-nested/source.js",
          lineNumber: 2,
          code: "call(function* test2() {\n    yield call(foo)\n  })"
        }
      });
    }

    return value;
  }(call(Object.defineProperty(function* test2() {
    yield function (value) {
      if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
        Object.defineProperty(value, "@@redux-saga/LOCATION", {
          value: {
            fileName: "test/fixtures/effect-nested/source.js",
            lineNumber: 3,
            code: "call(foo)"
          }
        });
      }

      return value;
    }(call(foo));
  }, "@@redux-saga/LOCATION", {
    value: {
      fileName: "test/fixtures/effect-nested/source.js",
      lineNumber: 2,
      code: "function* test2() {\n    yield call(foo)\n  }"
    }
  })));
}
Object.defineProperty(hasNested, "@@redux-saga/LOCATION", {
  value: {
    fileName: "test/fixtures/effect-nested/source.js",
    lineNumber: 1,
    code: null
  }
})