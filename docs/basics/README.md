# Basic Concepts

In `redux-saga`, Sagas express their logic by yielding `Effect`s from Generator functions. An Effect
is simply a plain JavaScript object which some information to be interpreted by the
middleware. You can view Effects like instructions to the middleware to perform some operation
(invoke some asynchronous function, dispatch an action to the store).

In this section we will introduce some basic Effects. And see how the concept allows the Sagas to be easily
tested.

* [Declarative Effects](DeclarativeEffects.md)
* [Dispatching actions](DispatchingActions.md)
* [Error handling](ErrorHandling.md)
* [A common abstraction: Effect](Effect.md)
