
export const delay = millis => () =>
  new Promise(resolve =>
    setTimeout( () => resolve(true), millis )
  )
