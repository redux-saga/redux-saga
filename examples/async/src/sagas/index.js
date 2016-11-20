/* eslint-disable no-constant-condition */
import { take, put, call, fork, spawn, select } from '../../../../src/effects'
import fetch from 'isomorphic-fetch'
import * as actions from '../actions'
import { selectedRedditSelector, postsByRedditSelector } from '../reducers/selectors'

export function fetchPostsApi(reddit) {
  if (reddit === 'simulate network failure') {
    throw new Error('Failed to fetch')
  } else {
    return fetch(`http://www.reddit.com/r/${reddit}.json` )
      .then(response => response.json() )
      .then(json => json.data.children.map(child => child.data) )
  }
}

export function* fetchPosts(reddit) {
  yield put( actions.requestPosts(reddit) )
  const posts = yield call(fetchPostsApi, reddit)
  yield put( actions.receivePosts(reddit, posts) )
}

export function* invalidateReddit() {
  while (true) {
    const {reddit} = yield take(actions.INVALIDATE_REDDIT)
    yield put(actions.clearError())
    yield call( fetchPosts, reddit )
  }
}

export function* nextRedditChange() {
  while(true) {
    const prevReddit = yield select(selectedRedditSelector)
    yield take(actions.SELECT_REDDIT)
    yield put(actions.clearError())

    const newReddit = yield select(selectedRedditSelector)
    const postsByReddit = yield select(postsByRedditSelector)
    if(prevReddit !== newReddit && !postsByReddit[newReddit]) {
      yield call(fetchPosts, newReddit)
    }
  }
}

export function* startup() {
  const selectedReddit = yield select(selectedRedditSelector)
  yield fork(fetchPosts, selectedReddit)
}

export default function* root() {
  yield fork(startup)
  const sagas = [nextRedditChange, invalidateReddit]

  yield sagas.map(saga =>
    spawn(function* () {
      let isSyncError = false
      while (!isSyncError) {
        isSyncError = true
        try {
          setTimeout(() => isSyncError = false)
          yield call(saga)
        } catch (e) {
          if (isSyncError) {
            throw new Error(saga.name + ' was terminated because it threw an exception on startup.')
          }
          yield put(actions.setError(e.message))
        }
      }
    })
  )
}
