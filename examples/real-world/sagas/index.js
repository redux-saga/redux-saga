import { take, put, call, fork } from 'redux-saga'
import { history, api } from '../services'
import * as actions from '../actions'

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
// url    : next page url. If not provided will use pass it to apiFn
function* fetchEntity(entity, apiFn, id, url) {
  yield put( entity.request(id) )
  const {response, error} = yield call(apiFn, url || id)
  if(response)
    yield put( entity.success(id, response) )
  else
    yield put( entity.failure(id, error) )
}

// yeah! we can also bind Generators
const fetchUser       = fetchEntity.bind(null, user, api.fetchUser)
const fetchRepo       = fetchEntity.bind(null, repo, api.fetchRepo)
const fetchStarred    = fetchEntity.bind(null, starred, api.fetchStarred)
const fetchStargazers = fetchEntity.bind(null, stargazers, api.fetchStargazers)

// load user unless it is cached
function* loadUser(login, user, requiredFields) {
  if (!user || requiredFields.some(key => !user.hasOwnProperty(key))) {
    yield call(fetchUser, login)
  }
}

// load repo unless it is cached
function* loadRepo(fullName, repo, requiredFields) {
  if (!repo || requiredFields.some(key => !repo.hasOwnProperty(key)))
    yield call(fetchRepo, fullName)
}

// load next page of repos starred by this user unless it is cached
function* loadStarred(login, starredByUser = {}, loadMore) {
  if (!starredByUser.pageCount || loadMore)
    yield call(
      fetchStarred,
      login,
      starredByUser.nextPageUrl || firstPageStarredUrl(login)
    )
}

// load next page of users who starred this repo unless it is cached
function* loadStargazers(fullName, stargazersByRepo = {}, loadMore) {
  if (!stargazersByRepo.pageCount || loadMore)
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
function* watchLoadUserPage(getUser, getStarredByUser) {
  while(true) {
    const {login, requiredFields = []} = yield take(actions.LOAD_USER_PAGE)

    yield fork(loadUser, login, getUser(login), requiredFields)
    yield fork(loadStarred, login, getStarredByUser(login))
  }
}

// Fetches data for a Repo: repo data + repo stargazers
function* watchLoadRepoPage(getRepo, getStargazersByRepo) {
  while(true) {
    const {fullName, requiredFields = []} = yield take(actions.LOAD_REPO_PAGE)

    yield fork(loadRepo, fullName, getRepo(fullName), requiredFields)
    yield fork(loadStargazers, fullName, getStargazersByRepo(fullName))
  }
}

// Fetches more starred repos, use pagination data from getStarredByUser(login)
function* watchLoadMoreStarred(getStarredByUser) {
  while(true) {
    const {login} = yield take(actions.LOAD_MORE_STARRED)
    yield fork(loadStarred, login, getStarredByUser(login), true)
  }
}

function* watchLoadMoreStargazers(getStargazersByRepo) {
  while(true) {
    const {fullName} = yield take(actions.LOAD_MORE_STARGAZERS)
    yield fork(loadStargazers, fullName, getStargazersByRepo(fullName), true)
  }
}

export default function* root(getState) {

  const getUser = login => getState().entities.users[login]
  const getRepo = fullName => getState().entities.repos[fullName]
  const getStarredByUser = login => getState().pagination.starredByUser[login]
  const getStargazersByRepo = fullName => getState().pagination.stargazersByRepo[fullName]

  yield fork(watchNavigate)
  yield fork(watchLoadUserPage, getUser, getStarredByUser)
  yield fork(watchLoadRepoPage, getRepo, getStargazersByRepo)
  yield fork(watchLoadMoreStarred, getStarredByUser)
  yield fork(watchLoadMoreStargazers, getStargazersByRepo)
}
