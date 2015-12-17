
export const deferred = () => {
  let def = {}
  const promise = new Promise((resolve, reject) => {
    def.resolve = resolve
    def.reject = reject
  })
  def.promise = promise
  return def
}

export const arrayOfDeffered = length => {
  const arr = []
  for (var i = 0; i < length; i++) {
    arr.push(deferred())
  }
  return arr
}
