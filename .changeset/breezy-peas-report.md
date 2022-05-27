---
"@redux-saga/core": patch
---

Add a type `EventChannelReturnType` that can be used to infer the return type of an EventChannel:

```
const result: EventChannelReturnType<typeof AnEventChannel> = yield take(AnEventChannel);
```
