function* test1() {
  yield Object.defineProperty(foo.bar(1, 2, 3), "@@redux-saga/LOCATION", {
    value: {
      fileName: "test/fixtures/effect-method/source.js",
      lineNumber: 2,
      code: "foo.bar(1, 2, 3)"
    }
  });
}
Object.defineProperty(test1, "@@redux-saga/LOCATION", {
  value: {
    fileName: "test/fixtures/effect-method/source.js",
    lineNumber: 1,
    code: null
  }
})
