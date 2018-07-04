# Using Channels

Until now we've used the `take` and `put` effects to communicate with the Redux Store. Channels generalize those Effects to communicate with external event sources or between Sagas themselves. They can also be used to queue specific actions from the Store.

In this section, we'll see:

- How to use the `yield actionChannel` Effect to buffer specific actions from the Store.

- How to use the `eventChannel` factory function to connect `take` Effects to external event sources.

- How to create a channel using the generic `channel` factory function and use it in `take`/`put` Effects to communicate between two Sagas.

## Using the `actionChannel` Effect

Let's review the canonical example:

```javascript
import { take, fork, ... } from 'redux-saga/effects'

function* watchRequests() {
  while (true) {
    const {payload} = yield take('REQUEST')
    yield fork(handleRequest, payload)
  }
}

function* handleRequest(payload) { ... }
```

The above example illustrates the typical *watch-and-fork* pattern. The `watchRequests` saga is using `fork` to avoid blocking and thus not missing any action from the store. A `handleRequest` task is created on each `REQUEST` action. So if there are many actions fired at a rapid rate there can be many `handleRequest` tasks executing concurrently.

Imagine now that our requirement is as follows: we want to process `REQUEST` serially. If we have at any moment four actions, we want to handle the first `REQUEST` action, then only after finishing this action we process the second action and so on...

So we want to *queue* all non-processed actions, and once we're done with processing the current request, we get the next message from the queue.

Redux-Saga provides a little helper Effect `actionChannel`, which can handle this for us. Let's see how we can rewrite the previous example with it:

```javascript
import { take, actionChannel, call, ... } from 'redux-saga/effects'

function* watchRequests() {
  // 1- Create a channel for request actions
  const requestChan = yield actionChannel('REQUEST')
  while (true) {
    // 2- take from the channel
    const {payload} = yield take(requestChan)
    // 3- Note that we're using a blocking call
    yield call(handleRequest, payload)
  }
}

function* handleRequest(payload) { ... }
```

The first thing is to create the action channel. We use `yield actionChannel(pattern)` where pattern is interpreted using the same rules we mentioned previously with `take(pattern)`. The difference between the 2 forms is that `actionChannel` **can buffer incoming messages** if the Saga is not yet ready to take them (e.g. blocked on an API call).

Next is the `yield take(requestChan)`. Besides usage with a `pattern` to take specific actions from the Redux Store, `take` can also be used with channels (above we created a channel object from specific Redux actions). The `take` will block the Saga until a message is available on the channel. The take may also resume immediately if there is a message stored in the underlying buffer.

The important thing to note is how we're using a blocking `call`. The Saga will remain blocked until `call(handleRequest)` returns. But meanwhile, if other `REQUEST` actions are dispatched while the Saga is still blocked, they will queued internally by `requestChan`. When the Saga resumes from `call(handleRequest)` and executes the next `yield take(requestChan)`, the take will resolve with the queued message.

