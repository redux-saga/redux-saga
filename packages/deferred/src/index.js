export default function deferred() {
  const def = {}
  def.promise = new Promise((resolve, reject) => {
    def.resolve = resolve
    def.reject = reject
  })
  return def
}

export function arrayOfDeferred(length) {
  const arr = []

  for (let i = 0; i < length; i++) {
    arr.push(deferred())
  }

  return arr
}
