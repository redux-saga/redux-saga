export default function deferred() {
  const def = {}
  const promise = new Promise((resolve, reject) => {
    def.resolve = resolve
    def.reject = reject
  })
  def.promise = promise
  return def
}
