import shop from '../api/shop'

import { API_CALL } from '../constants/ServiceTypes'

export default function apiCallService() {

    return next => action => {
      if( action[API_CALL] ) {
        const { endpoint, payload } = action[API_CALL]
        return shop[endpoint](payload)
      } else
        return next(action)
    }
}
