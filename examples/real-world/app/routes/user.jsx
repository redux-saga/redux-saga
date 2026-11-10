import { useDispatch, useSelector } from 'react-redux'
import { loadUserPage, loadMoreStarred } from '../actions'
import { getStarredByUser, getUser, getUserLoadError } from '../reducers/selectors'
import { assertLogin, preload } from '../preload.server'
import { getBrowserStore } from '../store.client'
import User from '../components/User'
import Repo from '../components/Repo'
import List from '../components/List'

// First page load, on the server: the sagas fetch the page's data before it renders.
export async function loader({ params }) {
  assertLogin(params.login)
  return { preloadedState: await preload(loadUserPage(params.login, ['name'])) }
}

// Later navigations, in the browser: the same action goes to the browser's store, and its sagas fetch the data.
// The page renders right away and shows loading states until the data arrives.
export function clientLoader({ params }) {
  getBrowserStore().dispatch(loadUserPage(params.login, ['name']))
  return null
}

export default function UserPage({ params }) {
  const { login } = params
  const user = useSelector((state) => getUser(state, login))
  const loadError = useSelector((state) => getUserLoadError(state, login))
  const starredPagination = useSelector((state) => getStarredByUser(state, login))
  const { users, repos } = useSelector((state) => state.entities)
  const dispatch = useDispatch()

  if (!user && loadError) {
    return (
      <h1>
        <i>
          Couldn’t load {login}’s profile: {loadError}
        </i>
      </h1>
    )
  }

  if (!user) {
    return (
      <h1>
        <i>Loading {login}’s profile...</i>
      </h1>
    )
  }

  return (
    <div>
      <User user={user} />
      <hr />
      <List
        renderItem={(repo) => <Repo repo={repo} owner={users[repo.owner]} key={repo.fullName} />}
        items={starredPagination.ids.map((id) => repos[id])}
        onLoadMoreClick={() => dispatch(loadMoreStarred(login))}
        loadingLabel={`Loading ${login}’s starred...`}
        {...starredPagination}
      />
    </div>
  )
}
