function* hasNested() {
  yield call(function* test2() {
    yield call(foo)
  })
}
