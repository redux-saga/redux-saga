
export const REQUEST_POSTS = 'REQUEST_POSTS'
export const RECEIVE_POSTS = 'RECEIVE_POSTS'
export const SELECT_REDDIT = 'SELECT_REDDIT'
export const INVALIDATE_REDDIT = 'INVALIDATE_REDDIT'
export const SET_ERROR = 'SET_ERROR'
export const CLEAR_ERROR = 'CLEAR_ERROR'

export function selectReddit(reddit) {
  return {
    type: SELECT_REDDIT,
    reddit
  }
}

export function invalidateReddit(reddit) {
  return {
    type: INVALIDATE_REDDIT,
    reddit
  }
}

export function requestPosts(reddit) {
  return {
    type: REQUEST_POSTS,
    reddit
  }
}

export function receivePosts(reddit, posts) {
  return {
    type: RECEIVE_POSTS,
    reddit,
    posts,
    receivedAt: Date.now()
  }
}

export function setError(errorMessage) {
  return {
    type: SET_ERROR,
    errorMessage
  }
}

export function clearError() {
  return {
    type: CLEAR_ERROR
  }
}
