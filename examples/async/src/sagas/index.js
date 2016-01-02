/* eslint-disable no-constant-condition */

import { take, put, call, fork } from '../../../../src'
import fetch from 'isomorphic-fetch'
import * as actions from '../actions'

function fetchPostsApi(reddit) {
    return fetch(`http://www.reddit.com/r/${reddit}.json` )
            .then(response => response.json() )
            .then(json => json.data.children.map(child => child.data) )
}

function* fetchPosts(reddit) {
  yield put( actions.requestPosts(reddit) )
  const posts = yield call(fetchPostsApi, reddit)
  yield put( actions.receivePosts(reddit, posts) )
}

function* invalidateReddit() {
  while (true) {
    const {reddit} = yield take(actions.INVALIDATE_REDDIT)
    yield call( fetchPosts, reddit )
  }
}

function* nextRedditChange(getState) {

  while(true) {
    const reddit = getState().selectedReddit
    // wait for the any action
    yield take(actions.SELECT_REDDIT)

    const state = getState(),
          newReddit = state.selectedReddit

    if(reddit !== newReddit && !state.postsByReddit[newReddit])
      yield fork(fetchPosts, newReddit)
  }
}

function* startup(getState) {
  yield fork(fetchPosts, getState().selectedReddit)
}

export default function* root(getState) {
  yield fork(startup, getState)
  yield fork(nextRedditChange, getState)
  yield fork(invalidateReddit, getState)
}
