export const REQUEST_POSTS = 'REQUEST_POSTS'
export const RECEIVE_POSTS = 'RECEIVE_POSTS'
export const SELECT_TOPIC = 'SELECT_TOPIC'
export const INVALIDATE_TOPIC = 'INVALIDATE_TOPIC'

export function selectTopic(topic) {
  return {
    type: SELECT_TOPIC,
    topic,
  }
}

export function invalidateTopic(topic) {
  return {
    type: INVALIDATE_TOPIC,
    topic,
  }
}

export function requestPosts(topic) {
  return {
    type: REQUEST_POSTS,
    topic,
  }
}

export function receivePosts(topic, posts) {
  return {
    type: RECEIVE_POSTS,
    topic,
    posts,
    receivedAt: new Date().setMilliseconds(0),
  }
}
