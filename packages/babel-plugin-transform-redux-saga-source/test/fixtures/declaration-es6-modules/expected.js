import { SAGA_LOCATION as _SAGA_LOCATION } from "redux-saga";
export function* test1() {
  yield function reduxSagaSource() {
    var res = foo(1, 2, 3);
    res[_SAGA_LOCATION] = {
      fileName: "{{filename}}",
      lineNumber: 2,
      code: "foo(1, 2, 3)"
    };
    return res;
  }();
}
test1[_SAGA_LOCATION] = {
  fileName: "{{filename}}",
  lineNumber: 1
};
export default function* test2() {
  yield 2;
}
test2[_SAGA_LOCATION] = {
  fileName: "{{filename}}",
  lineNumber: 5
};
