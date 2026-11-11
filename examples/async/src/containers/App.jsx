import { useDispatch, useSelector } from 'react-redux'
import { selectTopic, invalidateTopic } from '../actions'
import Picker from '../components/Picker'
import Posts from '../components/Posts'

const notFetchedYet = { isFetching: true, items: [] }

export default function App() {
  const selectedTopic = useSelector((state) => state.selectedTopic)
  const {
    isFetching,
    lastUpdated,
    items: posts,
  } = useSelector((state) => state.postsByTopic[state.selectedTopic] || notFetchedYet)
  const dispatch = useDispatch()

  const handleRefreshClick = (e) => {
    e.preventDefault()
    dispatch(invalidateTopic(selectedTopic))
  }

  return (
    <div>
      <Picker
        value={selectedTopic}
        onChange={(nextTopic) => dispatch(selectTopic(nextTopic))}
        options={['react', 'javascript']}
      />
      <p>
        {lastUpdated && <span>Last updated at {new Date(lastUpdated).toLocaleTimeString()}. </span>}
        {!isFetching && (
          <a href="#" onClick={handleRefreshClick}>
            Refresh
          </a>
        )}
      </p>
      {isFetching && posts.length === 0 && <h2>Loading...</h2>}
      {!isFetching && posts.length === 0 && <h2>Empty.</h2>}
      {posts.length > 0 && (
        <div style={{ opacity: isFetching ? 0.5 : 1 }}>
          <Posts posts={posts} />
        </div>
      )}
    </div>
  )
}
