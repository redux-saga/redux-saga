/* eslint-disable no-constant-condition */
import { take, put, call, fork, select, all } from 'redux-saga/effects'
import { api, history } from '../services'
import * as actions from '../actions'
import { getUser, getRepo, getStarredByUser, getStargazersByRepo } from '../reducers/selectors'

// each entity defines 3 creators { request, success, failure }
const { user, repo, starred, stargazers } = actions

// url for first page
// urls for next pages will be extracted from the successive loadMore* requests
const firstPageStarredUrl = login => `users/${login}/starred`
const firstPageStargazersUrl = fullName => `repos/${fullName}/stargazers`


/***************************** Subroutines ************************************/

// resuable fetch Subroutine
// entity :  user | repo | starred | stargazers
// apiFn  : api.fetchUser | api.fetchRepo | ...
// id     : login | fullName
// url    : next page url. If not provided will use pass id to apiFn
function* fetchEntity(entity, apiFn, id, url) {
  yield put( entity.request(id) )
  const {response, error} = yield call(apiFn, url || id)
  if(response)
    yield put( entity.success(id, response) )
  else
    yield put( entity.failure(id, error) )
}

// yeah! we can also bind Generators
export const fetchUser       = fetchEntity.bind(null, user, api.fetchUser)
export const fetchRepo       = fetchEntity.bind(null, repo, api.fetchRepo)
export const fetchStarred    = fetchEntity.bind(null, starred, api.fetchStarred)
export const fetchStargazers = fetchEntity.bind(null, stargazers, api.fetchStargazers)

// load user unless it is cached
function* loadUser(login, requiredFields) {
  const user = yield select(getUser, login)
  if (!user || requiredFields.some(key => !user.hasOwnProperty(key))) {
    yield call(fetchUser, login)
  }
}

// load repo unless it is cached
function* loadRepo(fullName, requiredFields) {
  const repo = yield select(getRepo, fullName)
  if (!repo || requiredFields.some(key => !repo.hasOwnProperty(key)))
    yield call(fetchRepo, fullName)
}

// load next page of repos starred by this user unless it is cached
function* loadStarred(login, loadMore) {
  const starredByUser = yield select(getStarredByUser, login)
  if (!starredByUser || !starredByUser.pageCount || loadMore)
    yield call(
      fetchStarred,
      login,
      starredByUser.nextPageUrl || firstPageStarredUrl(login)
    )
}

// load next page of users who starred this repo unless it is cached
function* loadStargazers(fullName, loadMore) {
  const stargazersByRepo = yield select(getStargazersByRepo, fullName)
  if (!stargazersByRepo || !stargazersByRepo.pageCount || loadMore)
    yield call(
      fetchStargazers,
      fullName,
      stargazersByRepo.nextPageUrl || firstPageStargazersUrl(fullName)
    )
}

/******************************************************************************/
/******************************* WATCHERS *************************************/
/******************************************************************************/

// trigger router navigation via history
function* watchNavigate() {
  while(true) {
    const {pathname} = yield take(actions.NAVIGATE)
    yield history.push(pathname)
  }
}

// Fetches data for a User : user data + starred repos
function* watchLoadUserPage() {
  while(true) {
    const {login, requiredFields = []} = yield take(actions.LOAD_USER_PAGE)

    yield fork(loadUser, login, requiredFields)
    yield fork(loadStarred, login)
  }
}

// Fetches data for a Repo: repo data + repo stargazers
function* watchLoadRepoPage() {
  while(true) {
    const {fullName, requiredFields = []} = yield take(actions.LOAD_REPO_PAGE)

    yield fork(loadRepo, fullName, requiredFields)
    yield fork(loadStargazers, fullName)
  }
}

// Fetches more starred repos, use pagination data from getStarredByUser(login)
function* watchLoadMoreStarred() {
  while(true) {
    const {login} = yield take(actions.LOAD_MORE_STARRED)
    yield fork(loadStarred, login, true)
  }
}

function* watchLoadMoreStargazers() {
  while(true) {
    const {fullName} = yield take(actions.LOAD_MORE_STARGAZERS)
    yield fork(loadStargazers, fullName, true)
  }
}

export default function* root() {
  yield all([
    fork(watchNavigate),
    fork(watchLoadUserPage),
    fork(watchLoadRepoPage),
    fork(watchLoadMoreStarred),
    fork(watchLoadMoreStargazers)
  ])
}
