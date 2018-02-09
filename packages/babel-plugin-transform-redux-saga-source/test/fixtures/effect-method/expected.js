var _SAGA_LOCATION = require("redux-saga").SAGA_LOCATION;

function* test1() {
  yield function reduxSagaSource() {
    var res = foo.bar(1, 2, 3);
    res[_SAGA_LOCATION] = {
      fileName: "{{filename}}",
      lineNumber: 2,
      code: "foo.bar(1, 2, 3)"
    };
    return res;
  }();
}

test1[_SAGA_LOCATION] = {
  fileName: "{{filename}}",
  lineNumber: 1
};
