//import fetch from 'isomorphic-fetch'
import * as actions from '../actions'

function delay(val, ms) {
  return new Promise((res) => {
    setTimeout( () => res(val), ms);
  })
}

function fetchPostsApi(reddit) {
    return fetch(`http://www.reddit.com/r/${reddit}.json` )
            .then(response => response.json() )
            .then(json => json.data.children.map(child => child.data) )
            .then(data => delay(data, 5000))
}

function* fetchPosts(io, reddit) {
  yield io.put( actions.requestPosts(reddit) )
  const posts = yield io.call(fetchPostsApi, reddit)
  yield io.put( actions.receivePosts(reddit, posts) )
}

function* invalidateReddit(io, getState) {
  while (true) {
    const {reddit} = yield io.take(actions.INVALIDATE_REDDIT)
    yield fetchPosts(io, reddit)
  }
}

function* selectReddit(io, getState, oldReddit, newReddit) {

  const posts = getState().postsByReddit[newReddit],
        shouldFetch = !posts || oldReddit !== newReddit

  yield [
    selectReddit(io, getState,
      newReddit,
      yield io.take(actions.SELECT_REDDIT)
    ),
    shouldFetch ? fetchPosts(io, newReddit) : null
  ]
}

function* startup(io, getState) {
  const reddit = getState().selectedReddit
  yield selectReddit(io, getState, reddit, reddit)
}

export default [
  startup,
  invalidateReddit
]
