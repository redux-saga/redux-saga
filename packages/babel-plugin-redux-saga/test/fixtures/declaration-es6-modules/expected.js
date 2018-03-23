export function* test1() {
  yield function reduxSagaSource() {
    var res = foo(1, 2, 3);
    res[Symbol.for("@@redux-saga/LOCATION")] = {
      fileName: "declaration-es6-modules/source.js",
      lineNumber: 2,
      code: "foo(1, 2, 3)"
    };
    return res;
  }();
}
test1[Symbol.for("@@redux-saga/LOCATION")] = {
  fileName: "declaration-es6-modules/source.js",
  lineNumber: 1
};
export default function* test2() {
  yield 2;
}
test2[Symbol.for("@@redux-saga/LOCATION")] = {
  fileName: "declaration-es6-modules/source.js",
  lineNumber: 5
};
