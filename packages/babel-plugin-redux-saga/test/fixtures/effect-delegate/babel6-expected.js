function* test1() {
  yield* foo(1, 2, 3);
}

Object.defineProperty(test1, "@@redux-saga/LOCATION", {
  value: {
    fileName: "test/fixtures/effect-delegate/source.js",
    lineNumber: 1,
    code: null
  }
})