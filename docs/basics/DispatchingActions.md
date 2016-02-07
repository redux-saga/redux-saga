# Dispatching actions to the store

Taking the previous example, let's say after each save, we want to display some message in our
UI in order to inform the user the operation has completed. For simplicity, w'll omit the failure case

```javascript
import api from './path/to/api'
import { take, put } from 'redux-saga'

function* watchSave() {
  while(true) {
    const { data } = yield take('SAVE_DATA')
    const response = yield api.save(data)
    yield put({ type: 'SAVE_SUCCESS', response})
  }
}
```

In the above example, our `api.save(data)` call returns a Promise that will resolve with the
server response. Again, this a blocking call, because the Saga will be suspended until the Promise
is resolved (or rejected). After the Promise is resolved, the resolved value is assigned to the `response`
constant and the Saga resumes its flow.

Next, the Saga uses `yield put({ type: 'SAVE_SUCCESS', response})`. `put` is used to dispatch
actions to the store. In the above example, the Saga dispatches a `SAVE_SUCCESS` action.

After that, the Saga resumes again, which will cause it to perform another `yield take('SAVE_DATA')` and
wait again for another `SAVE_DATA` action.
