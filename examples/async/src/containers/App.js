import * as React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { selectReddit, invalidateReddit } from '../actions'
import Picker from '../components/Picker'
import Posts from '../components/Posts'

class App extends React.Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleRefreshClick = this.handleRefreshClick.bind(this)
  }

  handleChange(nextReddit) {
    this.props.dispatch(selectReddit(nextReddit))
  }

  handleRefreshClick(e) {
    e.preventDefault()
    const { dispatch, selectedReddit } = this.props
    dispatch(invalidateReddit(selectedReddit))
  }

  render() {
    const { selectedReddit, posts, isFetching, lastUpdated } = this.props
    return (
      <div>
        <Picker value={selectedReddit} onChange={this.handleChange} options={['reactjs', 'frontend']} />
        <p>
          {lastUpdated && <span>Last updated at {new Date(lastUpdated).toLocaleTimeString()}. </span>}
          {!isFetching && (
            <a href="#" onClick={this.handleRefreshClick}>
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
}

App.propTypes = {
  selectedReddit: PropTypes.string.isRequired,
  posts: PropTypes.array.isRequired,
  isFetching: PropTypes.bool.isRequired,
  lastUpdated: PropTypes.number,
  dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
  const { selectedReddit, postsByReddit } = state
  const { isFetching, lastUpdated, items: posts } = postsByReddit[selectedReddit] || {
    isFetching: true,
    items: [],
  }

  return {
    selectedReddit,
    posts,
    isFetching,
    lastUpdated,
  }
}

export default connect(mapStateToProps)(App)
