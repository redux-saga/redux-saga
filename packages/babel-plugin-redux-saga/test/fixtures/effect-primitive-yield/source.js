function getNumber() {
  return 20
}

function* test1() {
  yield getNumber()
}

function* test2() {
  yield 'hello'
}

function* test3() {
  yield null
}

function* test4() {
  yield undefined
}

function* test5() {
  yield foo(1, 2, 3)
}
