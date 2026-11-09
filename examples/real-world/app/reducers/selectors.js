// Shared by pages that haven't loaded yet, so selectors return the same object every time
const notLoaded = { ids: [] }

export const getUser = (state, login) => state.entities.users[login]
export const getRepo = (state, fullName) => state.entities.repos[fullName]
export const getStarredByUser = (state, login) => state.pagination.starredByUser[login] || notLoaded
export const getContributorsByRepo = (state, fullName) => state.pagination.contributorsByRepo[fullName] || notLoaded
