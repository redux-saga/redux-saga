import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { loadRepoPage, loadMoreStargazers } from '../actions'
import Repo from '../components/Repo'
import User from '../components/User'
import List from '../components/List'
import { loadRepo, loadStargazers } from '../sagas'


class RepoPage extends Component {
  constructor(props) {
    super(props)
    this.renderUser = this.renderUser.bind(this)
    this.handleLoadMoreClick = this.handleLoadMoreClick.bind(this)
  }

  componentWillMount() {
    this.props.loadRepoPage(this.props.fullName)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.fullName !== this.props.fullName) {
      this.props.loadRepoPage(nextProps.fullName)
    }
  }

  handleLoadMoreClick() {
    this.props.loadMoreStargazers(this.props.fullName)
  }

  renderUser(user) {
    return (
      <User user={user}
            key={user.login} />
    )
  }

  render() {
    const { repo, owner, name } = this.props
    if (!repo || !owner) {
      return <h1><i>Loading {name} details...</i></h1>
    }

    const { stargazers, stargazersPagination } = this.props
    return (
      <div>
        <Repo repo={repo}
                    owner={owner} />
        <hr />
        <List renderItem={this.renderUser}
              items={stargazers}
              onLoadMoreClick={this.handleLoadMoreClick}
              loadingLabel={`Loading stargazers of ${name}...`}
              {...stargazersPagination} />
      </div>
    )
  }
}

RepoPage.propTypes = {
  repo: PropTypes.object,
  fullName: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  owner: PropTypes.object,
  stargazers: PropTypes.array.isRequired,
  stargazersPagination: PropTypes.object,
  loadRepoPage: PropTypes.func.isRequired,
  loadMoreStargazers: PropTypes.func.isRequired
}

RepoPage.preload = function ({ login, name }) {
  const fullName = `${login}/${name}`

  return [
    [ loadRepo, fullName ],
    [ loadStargazers, fullName ]
  ]
}

function mapStateToProps(state, ownProps) {
  const { login, name } = ownProps.params
  const {
    pagination: { stargazersByRepo },
    entities: { users, repos }
  } = state

  const fullName = `${login}/${name}`
  const stargazersPagination = stargazersByRepo[fullName] || { ids: [] }
  const stargazers = stargazersPagination.ids.map(id => users[id])

  return {
    fullName,
    name,
    stargazers,
    stargazersPagination,
    repo: repos[fullName],
    owner: users[login]
  }
}

export default connect(mapStateToProps, {
  loadRepoPage,
  loadMoreStargazers
})(RepoPage)
