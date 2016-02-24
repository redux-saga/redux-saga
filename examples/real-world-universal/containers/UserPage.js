import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { loadUserPage, loadMoreStarred} from '../actions'
import User from '../components/User'
import Repo from '../components/Repo'
import List from '../components/List'
import zip from 'lodash/zip'
import { loadUser, loadStarred } from '../sagas'

class UserPage extends Component {
  constructor(props) {
    super(props)
    this.renderRepo = this.renderRepo.bind(this)
    this.handleLoadMoreClick = this.handleLoadMoreClick.bind(this)
  }

  componentWillMount() {
    this.props.loadUserPage(this.props.login)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.login !== nextProps.login) {
      this.props.loadUserPage(nextProps.login)
    }
  }

  handleLoadMoreClick() {
    this.props.loadMoreStarred(this.props.login)
  }

  renderRepo([ repo, owner ]) {
    return (
      <Repo repo={repo}
            owner={owner}
            key={repo.fullName} />
    )
  }

  render() {
    const { user, login } = this.props

    if (!user) {
      return <h1><i>Loading {login}’s profile...</i></h1>
    }

    const { starredRepos, starredRepoOwners, starredPagination } = this.props
    return (
      <div>
        <User user={user} />
        <hr />
        <List renderItem={this.renderRepo}
              items={zip(starredRepos, starredRepoOwners)}
              onLoadMoreClick={this.handleLoadMoreClick}
              loadingLabel={`Loading ${login}’s starred...`}
              {...starredPagination} />
      </div>
    )
  }
}

UserPage.propTypes = {
  login: PropTypes.string.isRequired,
  user: PropTypes.object,
  starredPagination: PropTypes.object,
  starredRepos: PropTypes.array.isRequired,
  starredRepoOwners: PropTypes.array.isRequired,
  loadUserPage: PropTypes.func.isRequired,
  loadMoreStarred: PropTypes.func.isRequired
}

UserPage.preload = function ({ login }) {
  return [
    [ loadUser, login ],
    [ loadStarred, login ]
  ]
}

function mapStateToProps(state, ownProps) {
  const { login } = ownProps.params
  const {
    pagination: { starredByUser },
    entities: { users, repos }
  } = state

  const starredPagination = starredByUser[login] || { ids: [] }
  const starredRepos = starredPagination.ids.map(id => repos[id])
  const starredRepoOwners = starredRepos.map(repo => users[repo.owner])

  return {
    login,
    starredRepos,
    starredRepoOwners,
    starredPagination,
    user: users[login]
  }
}

export default connect(mapStateToProps, {
  loadUserPage,
  loadMoreStarred
})(UserPage)
