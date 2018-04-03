function* withEffectObjectProps() {
  yield race({
    timeout: delay(3000),
    cancelled: take('CANCELLED'),
  })
}
