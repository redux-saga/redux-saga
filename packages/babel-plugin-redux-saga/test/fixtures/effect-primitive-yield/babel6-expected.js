function _extendSagaSourceLocation(value, location) {
  if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
    Object.defineProperty(value, '@@redux-saga/LOCATION', {
      value: location
    });
  }

  return value;
}

function getNumber() {
  return 20;
}

function* test1() {
  yield _extendSagaSourceLocation(getNumber(), {
    fileName: 'test/fixtures/effect-primitive-yield/source.js',
    lineNumber: 6,
    code: 'getNumber()'
  });
}

Object.defineProperty(test1, '@@redux-saga/LOCATION', {
  value: {
    fileName: 'test/fixtures/effect-primitive-yield/source.js',
    lineNumber: 5,
    code: null
  }
})
function* test2() {
  yield 'hello';
}

Object.defineProperty(test2, '@@redux-saga/LOCATION', {
  value: {
    fileName: 'test/fixtures/effect-primitive-yield/source.js',
    lineNumber: 9,
    code: null
  }
})
function* test3() {
  yield null;
}

Object.defineProperty(test3, '@@redux-saga/LOCATION', {
  value: {
    fileName: 'test/fixtures/effect-primitive-yield/source.js',
    lineNumber: 13,
    code: null
  }
})
function* test4() {
  yield undefined;
}

Object.defineProperty(test4, '@@redux-saga/LOCATION', {
  value: {
    fileName: 'test/fixtures/effect-primitive-yield/source.js',
    lineNumber: 17,
    code: null
  }
})
function* test5() {
  yield _extendSagaSourceLocation(foo(1, 2, 3), {
    fileName: 'test/fixtures/effect-primitive-yield/source.js',
    lineNumber: 22,
    code: 'foo(1, 2, 3)'
  });
}
Object.defineProperty(test5, '@@redux-saga/LOCATION', {
  value: {
    fileName: 'test/fixtures/effect-primitive-yield/source.js',
    lineNumber: 21,
    code: null
  }
})