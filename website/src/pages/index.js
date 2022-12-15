import React from 'react'

import Layout from '@theme/Layout'
import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import Header from '../components/Header'
import Feature from '../components/Feature'
import CodeSnippet from '../components/CodeSnippet'
import Supporters from '../components/Supporters'

import useDocusaurusContext from '@docusaurus/useDocusaurusContext'

import styles from './styles.module.css'

const features = [
  {
    title: 'Asynchronous',
    description: `
      ES6 generators make asynchronous flows easy to read, write, and test.
      Create complex side effects without getting bogged down by the details.
    `,
  },
  {
    title: 'Composition-focused',
    description: `
      Sagas enable numerous approaches to tackling parallel execution, task concurrency,
      task racing, task cancellation, and more. Keep total control over the flow of your code. 
    `,
  },
  {
    title: 'Easy To Test',
    description: `
      Assert results at each step of a generator or for a saga as a whole.
      Either way, side effect testing is quick, concise, and painless, as testing should be.
    `,
  },
]

const snippets = [
  {
    label: '1. Dispatch an action',
    details: (
      <>
        Suppose we have a UI to fetch some user data from a remote server when a button is clicked. (For brevity,
        we&apos;ll just show the action triggering code.)
      </>
    ),
    code: [
      'class UserComponent extends React.Component {',
      '  ...',
      '  onSomeButtonClicked() {',
      '    const { userId, dispatch } = this.props',
      "    dispatch({type: 'USER_FETCH_REQUESTED', payload: {userId}})",
      '  }',
      '  ...',
      '}',
    ].join('\n'),
  },
  {
    label: '2. Initiate a side effect',
    details: (
      <>
        The component dispatches a plain object action to the store. We&apos;ll create a Saga that watches for all{' '}
        <code>USER_FETCH_REQUESTED</code> actions and triggers an API call to fetch the user data.
      </>
    ),
    code: [
      "import { call, put, takeEvery, takeLatest } from 'redux-saga/effects'",
      "import Api from '...'\n",
      '// Worker saga will be fired on USER_FETCH_REQUESTED actions',
      'function* fetchUser(action) {',
      '   try {',
      '      const user = yield call(Api.fetchUser, action.payload.userId);',
      '      yield put({type: "USER_FETCH_SUCCEEDED", user: user});',
      '   } catch (e) {',
      '      yield put({type: "USER_FETCH_FAILED", message: e.message});',
      '   }',
      '}\n',
      '// Starts fetchUser on each dispatched USER_FETCH_REQUESTED action',
      '// Allows concurrent fetches of user',
      'function* mySaga() {',
      '  yield takeEvery("USER_FETCH_REQUESTED", fetchUser);',
      '}',
    ].join('\n'),
  },
  {
    label: '3. Connect to the store',
    details: (
      <>
        To run our Saga, we have to connect it to the Redux store using the <code>redux-saga</code> middleware.
      </>
    ),
    code: [
      "import { createStore, applyMiddleware } from 'redux'",
      "import createSagaMiddleware from 'redux-saga'\n",
      "import reducer from './reducers'",
      "import mySaga from './sagas'\n",
      '// Create the saga middleware',
      'const sagaMiddleware = createSagaMiddleware()',
      '// Mount it on the Store',
      'const store = createStore(',
      '  reducer,',
      '  applyMiddleware(sagaMiddleware)',
      ')\n',
      '// Then run the saga',
      'sagaMiddleware.run(mySaga)\n',
      '// Render the application',
    ].join('\n'),
  },
  {
    label: '4. Connect to the store (new version)',
    details: (
      <>
        This is the new version of running saga by using configureStore from <code>reduxjs/toolkit</code> instead of
        createStore from <code>Redux</code>.
      </>
    ),
    code: [
      "import { configureStore } from '@reduxjs/toolkit'",
      "import createSagaMiddleware from 'redux-saga'\n",
      "import reducer from './reducers'",
      "import mySaga from './sagas'\n",
      '// Create the saga middleware',
      'const sagaMiddleware = createSagaMiddleware()',
      'const middleware = [sagaMiddleware]',
      '// Mount it on the Store',
      'const store = configureStore({',
      '  reducer,',
      '  middleware: (getDefaultMiddleware) =>',
      '      getDefaultMiddleware().concat(middleware),',
      '})\n',
      '// Then run the saga',
      'sagaMiddleware.run(mySaga)\n',
      '// Render the application',
    ].join('\n'),
  },
]

function Home() {
  const context = useDocusaurusContext()
  const { siteConfig = {} } = context

  return (
    <Layout
      title={`${siteConfig.title} - ${siteConfig.tagline}`}
      description="An open source Redux middleware library for efficiently handling asynchronous side effects"
    >
      <Header />
      <main>
        <section className={'feature ' + styles.features}>
          <div className="container">
            <div className="row">
              {features.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
        <section className="feature">
          <div className="container">
            <h1>Example Usage</h1>
            <Tabs
              defaultValue={snippets[0].label}
              values={snippets.map((snippet) => ({
                label: snippet.label,
                value: snippet.label,
              }))}
            >
              {snippets.map((snippet, i) => (
                <TabItem key={i} value={snippet.label}>
                  <p>{snippet.details}</p>
                  <CodeSnippet code={snippet.code} />
                </TabItem>
              ))}
            </Tabs>
          </div>
        </section>
        <section className="feature">
          <div className="container container--l">
            <div className="row">
              <div className="col col--6">
                <h1>Backers</h1>
                <p>
                  Support us with a monthly donation and help us continue our activities.{' '}
                  <a href="https://opencollective.com/redux-saga#backer">Become a backer</a>
                </p>
                <Supporters type="backer" />
              </div>
              <div className="col col--6">
                <h1>Sponsors</h1>
                <p>
                  Become a sponsor and have your logo shown below and on Github with a link to your site.{' '}
                  <a href="https://opencollective.com/redux-saga#sponsor">Become a sponsor</a>
                </p>
                <Supporters type="sponsor" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}

export default Home
