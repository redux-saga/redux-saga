import { useDispatch, useSelector } from 'react-redux'
import { loadRepoPage, loadMoreContributors } from '../actions'
import { getRepo, getContributorsByRepo, getUser } from '../reducers/selectors'
import { preload } from '../preload.server'
import { getBrowserStore } from '../store.client'
import Repo from '../components/Repo'
import User from '../components/User'
import List from '../components/List'

const fullNameOf = ({ login, name }) => `${login}/${name}`

// First page load, on the server: the sagas fetch the page's data before it renders.
export async function loader({ params }) {
  return { preloadedState: await preload(loadRepoPage(fullNameOf(params), ['description'])) }
}

// Later navigations, in the browser: the same action goes to the browser's store, and its sagas fetch the data.
// The page renders right away and shows loading states until the data arrives.
export function clientLoader({ params }) {
  getBrowserStore().dispatch(loadRepoPage(fullNameOf(params), ['description']))
  return null
}

export default function RepoPage({ params }) {
  const { login, name } = params
  const fullName = fullNameOf(params)
  const repo = useSelector((state) => getRepo(state, fullName))
  const owner = useSelector((state) => getUser(state, login))
  const contributorsPagination = useSelector((state) => getContributorsByRepo(state, fullName))
  const users = useSelector((state) => state.entities.users)
  const dispatch = useDispatch()

  if (!repo || !owner) {
    return (
      <h1>
        <i>Loading {name} details...</i>
      </h1>
    )
  }

  return (
    <div>
      <Repo repo={repo} owner={owner} />
      <hr />
      <List
        renderItem={(user) => <User user={user} key={user.login} />}
        items={contributorsPagination.ids.map((id) => users[id])}
        onLoadMoreClick={() => dispatch(loadMoreContributors(fullName))}
        loadingLabel={`Loading contributors of ${name}...`}
        {...contributorsPagination}
      />
    </div>
  )
}
