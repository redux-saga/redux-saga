function* test1() {
  yield function reduxSagaSource() {
    var res = foo.bar(1, 2, 3);
    res[Symbol.for("@@redux-saga/LOCATION")] = {
      fileName: "effect-expression/source.js",
      lineNumber: 2,
      code: "foo.bar(1, 2, 3)"
    };
    return res;
  }() || {};
}

test1[Symbol.for("@@redux-saga/LOCATION")] = {
  fileName: "effect-expression/source.js",
  lineNumber: 1
};

function* test2() {
  yield 1 + 2;
}

test2[Symbol.for("@@redux-saga/LOCATION")] = {
  fileName: "effect-expression/source.js",
  lineNumber: 5
};
