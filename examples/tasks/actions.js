export const SYNC_START = 'SYNC_START';
export const SYNC_STOP = 'SYNC_STOP';
export const SYNC_STOPPED = 'SYNC_STOPPED';
export const SYNC_ITEM = 'SYNC_ITEM';

export function startSyncing(itemId, interval = 5000) {
  return {
    type: SYNC_START,
    payload: { itemId, interval }
  };
}

export function stopSyncing() {
  return {
    type: SYNC_STOP
  };
}

export function syncItem(itemId) {
  return {
    type: SYNC_ITEM,
    payload: { itemId }
  }
}
