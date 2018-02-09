var _SAGA_LOCATION = require("redux-saga").SAGA_LOCATION;

function* withEffectObjectProps() {
  yield function reduxSagaSource() {
    var res = race({
      timeout: delay(3000),
      cannelled: take('CANCELLED')
    });
    res[_SAGA_LOCATION] = {
      fileName: "{{filename}}",
      lineNumber: 2,
      code: "race({\n    timeout: delay(3000),\n    cannelled: take('CANCELLED')\n  })"
    };
    return res;
  }();
}

withEffectObjectProps[_SAGA_LOCATION] = {
  fileName: "{{filename}}",
  lineNumber: 1
};
