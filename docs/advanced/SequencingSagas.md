# Sequencing Sagas via `yield*`

You can use the builtin `yield*` operator to compose multiple Sagas in a sequential way.
This allows you to sequence your *macro-tasks* in a simple procedural style.

```javascript
function* playLevelOne(getState) { ... }

function* playLevelTwo(getState) { ... }

function* playLevelThree(getState) { ... }

function* game(getState) {

  const score1 = yield* playLevelOne(getState)
  put(showScore(score1))

  const score2 = yield* playLevelTwo(getState)
  put(showScore(score2))

  const score3 = yield* playLevelThree(getState)
  put(showScore(score3))

}
```

Note that using `yield*` will cause the JavaScript runtime to *spread* the whole sequence.
The resulting iterator (from `game()`) will yield all values from the nested
iterators. A more powerful alternative is to use the more generic middleware composition mechanism.
