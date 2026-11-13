# Error demo

Shows the saga stacks redux-saga prints when an error bubbles up to the root saga. File names and
line numbers in those stacks come from [`@redux-saga/unplugin`](../../packages/unplugin), set up in
[`vite.config.js`](vite.config.js).

# Run locally

```sh
pnpm start
```

Then open the URL Vite prints, click a button and look at the console.

The tests in [`test/sagas.js`](test/sagas.js) check the same stacks; run them from the repository
root with `pnpm test`.
