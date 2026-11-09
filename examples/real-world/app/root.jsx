import { useState } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useMatches,
  useNavigate,
} from 'react-router'
import { resetErrorMessage } from './actions'
import Explore from './components/Explore'
import { createAppStore } from './store'
import { getBrowserStore } from './store.client'

export const meta = () => [{ title: 'redux-saga real-world example' }]

export const links = () => [{ rel: 'icon', href: '/favicon.ico' }]

export function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

// A page's server loader returns the state its sagas preloaded (see `preload.server.js`).
// The server renders the page from it, and the browser store starts from it.
function useAppStore() {
  const matches = useMatches()
  const [store] = useState(() => {
    const preloadedState = matches.find((match) => match.loaderData?.preloadedState)?.loaderData.preloadedState
    return import.meta.env.SSR ? createAppStore({ preloadedState }).store : getBrowserStore(preloadedState)
  })
  return store
}

export default function Root() {
  return (
    <Provider store={useAppStore()}>
      <App />
    </Provider>
  )
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div>
      <Explore value={location.pathname.substring(1)} onChange={(nextValue) => navigate(`/${nextValue}`)} />
      <hr />
      <ErrorMessage />
      <Outlet />
    </div>
  )
}

function ErrorMessage() {
  const errorMessage = useSelector((state) => state.errorMessage)
  const dispatch = useDispatch()

  if (!errorMessage) {
    return null
  }

  return (
    <p style={{ backgroundColor: '#e99', padding: 10 }}>
      <b>{errorMessage}</b> (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          dispatch(resetErrorMessage())
        }}
      >
        Dismiss
      </a>
      )
    </p>
  )
}

export function ErrorBoundary({ error }) {
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error.message
  return (
    <main>
      <h1>Oops!</h1>
      <p>{message}</p>
    </main>
  )
}
