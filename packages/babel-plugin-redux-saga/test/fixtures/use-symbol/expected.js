function* test1() {
  yield function reduxSagaSource() {
    var res = foo(1, 2, 3);
    res["@@redux-saga/LOCATION"] = {
      fileName: "use-symbol/source.js",
      lineNumber: 2,
      code: "foo(1, 2, 3)"
    };
    return res;
  }();
}

test1["@@redux-saga/LOCATION"] = {
  fileName: "use-symbol/source.js",
  lineNumber: 1
};

function* test2() {
  yield 2;
}

test2["@@redux-saga/LOCATION"] = {
  fileName: "use-symbol/source.js",
  lineNumber: 5
};
