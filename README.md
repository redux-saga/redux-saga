# redux-saga
Exploration of an alternative side effect model for Redux applications

Instead of dispatching thunks which get handled by the redux-thunk middleware. You create *sagas*
(not even sure if the term applies correctly); On every action, the saga is invoked and can
optionnally return *side effects* : which are data objects that describe the desired side effect.
The saga middleware then invokes the appropriate *service* (located via the `type` attribute of the effect).

Motivations

- No application logic inside action creators. All action creators are pure factories of applications
- All the actions hit the reducers; even "asyncchronous" ones
- Sagas don't execute side effects directly, they *create* a description of the intended the side effect
which get then routed to the appropriate service; This keeps the effect creation code pure and testable

In the 2 examples you'll find that all actions, included async ones, are logged into the console; For example
in the counter example the `INCREMENT_IF_ODD` and `INCREMENT_ASYNC` actions are "raw actions" and gets logged; while
in the original Redux examples (thunk based), there don't exist; 

This is mostly a Proof Of Concept; for more infos see [this discussion](https://github.com/paldepind/functional-frontend-architecture/issues/20#issuecomment-160344891)

# setup

`npm install`

There are 2 examples ported from the Redux repos : the redux-thunk middleware is replaced by
The redux-saga middleware

Counter example
`npm run build-counter`

Shopping Cart example
`npm run build-shop`
