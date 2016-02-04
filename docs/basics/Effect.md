# A common abstraction: Effect

To generalize: waiting for a future action, waiting for the future result of a function call like
`yield delay(1000)`, or waiting for the result of a dispatch all are the same concept. In all cases,
we are yielding some form of Effects.

What a Saga does is actually compose all those effects together to implement the desired control flow.
The simplest is to sequence yielded Effects by just putting the yields one after another. You can also use the
familiar control flow operators (`if`, `while`, `for`) to implement more sophisticated control flows. Or you
you can use the provided Effects combinators to express concurrency (yield race) and parallelism (yield [...]).
You can even yield calls to other Sagas, allowing the powerful routine/subroutine pattern.

For example, `incrementAsync` uses an infinite loop `while(true)` which means it will stay alive
for the entirety of the application's lifetime.

You can also create Sagas that last a limited amount of time. For example, the following Saga
waits for the first 3 `INCREMENT_COUNTER` actions, triggers a `showCongratulation()` action and then finishes.

```javascript
function* onBoarding() {

  for(let i = 0; i < 3; i++)
    yield take(INCREMENT_COUNTER)

  yield put( showCongratulation() )
}
```
