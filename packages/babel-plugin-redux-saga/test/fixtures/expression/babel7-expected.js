const saga = Object.defineProperty(function* test1() {
  yield 1;
}, Symbol.for("@@redux-saga/LOCATION"), {
  value: {
    fileName: "test/fixtures/expression/source.js",
    lineNumber: 1,
    code: "function* test1() {\n  yield 1\n}"
  }
});
