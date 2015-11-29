import shop from '../api/shop'

export default function API_CALL_INTERPRETER(
  { endpoint, payload, actionSuccess, args },
  dispatch
) {

  if(payload)
    shop[endpoint](payload, response => {
      dispatch(actionSuccess(...args, response))
    })
  else
    shop[endpoint](response => {
      dispatch(actionSuccess(...args, response))
    })
}
