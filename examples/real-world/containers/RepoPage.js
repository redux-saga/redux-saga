/* eslint-disable react/no-deprecated, react/no-string-refs, react/no-unescaped-entities, react/jsx-no-target-blank */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { loadRepoPage, loadMoreStargazers } from '../actions'
import Repo from '../components/Repo'
import User from '../components/User'
import List from '../components/List'
import PropTypes from 'prop-types'
import { findKey } from 'lodash/object'

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
    // eslint-disable-next-line no-console
    console.log('load more', this.props.loadMoreStargazers)
    this.props.loadMoreStargazers(this.props.fullName)
  }

  renderUser(user) {
    return <User user={user} key={user.login} />
  }

  render() {
    const { repo, owner, name } = this.props
    if (!repo || !owner) {
      return (
        <h1>
          <i>Loading {name} details...</i>
        </h1>
      )
    }

    const { stargazers, stargazersPagination } = this.props
    return (
      <div>
        <Repo repo={repo} owner={owner} />
        <hr />
        <List
          renderItem={this.renderUser}
          items={stargazers}
          onLoadMoreClick={this.handleLoadMoreClick}
          loadingLabel={`Loading stargazers of ${name}...`}
          {...stargazersPagination}
        />
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
  loadMoreStargazers: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
  const { login, name } = state.router.params
  const {
    pagination: { stargazersByRepo },
    entities: { users, repos },
  } = state

  const fullName = `${login}/${name}`
  const stargazersPagination = stargazersByRepo[fullName] || { ids: [] }
  const stargazers = stargazersPagination.ids.map(id => users[id])

  var userid = findKey(users, (user) => {
    return user.login === login;
  });

  var repoid = findKey(repos, (repo) => {
    return repo.fullName === fullName;
  });

  return {
    fullName,
    name,
    stargazers,
    stargazersPagination,
    repo: repos[repoid],
    owner: users[userid],
  }
}

export default connect(
  mapStateToProps,
  {
    loadRepoPage,
    loadMoreStargazers,
  },
)(RepoPage)
