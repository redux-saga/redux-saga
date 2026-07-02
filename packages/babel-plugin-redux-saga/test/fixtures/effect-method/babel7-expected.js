function* test1() {
  yield function (value) {
    if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
      Object.defineProperty(value, "@@redux-saga/LOCATION", {
        value: {
          fileName: "test\\fixtures\\effect-method\\source.js",
          lineNumber: 2,
          code: "foo.bar(1, 2, 3)"
        }
      });
    }
    return value;
  }(foo.bar(1, 2, 3));
}
Object.defineProperty(test1, "@@redux-saga/LOCATION", {
  value: {
    fileName: "test\\fixtures\\effect-method\\source.js",
    lineNumber: 1,
    code: null
  }
})