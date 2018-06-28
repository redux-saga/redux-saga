function* test1() {
  yield foo.bar(1, 2, 3) || {}
}

function* test2() {
  yield 1 + 2
}
