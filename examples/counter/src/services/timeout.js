

export default function TIMEOUT_INTERPRETER({ delay, reaction }, dispatch) {
    setTimeout(() => {
      dispatch(reaction())
    }, delay)
}
