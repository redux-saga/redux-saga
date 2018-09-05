function* test1() {
  yield Object.defineProperty(foo(1, 2, 3), "@@redux-saga/LOCATION", {
    value: {
      fileName: "{{absolutePath}}",
      lineNumber: 2,
      code: "foo(1, 2, 3)"
    }
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
