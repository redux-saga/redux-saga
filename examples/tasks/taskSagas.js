/* eslint-disable no-constant-condition */
import { take, put, call, fork, cancel, SagaCancellationException } from '../../src';
import { SYNC_START, SYNC_STOP, SYNC_STOPPED, syncItem } from './actions';

const delay = (millis) => new Promise(resolve => setTimeout(() => resolve(true), millis) );

export function* itemSyncTask(itemId, interval) {
  try {
    while (true) {
      yield put(syncItem(itemId));
      yield call(delay, interval);
    }
  } catch (error) {
    if (error instanceof SagaCancellationException) {
      yield put({ type: SYNC_STOPPED, payload: { itemId } });
    } else {
      yield put({ type: SYNC_STOPPED, payload: { itemId, error }, error: true });
    }
  }
}

export function* syncSaga() {
  // Wait for the first sync start and then run the task in the background
  let lastStartSync = yield take(SYNC_START);
  let bgSyncTask = yield fork(itemSyncTask, lastStartSync.payload.itemId, lastStartSync.payload.interval);

  // checks if the action is a stop or a start for a different itemId
  const checkNewAction = action => {
    if (action.type === SYNC_STOP) {
      return true;
    } else if (action.type === SYNC_START &&
               action.payload.itemId !== lastStartSync.payload.itemId) {
      return true;
    } else {
      return false;
    }
  };

  while (true) {
    // wait for the user stop action or start a different sync
    const nextAction = yield take(checkNewAction);

    // this will throw a SagaCancellationException into task
    yield cancel(bgSyncTask);

    // if new start then use that for the next sync job
    if (nextAction.type === SYNC_START) {
      lastStartSync = nextAction;
    // otherwise wait for the next start
    } else {
      lastStartSync = yield take(SYNC_START);
    }
    // starts the new task in the background
    bgSyncTask = yield fork(itemSyncTask, lastStartSync.payload.itemId, lastStartSync.payload.interval);
  }
}
