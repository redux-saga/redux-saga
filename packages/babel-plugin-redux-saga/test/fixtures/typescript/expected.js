var _SAGA_LOCATION = require("redux-saga").SAGA_LOCATION;

const sum = (a, b) => a + b;

function* tstest1() {
  const result = yield function reduxSagaSource() {
    var res = sum(1, 2);
    res[_SAGA_LOCATION] = {
      fileName: "{{filename}} (source.ts)",
      lineNumber: 5,
      code: "sum(1, 2)"
    };
    return res;
  }();
  return result;
}

tstest1[_SAGA_LOCATION] = {
  fileName: "{{filename}} (source.ts)",
  lineNumber: 4
};
const z = 1; // that's hack. since there's a problem with babel https://github.com/babel/babel/issues/7002
//# sourceMappingURL=source.js.map
