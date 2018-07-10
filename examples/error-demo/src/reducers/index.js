export default function errorGeneratorReducer(state = 0, action) {
  switch (action.type) {
    case 'REDUCER_ACTION_ERROR_IN_PUT':
      throw new Error('error in put')
    default:
      return state
  }
}

export function errorGeneratorSelector() {
  // eslint-disable-next-line no-undef
  undefinedIsNotAFunction()
}
