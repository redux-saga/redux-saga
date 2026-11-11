/* eslint-disable no-constant-condition */
import { take, put, call, fork, select, all } from 'redux-saga/effects'
import * as api from '../services/api'
import * as actions from '../actions'
import { getUser, getRepo, getStarredByUser, getContributorsByRepo } from '../reducers/selectors'

// each entity defines 3 creators { request, success, failure }
const { user, repo, starred, contributors } = actions

// url for first page
// urls for next pages will be extracted from the successive loadMore* requests
const firstPageStarredUrl = (login) => `users/${login}/starred`
const firstPageContributorsUrl = (fullName) => `repos/${fullName}/contributors`

/***************************** Subroutines ************************************/

// reusable fetch Subroutine
// entity :  user | repo | starred | contributors
// apiFn  : api.fetchUser | api.fetchRepo | ...
// id     : login | fullName
// url    : next page url. If not provided will use pass id to apiFn
function* fetchEntity(entity, apiFn, id, url) {
  yield put(entity.request(id))
  const { response, error } = yield call(apiFn, url || id)
  if (response) yield put(entity.success(id, response))
  else yield put(entity.failure(id, error))
}

// yeah! we can also bind Generators
export const fetchUser = fetchEntity.bind(null, user, api.fetchUser)
export const fetchRepo = fetchEntity.bind(null, repo, api.fetchRepo)
export const fetchStarred = fetchEntity.bind(null, starred, api.fetchStarred)
export const fetchContributors = fetchEntity.bind(null, contributors, api.fetchContributors)

// load user unless it is cached
function* loadUser(login, requiredFields) {
  const user = yield select(getUser, login)
  if (!user || requiredFields.some((key) => !user.hasOwnProperty(key))) {
    yield call(fetchUser, login)
  }
}

// load repo unless it is cached
function* loadRepo(fullName, requiredFields) {
  const repo = yield select(getRepo, fullName)
  if (!repo || requiredFields.some((key) => !repo.hasOwnProperty(key))) yield call(fetchRepo, fullName)
}

// load next page of repos starred by this user unless it is cached
function* loadStarred(login, loadMore) {
  const starredByUser = yield select(getStarredByUser, login)
  if (!starredByUser || !starredByUser.pageCount || loadMore)
    yield call(fetchStarred, login, starredByUser.nextPageUrl || firstPageStarredUrl(login))
}

// load next page of users who contributed to this repo unless it is cached
function* loadContributors(fullName, loadMore) {
  const contributorsByRepo = yield select(getContributorsByRepo, fullName)
  if (!contributorsByRepo || !contributorsByRepo.pageCount || loadMore)
    yield call(fetchContributors, fullName, contributorsByRepo.nextPageUrl || firstPageContributorsUrl(fullName))
}

/******************************************************************************/
/******************************* WATCHERS *************************************/
/******************************************************************************/

// Fetches data for a User : user data + starred repos
function* watchLoadUserPage() {
  while (true) {
    const { login, requiredFields = [] } = yield take(actions.LOAD_USER_PAGE)

    yield fork(loadUser, login, requiredFields)
    yield fork(loadStarred, login)
  }
}

// Fetches data for a Repo: repo data + its contributors
function* watchLoadRepoPage() {
  while (true) {
    const { fullName, requiredFields = [] } = yield take(actions.LOAD_REPO_PAGE)

    yield fork(loadRepo, fullName, requiredFields)
    yield fork(loadContributors, fullName)
  }
}

// Fetches more starred repos, use pagination data from getStarredByUser(login)
function* watchLoadMoreStarred() {
  while (true) {
    const { login } = yield take(actions.LOAD_MORE_STARRED)
    yield fork(loadStarred, login, true)
  }
}

function* watchLoadMoreContributors() {
  while (true) {
    const { fullName } = yield take(actions.LOAD_MORE_CONTRIBUTORS)
    yield fork(loadContributors, fullName, true)
  }
}

export default function* root() {
  yield all([
    fork(watchLoadUserPage),
    fork(watchLoadRepoPage),
    fork(watchLoadMoreStarred),
    fork(watchLoadMoreContributors),
  ])
}
