function* test1() {
  yield function reduxSagaSource() {
    var res = foo(1, 2, 3);
    res[Symbol.for("babel-plugin-transform-redux-saga-source")] = {
      fileName: "{{filename}}",
      lineNumber: 2,
      code: "foo(1, 2, 3)"
    };
    return res;
  }();
}

test1[Symbol.for("babel-plugin-transform-redux-saga-source")] = {
  fileName: "{{filename}}",
  lineNumber: 1
};

function* test2() {
  yield 2;
}

test2[Symbol.for("babel-plugin-transform-redux-saga-source")] = {
  fileName: "{{filename}}",
  lineNumber: 5
};
