const saga = Object.defineProperty(function* test1() {
  yield 1;
}, "@@redux-saga/LOCATION", {
  value: {
    fileName: "test\\fixtures\\expression\\source.js",
    lineNumber: 1,
    code: "function* test1() {\r\n  yield 1\r\n}"
  }
});