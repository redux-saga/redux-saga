var _SAGA_LOCATION = require("redux-saga").SAGA_LOCATION;

function* hasNested() {
  yield function reduxSagaSource() {
    var res = call(function* test2() {
      yield function reduxSagaSource() {
        var res = call(foo);
        res[_SAGA_LOCATION] = {
          fileName: "effect-nested/source.js",
          lineNumber: 3,
          code: "call(foo)"
        };
        return res;
      }();
    });
    res[_SAGA_LOCATION] = {
      fileName: "effect-nested/source.js",
      lineNumber: 2,
      code: "call(function* test2() {\n    yield call(foo)\n  })"
    };
    return res;
  }();
}

hasNested[_SAGA_LOCATION] = {
  fileName: "effect-nested/source.js",
  lineNumber: 1
};
