function* test1() {
  yield function reduxSagaSource() {
    var res = foo(1, 2, 3);
    res.__source = {
      fileName: "test/fixtures/base-path/source.js",
      lineNumber: 2,
      code: "foo(1, 2, 3)"
    };
    return res;
  }();
}

test1.__source = {
  fileName: "test/fixtures/base-path/source.js",
  lineNumber: 1
};

function* test2() {
  yield 2;
}

test2.__source = {
  fileName: "test/fixtures/base-path/source.js",
  lineNumber: 5
};
