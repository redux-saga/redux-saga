function _extendSagaSourceLocation(value, location) {
  if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
    Object.defineProperty(value, "@@redux-saga/LOCATION", {
      value: location
    });
  }

  return value;
}

export function* test1() {
  yield _extendSagaSourceLocation(foo(1, 2, 3), {
    fileName: "test/fixtures/declaration-es6-modules/source.js",
    lineNumber: 2,
    code: "foo(1, 2, 3)"
  });
}

Object.defineProperty(test1, "@@redux-saga/LOCATION", {
  value: {
    fileName: "test/fixtures/declaration-es6-modules/source.js",
    lineNumber: 1,
    code: null
  }
})
export default function* test2() {
  yield 2;
}
Object.defineProperty(test2, "@@redux-saga/LOCATION", {
  value: {
    fileName: "test/fixtures/declaration-es6-modules/source.js",
    lineNumber: 5,
    code: null
  }
})