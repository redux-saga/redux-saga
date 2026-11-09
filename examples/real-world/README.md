# Real-world example

A GitHub browser (users, their starred repos, and repo contributors) whose data layer is a set of sagas.
The same sagas run on the server, to render the first page with its data, and in the browser, for everything after.

## Run locally

`npm start` runs the dev server. `npm run build`, then `npm run serve`, runs the production build.

## How the sagas run on both sides

The app uses [React Router](https://reactrouter.com) in framework mode. Each page route has two loaders, and both
dispatch the same action, such as `loadUserPage(login)`:

- **On the server**, for the first page load, the route's `loader` calls `preload` (`app/preload.server.js`). It
  creates a store for that request, starts the root saga, dispatches the page's action, then dispatches `END`.
  The root saga is made of watchers that never return on their own. `END` ends every pending `take`, so the
  watchers return and the root task completes once the fetches they forked are done. The loader then returns
  the store's state: the server renders the page from it, and the browser store starts from it.
- **In the browser**, the store and its sagas live for the whole session (`app/store.client.js`). On later
  navigations, the route's `clientLoader` dispatches the page's action to that store, and the page shows
  loading states while the sagas fetch. Pagination ("Load More") only ever happens in the browser.

The sagas themselves (`app/sagas`) don't know which side they run on.

`END` is needed here because the page's work is started by an action and fans out through watchers, so there is
no single task to wait for. When a loader knows exactly which saga to run, it can run that saga directly with
`runSaga(...).toPromise()`: that saga completes on its own, without `END`.

The GitHub API allows 60 unauthenticated requests per hour per IP address, and each page load uses two or three.
