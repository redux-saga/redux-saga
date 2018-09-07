function* withEffectObjectProps() {
  yield Object.defineProperty(race({
    timeout: delay(3000),
    cancelled: take('CANCELLED')
  }), '@@redux-saga/LOCATION', {
    value: {
      fileName: 'test/fixtures/effect-object-props/source.js',
      lineNumber: 2,
      code: 'race({\n    timeout: delay(3000),\n    cancelled: take(\'CANCELLED\'),\n  })'
    }
  });
}
Object.defineProperty(withEffectObjectProps, '@@redux-saga/LOCATION', {
  value: {
    fileName: 'test/fixtures/effect-object-props/source.js',
    lineNumber: 1,
    code: null
  }
})
