const sum = (a, b) => a + b
function* tstest1() {
  const result = yield sum(1, 2)
  return result
}
const z = 1 // that's hack. since there's a problem with babel https://github.com/babel/babel/issues/7002
//# sourceMappingURL=source.js.map
