import test from 'tape';
import { take, fork, runSaga, storeIO, cancel } from '../../../src';
import { createStore, applyMiddleware, compose } from 'redux';

import { SYNC_START, SYNC_STOPPED, startSyncing, stopSyncing, syncItem } from '../actions.js';
import { itemSyncTask, syncSaga } from '../taskSagas';

// Describe the behavior of the saga, dont run it
test('behavior spec', t => {
  t.plan(2)
  const generator = syncSaga()

  let next = generator.next()

  t.deepEqual(next.value, take(SYNC_START),
    'Waits for start'
  )

  next = generator.next(startSyncing('1'))
  t.deepEqual(next.value, fork(itemSyncTask, '1', 5000),
    'Starts the task sync for an item'
  )

  next = generator.next();
  // *** How can I verify this? ***
  // console.log(next)
  // { value: { TAKE: [Function: checkNewAction] }, done: false }

  // *** This fails because of the cancel ***
  // next = generator.next();
  t.end()
});


// Lets run it since we missed some of the functinality in the behavior test

// But we can't stop the infite waiting in runSaga, lets wrap it!
const CANCEL_SAGA = 'CANCEL_SAGA'

// Wraps a saga so that it might be cancelled
function* cancellableSaga(saga) {
  const task = yield fork(saga);
  yield take(CANCEL_SAGA);
  yield cancel(task);
}

// Some test helpers
const delay = (ms) => () => new Promise(resolve => setTimeout(resolve, ms));

// Collects all the actions that were dispatched and puts them into the resultActions array
const collectMid = resultActions => () => {
  return next => action => {
    resultActions.push(action);
    next(action);
  };
};

const createStoreWithMiddleware = resultActions => compose(
      applyMiddleware(collectMid(resultActions))
  )(createStore);

test('fully running', t => {
  t.plan(1)
  const results = [];
  const store = createStoreWithMiddleware(results)(() => {});


  setTimeout(() => {
    Promise.resolve(1)
    .then(() => store.dispatch(stopSyncing())) // ignores extra stop
    .then(delay(4))
    .then(() => store.dispatch(startSyncing('1', 2))) // should poll twice
    .then(delay(6))
    .then(() => store.dispatch(startSyncing('2'))) // switch with a new start
    .then(delay(4))
    .then(() => store.dispatch(stopSyncing())) // can be stopped
    .then(delay(4))
    .then(() => store.dispatch(startSyncing('3'))) // can be restarted
    .then(delay(4))
    .then(() => store.dispatch({ type: CANCEL_SAGA }));
  }, 10);

  const task = runSaga(cancellableSaga(syncSaga), storeIO(store));

  const expectedResults = [
    stopSyncing(),
    startSyncing('1', 2),
    syncItem('1'),
    syncItem('1'),
    startSyncing('2'),
    { type: SYNC_STOPPED, payload: { itemId: '1' } },
    syncItem('2'),
    stopSyncing(),
    { type: SYNC_STOPPED, payload: { itemId: '2' } },
    startSyncing('3'),
    syncItem('3'),
    { type: CANCEL_SAGA }
  ];

  task.done.then(() => {
    t.deepEqual(results, expectedResults)
  })

  task.done.catch(err => t.fail(err))

});
