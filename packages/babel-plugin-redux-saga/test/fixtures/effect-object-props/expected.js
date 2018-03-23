function* withEffectObjectProps() {
  yield function reduxSagaSource() {
    var res = race({
      timeout: delay(3000),
      cannelled: take('CANCELLED')
    });
    res[Symbol.for("@@redux-saga/LOCATION")] = {
      fileName: "effect-object-props/source.js",
      lineNumber: 2,
      code: "race({\n    timeout: delay(3000),\n    cannelled: take('CANCELLED'),\n  })"
    };
    return res;
  }();
}

withEffectObjectProps[Symbol.for("@@redux-saga/LOCATION")] = {
  fileName: "effect-object-props/source.js",
  lineNumber: 1
};
