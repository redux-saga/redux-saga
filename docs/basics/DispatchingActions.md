# Dispatching actions to the store

After receiving the queried action, the Saga triggers a call to `delay(1000)`, which in our example
returns a Promise that will resolve after 1 second. This is a blocking call, so the Saga
will wait for 1 second before continuing on.

After the delay, the Saga dispatches an `INCREMENT_COUNTER` action using the `put(action)`
function. Here also, the Saga will wait for the dispatch result. If the dispatch call returns
a normal value, the Saga resumes *immediately* (ASAP), but if the result value is a Promise then the
Saga will wait until the Promise is resolved (or rejected).