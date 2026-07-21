function _extendSagaSourceLocation(value, location) {
  if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
    Object.defineProperty(value, "@@redux-saga/LOCATION", {
      value: location
    });
  }
  return value;
}
function* test1() {
  yield _extendSagaSourceLocation(foo(1, 2, 3), {
    fileName: "{{absolutePath}}",
    lineNumber: 2,
    code: "foo(1, 2, 3)"
  });
}
Object.defineProperty(test1, "@@redux-saga/LOCATION", {
  value: {
    fileName: "{{absolutePath}}",
    lineNumber: 1,
    code: null
  }
})
function* test2() {
  yield 2;
}
Object.defineProperty(test2, "@@redux-saga/LOCATION", {
  value: {
    fileName: "{{absolutePath}}",
    lineNumber: 5,
    code: null
  }
})