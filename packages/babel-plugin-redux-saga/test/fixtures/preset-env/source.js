function* test1() {
  yield foo(1, 2, 3)
}

function* test2() {
  yield 2
}

class Component extends React.PureComponent {
  *getData() {
    yield 1
  }
  render() {
    const data = [...this.getData()]
    return data
  }
}
