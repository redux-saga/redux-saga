/* eslint-disable no-constant-condition */


import { take, put, call, fork, spawn, select } from '../../../../src/effects'
import fetch from 'isomorphic-fetch'
import * as actions from '../actions'
import { selectedRedditSelector, postsByRedditSelector } from '../reducers/selectors'

export function fetchPostsApi(reddit) {
    return fetch(`http://www.reddit.com/r/${reddit}.json` )
            .then(response => response.json() )
            .then(json => json.data.children.map(child => child.data) )
}

export function* fetchPosts(reddit) {
  yield put( actions.requestPosts(reddit) )
  const posts = yield call(fetchPostsApi, reddit)
  yield put( actions.receivePosts(reddit, posts) )
}

export function* invalidateReddit() {
  while (true) {
    const {reddit} = yield take(actions.INVALIDATE_REDDIT)
    try {
      yield call( fetchPosts, reddit )
    } catch (e) {
      // error handling here
    }
  }
}

export function* nextRedditChange() {
  while(true) {
    const prevReddit = yield select(selectedRedditSelector)
    yield take(actions.SELECT_REDDIT)

    const newReddit = yield select(selectedRedditSelector)
    const postsByReddit = yield select(postsByRedditSelector)
    if(prevReddit !== newReddit && !postsByReddit[newReddit])
      try {
        yield fork(fetchPosts, newReddit)
      } catch (e) {
        // error handling here
      }
  }
}

export function* startup() {
  const selectedReddit = yield select(selectedRedditSelector)
  yield fork(fetchPosts, selectedReddit)
}

export default function* root() {
  yield spawn(startup)
  yield spawn(nextRedditChange)
  yield spawn(invalidateReddit)
}
