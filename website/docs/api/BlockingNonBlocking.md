---
id: blocking-nonblocking
title: Blocking / Non-blocking
hide_title: true
---

# Blocking / Non-blocking

| Name                 | Blocking                                                    |
| -------------------- | ------------------------------------------------------------|
| takeEvery            | No                                                          |
| takeLatest           | No                                                          |
| takeLeading          | No                                                          |
| throttle             | No                                                          |
| debounce             | No                                                          |
| retry                | Yes                                                         |
| take                 | Yes                                                         |
| take(channel)        | Sometimes (see API reference)                               |
| takeMaybe            | Yes                                                         |
| put                  | No                                                          |
| putResolve           | Yes                                                         |
| put(channel, action) | No                                                          |
| call                 | Yes                                                         |
| apply                | Yes                                                         |
| cps                  | Yes                                                         |
| fork                 | No                                                          |
| spawn                | No                                                          |
| join                 | Yes                                                         |
| cancel               | No                                                          |
| select               | No                                                          |
| actionChannel        | No                                                          |
| flush                | Yes                                                         |
| cancelled            | Yes                                                         |
| race                 | Yes                                                         |
| delay                | Yes                                                         |
| all                  | Blocks if there is a blocking effect in the array or object |