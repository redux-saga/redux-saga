
export const getUser = (state, login) => state.entities.users[login]
export const getRepo = (state, fullName) => state.entities.repos[fullName]
export const getStarredByUser = (state, login) => state.pagination.starredByUser[login] || {}
export const getStargazersByRepo = (state, fullName) => state.pagination.stargazersByRepo[fullName] || {}