By default, `actionChannel` buffers all incoming messages without limit. If you want a more control over the buffering, you can supply a Buffer argument to the effect creator. Redux-Saga provides some common buffers (none, dropping, sliding) but you can also supply your own buffer implementation. [See API docs](../api#buffers) for more details.

For example if you want to handle only the most recent five items you can use:

```javascript
import { buffers } from 'redux-saga'
import { actionChannel } from 'redux-saga/effects'

function* watchRequests() {
  const requestChan = yield actionChannel('REQUEST', buffers.sliding(5))
  ...
}
```

## Using the `eventChannel` factory to connect to external events

Like `actionChannel` (Effect), `eventChannel` (a factory function, not an Effect) creates a Channel for events but from event sources other than the Redux Store.

This basic example creates a Channel from an interval:

```javascript
import { eventChannel, END } from 'redux-saga'

function countdown(secs) {
  return eventChannel(emitter => {
      const iv = setInterval(() => {
        secs -= 1
        if (secs > 0) {
          emitter(secs)
        } else {
          // this causes the channel to close
          emitter(END)
        }
      }, 1000);
      // The subscriber must return an unsubscribe function
      return () => {
        clearInterval(iv)
      }
    }
  )
}
```

The first argument in `eventChannel` is a *subscriber* function. The role of the subscriber is to initialize the external event source (above using `setInterval`), then routes all incoming events from the source to the channel by invoking the supplied `emitter`. In the above example we're invoking `emitter` on each second.

> Note: You need to sanitize your event sources as to not pass null or undefined through the event channel. While it's fine to pass numbers through, we'd recommend structuring your event channel data like your redux actions. `{ number }` over `number`.

Note also the invocation `emitter(END)`. We use this to notify any channel consumer that the channel has been closed, meaning no other messages will come through this channel.

Let's see how we can use this channel from our Saga. (This is taken from the cancellable-counter example in the repo.)

```javascript
import { take, put, call } from 'redux-saga/effects'
import { eventChannel, END } from 'redux-saga'

// creates an event Channel from an interval of seconds
function countdown(seconds) { ... }

export function* saga() {
  const chan = yield call(countdown, value)
  try {    
    while (true) {
      // take(END) will cause the saga to terminate by jumping to the finally block
      let seconds = yield take(chan)
      console.log(`countdown: ${seconds}`)
    }
  } finally {
    console.log('countdown terminated')
  }
}
```

So the Saga is yielding a `take(chan)`. This causes the Saga to block until a message is put on the channel. In our example above, it corresponds to when we invoke `emitter(secs)`. Note also we're executing the whole `while (true) {...}` loop inside a `try/finally` block. When the interval terminates, the countdown function closes the event channel by invoking `emitter(END)`. Closing a channel has the effect of terminating all Sagas blocked on a `take` from that channel. In our example, terminating the Saga will cause it to jump to its `finally` block (if provided, otherwise the Saga terminates).

The subscriber returns an `unsubscribe` function. This is used by the channel to unsubscribe before the event source complete. Inside a Saga consuming messages from an event channel, if we want to *exit early* before the event source complete (e.g. Saga has been cancelled) you can call `chan.close()` to close the channel and unsubscribe from the source.

For example, we can make our Saga support cancellation:

```javascript
import { take, put, call, cancelled } from 'redux-saga/effects'
import { eventChannel, END } from 'redux-saga'

// creates an event Channel from an interval of seconds
function countdown(seconds) { ... }

export function* saga() {
  const chan = yield call(countdown, value)
  try {    
    while (true) {
      let seconds = yield take(chan)
      console.log(`countdown: ${seconds}`)
    }
  } finally {
    if (yield cancelled()) {
      chan.close()
      console.log('countdown cancelled')
    }    
  }
}
```

Here is another example of how you can use event channels to pass WebSocket events into your saga (e.g.: using socket.io library).
Suppose you are waiting for a server message `ping` then reply with a `pong` message after some delay.


```javascript
import { take, put, call, apply, delay } from 'redux-saga/effects'
import { eventChannel } from 'redux-saga'
import { createWebSocketConnection } from './socketConnection'

// this function creates an event channel from a given socket
// Setup subscription to incoming `ping` events
function createSocketChannel(socket) {
  // `eventChannel` takes a subscriber function
  // the subscriber function takes an `emit` argument to put messages onto the channel
  return eventChannel(emit => {

    const pingHandler = (event) => {
      // puts event payload into the channel
      // this allows a Saga to take this payload from the returned channel
      emit(event.payload)
    }
    
    const errorHandler = (errorEvent) => {
      // create an Error object and put it into the channel
      emit(new Error(errorEvent.reason))
    }
    
    // setup the subscription
    socket.on('ping', pingHandler)
    socket.on('error', errorHandler)

    // the subscriber must return an unsubscribe function
    // this will be invoked when the saga calls `channel.close` method
    const unsubscribe = () => {
      socket.off('ping', pingHandler)
    }

    return unsubscribe
  })
}

// reply with a `pong` message by invoking `socket.emit('pong')`
function* pong(socket) {
  yield delay(5000)
  yield apply(socket, socket.emit, ['pong']) // call `emit` as a method with `socket` as context
}

export function* watchOnPings() {
  const socket = yield call(createWebSocketConnection)
  const socketChannel = yield call(createSocketChannel, socket)

  while (true) {
    try {
      // An error from socketChannel will cause the saga jump to the catch block
      const payload = yield take(socketChannel)
      yield put({ type: INCOMING_PONG_PAYLOAD, payload })
      yield fork(pong, socket)
    } catch(err) {
      console.error('socket error:', err)
      // socketChannel is still open in catch block
      // if we want end the socketChannel, we need close it explicitly
      // socketChannel.close()
    }
  }
}
```

> Note: messages on an eventChannel are not buffered by default. You have to provide a buffer to the eventChannel factory in order to specify buffering strategy for the channel (e.g. `eventChannel(subscriber, buffer)`).
[See the API docs](../api#buffers) for more info.

In this WebSocket example, the socketChannel may emit an error when some socket error occurs, this will abort our `yield take(socketChannel)` waiting on this eventChannel. Note that emitting an error will not abort the channel by default, we need to close the channel explicitly if we want to end the channel after an error.

### Using channels to communicate between Sagas

Besides action channels and event channels. You can also directly create channels which are not connected to any source by default. You can then manually `put` on the channel. This is handy when you want to use a channel to communicate between sagas.

To illustrate, let's review the former example of request handling.

```javascript
import { take, fork, ... } from 'redux-saga/effects'

function* watchRequests() {
  while (true) {
    const {payload} = yield take('REQUEST')
    yield fork(handleRequest, payload)
  }
}

function* handleRequest(payload) { ... }
```

We saw that the watch-and-fork pattern allows handling multiple requests simultaneously, without limit on the number of worker tasks executing concurrently. Then, we used the `actionChannel` effect to limit the concurrency to one task at a time.

So let's say that our requirement is to have a maximum of three tasks executing at the same time. When we get a request and there are less than three tasks executing, we process the request immediately, otherwise we queue the task and wait for one of the three *slots* to become free.

Below is an example of a solution using channels:

```javascript
import { channel } from 'redux-saga'
import { take, fork, ... } from 'redux-saga/effects'

function* watchRequests() {
  // create a channel to queue incoming requests
  const chan = yield call(channel)

  // create 3 worker 'threads'
  for (var i = 0; i < 3; i++) {
    yield fork(handleRequest, chan)
  }

  while (true) {
    const {payload} = yield take('REQUEST')
    yield put(chan, payload)
  }
}

function* handleRequest(chan) {
  while (true) {
    const payload = yield take(chan)
    // process the request
  }
}
```

In the above example, we create a channel using the `channel` factory. We get back a channel which by default buffers all messages we put on it (unless there is a pending taker, in which the taker is resumed immediately with the message).

The `watchRequests` saga then forks three worker sagas. Note the created channel is supplied to all forked sagas. `watchRequests` will use this channel to *dispatch* work to the three worker sagas. On each `REQUEST` action the Saga will put the payload on the channel. The payload will then be taken by any *free* worker. Otherwise it will be queued by the channel until a worker Saga is ready to take it.

All the three workers run a typical while loop. On each iteration, a worker will take the next request, or will block until a message is available. Note that this mechanism provides an automatic load-balancing between the 3 workers. Rapid workers are not slowed down by slow workers.
