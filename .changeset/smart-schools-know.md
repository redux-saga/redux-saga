---
'@redux-saga/delay-p': patch
---

Fixed an issue with arguments that exceed the maximum value for the internally-used `setTimeout`. Previously it could overflow based on the input that was too big and thus a timeout could resolve immediately.
