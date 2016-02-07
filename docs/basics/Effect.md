# A common abstraction: Effect

To generalize: waiting for a future action, waiting for the future result of a function call like
`yield api.save(data)`, or waiting for the result of a dispatch all are the same concept. In all cases,
we are yielding some form of Effects.

What a Saga does is actually compose all those effects together to implement the desired control flow.
The simplest is to sequence yielded Effects by just putting the yields one after another. You can also use the
familiar control flow operators (`if`, `while`, `for`) to implement more sophisticated control flows. Or
you can use the provided Effects combinators to express concurrency (`yield race`) and parallelism (yield [...]).
You can even yield calls to other Sagas, allowing the powerful routine/subroutine pattern.
