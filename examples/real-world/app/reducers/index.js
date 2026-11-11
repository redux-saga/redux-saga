import * as ActionTypes from '../actions'
import { combineReducers } from '@reduxjs/toolkit'
import { merge } from 'lodash-es'
import paginate from './paginate'

// Updates an entity cache in response to any action with response.entities.
function entities(state = { users: {}, repos: {} }, action) {
  if (action.response && action.response.entities) {
    return merge({}, state, action.response.entities)
  }

  return state
}

// Updates error message to notify about the failed fetches.
function errorMessage(state = null, action) {
  const { type, error } = action

  if (type === ActionTypes.RESET_ERROR_MESSAGE) {
    return null
  } else if (error) {
    return action.error
  }

  return state
}

// Remembers why a user or repo failed to load, so its page can say so instead of loading forever.
// A new request for it clears the error.
function loadErrorsOf(types, mapActionToKey) {
  return function loadErrors(state = {}, action) {
    switch (action.type) {
      case types.FAILURE:
        return { ...state, [mapActionToKey(action)]: action.error }
      case types.REQUEST:
      case types.SUCCESS: {
        const key = mapActionToKey(action)
        if (!(key in state)) return state
        const { [key]: _cleared, ...rest } = state
        return rest
      }
      default:
        return state
    }
  }
}

const loadErrors = combineReducers({
  users: loadErrorsOf(ActionTypes.USER, (action) => action.login),
  repos: loadErrorsOf(ActionTypes.REPO, (action) => action.fullName),
})

// Updates the pagination data for different actions.
const pagination = combineReducers({
  starredByUser: paginate({
    mapActionToKey: (action) => action.login,
    types: [ActionTypes.STARRED.REQUEST, ActionTypes.STARRED.SUCCESS, ActionTypes.STARRED.FAILURE],
  }),
  contributorsByRepo: paginate({
    mapActionToKey: (action) => action.fullName,
    types: [ActionTypes.CONTRIBUTORS.REQUEST, ActionTypes.CONTRIBUTORS.SUCCESS, ActionTypes.CONTRIBUTORS.FAILURE],
  }),
})

const rootReducer = combineReducers({
  entities,
  pagination,
  loadErrors,
  errorMessage,
})

export default rootReducer
