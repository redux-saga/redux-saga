function* test1() {
  yield Object.defineProperty(foo(1, 2, 3), "@@redux-saga/LOCATION", {
    value: {
      fileName: "use-symbol/source.js",
      lineNumber: 2,
      code: "foo(1, 2, 3)"
    }
  });
}

Object.defineProperty(test1, "@@redux-saga/LOCATION", {
  value: {
    fileName: "use-symbol/source.js",
    lineNumber: 1
  }
})

function* test2() {
  yield 2;
}

Object.defineProperty(test2, "@@redux-saga/LOCATION", {
  value: {
    fileName: "use-symbol/source.js",
    lineNumber: 5
  }
})
