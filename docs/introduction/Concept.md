Redux-saga is an alternative Side Effect model for Redux applications. Instead of dispatching thunks
which get handled by the redux-thunk middleware, you create *Sagas* to gather all your Side Effects logic in a central place.

This means the logic of the application lives in 2 places:

- Reducers are responsible for handling state transitions between actions

- Sagas are responsible for orchestrating complex/asynchronous operations.

Sagas are created using Generator functions.

> As you'll see in the rest of this documentation, Generators, while seemingly more low-level than ES7 async functions, allow some features like declarative effects and cancellation which are harder—if not impossible—to implement with simple async functions.


What this middleware proposes is:

- A composable abstraction **Effect**: waiting for an action, triggering state updates (by dispatching actions to the store), and calling a remote service are all different forms of Effects. A Saga composes those Effects using familiar control flow constructs (if, while, for, try/catch).

- The Saga is itself an Effect. It can be combined with other Effects using combinators.
It can also be called from inside other Sagas, providing the full power of Subroutines and
[Structured Programming](https://en.wikipedia.org/wiki/Structured_programming)

- Effects may be yielded declaratively. You yield a description of the Effect which will be
executed by the middleware. This makes your operational logic inside Generators fully testable.

- You can implement complex operations with logic that spans across multiple actions (e.g. User onboarding, wizard dialogs, complex Game rules, etc.), which are non-trivial to express using other effects middlewares.