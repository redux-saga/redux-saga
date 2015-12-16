/* eslint-disable no-constant-condition */

import fetch from 'isomorphic-fetch'
import * as actions from '../actions'

function fetchPostsApi(reddit) {
    return fetch(`http://www.reddit.com/r/${reddit}.json` )
            .then(response => response.json() )
            .then(json => json.data.children.map(child => child.data) )
}

function* fetchPosts(io, reddit) {
  yield io.put( actions.requestPosts(reddit) )
  const posts = yield io.call(fetchPostsApi, reddit)
  yield io.put( actions.receivePosts(reddit, posts) )
}

function* invalidateReddit(io) {
  while (true) {
    const {reddit} = yield io.take(actions.INVALIDATE_REDDIT)
    yield fetchPosts(io, reddit)
  }
}

function* nextRedditChange(io, getState) {

  const reddit = getState().selectedReddit
  // wait for the any action
  yield io.take(actions.SELECT_REDDIT)

  const state = getState(),
        newReddit = state.selectedReddit,
        shouldFetch = reddit !== newReddit && !state.postsByReddit[newReddit]

  yield io.race([
    shouldFetch ? fetchPosts(io, newReddit) : null,
    nextRedditChange(io, getState)
  ])
}

function* startup(io, getState) {
  yield fetchPosts(io, getState().selectedReddit)
}

export default [
  startup,
  nextRedditChange,
  invalidateReddit
]
