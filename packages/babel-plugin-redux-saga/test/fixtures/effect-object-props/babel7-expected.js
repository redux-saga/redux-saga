function* withEffectObjectProps() {
  yield function (value) {
    if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
      Object.defineProperty(value, "@@redux-saga/LOCATION", {
        value: {
          fileName: "test\\fixtures\\effect-object-props\\source.js",
          lineNumber: 2,
          code: "race({\r\n    timeout: delay(3000),\r\n    cancelled: take('CANCELLED'),\r\n  })"
        }
      });
    }
    return value;
  }(race({
    timeout: delay(3000),
    cancelled: take('CANCELLED')
  }));
}
Object.defineProperty(withEffectObjectProps, "@@redux-saga/LOCATION", {
  value: {
    fileName: "test\\fixtures\\effect-object-props\\source.js",
    lineNumber: 1,
    code: null
  }
})