import { take, put, call, fork, select } from 'redux-saga/effects'
import * as actions from '../actions'
import { selectedTopicSelector, postsByTopicSelector } from '../reducers/selectors'

// Latest Hacker News stories whose title mentions the topic
export function fetchPostsApi(topic) {
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    restrictSearchableAttributes: 'title',
    typoTolerance: 'false',
    queryType: 'prefixNone',
  })
  return fetch(`https://hn.algolia.com/api/v1/search_by_date?${params}`)
    .then((response) => response.json())
    .then((json) => json.hits)
}

export function* fetchPosts(topic) {
  yield put(actions.requestPosts(topic))
  const posts = yield call(fetchPostsApi, topic)
  yield put(actions.receivePosts(topic, posts))
}

export function* invalidateTopic() {
  while (true) {
    const { topic } = yield take(actions.INVALIDATE_TOPIC)
    yield call(fetchPosts, topic)
  }
}

export function* nextTopicChange() {
  while (true) {
    const prevTopic = yield select(selectedTopicSelector)
    yield take(actions.SELECT_TOPIC)

    const newTopic = yield select(selectedTopicSelector)
    const postsByTopic = yield select(postsByTopicSelector)
    if (prevTopic !== newTopic && !postsByTopic[newTopic]) yield fork(fetchPosts, newTopic)
  }
}

export function* startup() {
  const selectedTopic = yield select(selectedTopicSelector)
  yield fork(fetchPosts, selectedTopic)
}

export default function* root() {
  yield fork(startup)
  yield fork(nextTopicChange)
  yield fork(invalidateTopic)
}
