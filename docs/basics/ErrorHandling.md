# Error handling

Now let's see how to handle error cases. Let's suppose that our API function `api.save` returns a Promise
which get rejected when the remote save fails. We want to handle those errors inside our Saga by dispatching
a `SAVE_ERROR` action to the Store.

You can catch errors inside the Saga using the familiar `try/catch` syntax.

```javascript
import api from './path/to/api'
import { take, put } from 'redux-saga'

function* watchSave() {
  while(true) {
    const { data } = yield take('SAVE_DATA')
    try {
      const response = yield api.save(data)
      yield put({ type: 'SAVE_SUCCESS', response})
    } catch(error) {
      yield put({ type: 'SAVE_ERROR', error})
    }
  }
}
```

Of course you're not forced to handle your API errors inside `try`/`catch` blocks, you can also make
your API service return a normal value with some error flag on it. For example, you can catch Promise
rejections and map them to an object with an error field.

```javascript
import api from './path/to/api'
import { take, put } from 'redux-saga'

function saveData(data) {
  return api.save(data)
    .then(response => {response})
    .catch(error => {error})
}

function* watchSave() {
  while(true) {
    const { data } = yield take('SAVE_DATA')
    const { response, error } = yield saveData(data)

    if(response) {
      yield put({ type: 'SAVE_SUCCESS', response})
    } else {
      yield put({ type: 'SAVE_ERROR', error})
    }
  }
}
```
