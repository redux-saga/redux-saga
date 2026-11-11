import { combineReducers } from '@reduxjs/toolkit'
import { SELECT_TOPIC, REQUEST_POSTS, RECEIVE_POSTS } from '../actions'

function selectedTopic(state = 'react', action) {
  switch (action.type) {
    case SELECT_TOPIC:
      return action.topic
    default:
      return state
  }
}

function posts(
  state = {
    isFetching: false,
    items: [],
  },
  action,
) {
  switch (action.type) {
    case REQUEST_POSTS:
      return { ...state, isFetching: true }

    case RECEIVE_POSTS:
      return {
        ...state,
        isFetching: false,
        items: action.posts,
        lastUpdated: action.receivedAt,
      }
    default:
      return state
  }
}

function postsByTopic(state = {}, action) {
  switch (action.type) {
    case REQUEST_POSTS:
    case RECEIVE_POSTS:
      return {
        ...state,
        [action.topic]: posts(state[action.topic], action),
      }
    default:
      return state
  }
}

const rootReducer = combineReducers({
  postsByTopic,
  selectedTopic,
})

export default rootReducer
