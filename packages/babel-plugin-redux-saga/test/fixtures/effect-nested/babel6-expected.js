function* hasNested() {
  yield Object.defineProperty(call(Object.defineProperty(function* test2() {
    yield Object.defineProperty(call(foo), "@@redux-saga/LOCATION", {
      value: {
        fileName: "test/fixtures/effect-nested/source.js",
        lineNumber: 3,
        code: "call(foo)"
      }
    });
  }, "@@redux-saga/LOCATION", {
    value: {
      fileName: "test/fixtures/effect-nested/source.js",
      lineNumber: 2,
      code: "function* test2() {\n    yield call(foo)\n  }"
    }
  })), "@@redux-saga/LOCATION", {
    value: {
      fileName: "test/fixtures/effect-nested/source.js",
      lineNumber: 2,
      code: "call(function* test2() {\n    yield call(foo)\n  })"
    }
  });
}

Object.defineProperty(hasNested, "@@redux-saga/LOCATION", {
  value: {
    fileName: "test/fixtures/effect-nested/source.js",
    lineNumber: 1,
    code: null
  }
})