"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[450],{3905:function(e,t,n){n.d(t,{Zo:function(){return c},kt:function(){return h}});var a=n(7294);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function r(e,t){if(null==e)return{};var n,a,i=function(e,t){if(null==e)return{};var n,a,i={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var p=a.createContext({}),s=function(e){var t=a.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},c=function(e){var t=s(e.components);return a.createElement(p.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},d=a.forwardRef((function(e,t){var n=e.components,i=e.mdxType,o=e.originalType,p=e.parentName,c=r(e,["components","mdxType","originalType","parentName"]),d=s(n),h=i,k=d["".concat(p,".").concat(h)]||d[h]||u[h]||o;return n?a.createElement(k,l(l({ref:t},c),{},{components:n})):a.createElement(k,l({ref:t},c))}));function h(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var o=n.length,l=new Array(o);l[0]=d;var r={};for(var p in t)hasOwnProperty.call(t,p)&&(r[p]=t[p]);r.originalType=e,r.mdxType="string"==typeof e?e:i,l[1]=r;for(var s=2;s<o;s++)l[s]=n[s];return a.createElement.apply(null,l)}return a.createElement.apply(null,n)}d.displayName="MDXCreateElement"},6814:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return r},contentTitle:function(){return p},metadata:function(){return s},toc:function(){return c},default:function(){return d}});var a=n(7462),i=n(3366),o=(n(7294),n(3905)),l=["components"],r={title:"Non-Blocking Calls",hide_title:!0},p="Non-blocking calls",s={unversionedId:"advanced/NonBlockingCalls",id:"advanced/NonBlockingCalls",isDocsHomePage:!1,title:"Non-Blocking Calls",description:"In the previous section, we saw how the take Effect allows us to better describe a non-trivial flow in a central place.",source:"@site/../docs/advanced/NonBlockingCalls.md",sourceDirName:"advanced",slug:"/advanced/NonBlockingCalls",permalink:"/docs/advanced/NonBlockingCalls",editUrl:"https://github.com/redux-saga/redux-saga/edit/main/docs/../docs/advanced/NonBlockingCalls.md",tags:[],version:"current",frontMatter:{title:"Non-Blocking Calls",hide_title:!0},sidebar:"docs",previous:{title:"Future Actions",permalink:"/docs/advanced/FutureActions"},next:{title:"Racing Effects",permalink:"/docs/advanced/RacingEffects"}},c=[{value:"First try",id:"first-try",children:[],level:3},{value:"But there is still a subtle issue with the above approach",id:"but-there-is-still-a-subtle-issue-with-the-above-approach",children:[],level:3}],u={toc:c};function d(e){var t=e.components,n=(0,i.Z)(e,l);return(0,o.kt)("wrapper",(0,a.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"non-blocking-calls"},"Non-blocking calls"),(0,o.kt)("p",null,"In the previous section, we saw how the ",(0,o.kt)("inlineCode",{parentName:"p"},"take")," Effect allows us to better describe a non-trivial flow in a central place."),(0,o.kt)("p",null,"Revisiting the login flow example:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-javascript"},"function* loginFlow() {\n  while (true) {\n    yield take('LOGIN')\n    // ... perform the login logic\n    yield take('LOGOUT')\n    // ... perform the logout logic\n  }\n}\n")),(0,o.kt)("p",null,"Let's complete the example and implement the actual login/logout logic. Suppose we have an API which permits us to authorize the user on a remote server. If the authorization is successful, the server will return an authorization token which will be stored by our application using DOM storage (assume our API provides another service for DOM storage)."),(0,o.kt)("p",null,"When the user logs out, we'll delete the authorization token stored previously."),(0,o.kt)("h3",{id:"first-try"},"First try"),(0,o.kt)("p",null,"So far we have all Effects needed to implement the above flow. We can wait for specific actions in the store using the ",(0,o.kt)("inlineCode",{parentName:"p"},"take")," Effect. We can make asynchronous calls using the ",(0,o.kt)("inlineCode",{parentName:"p"},"call")," Effect. Finally, we can dispatch actions to the store using the ",(0,o.kt)("inlineCode",{parentName:"p"},"put")," Effect."),(0,o.kt)("p",null,"Let's give it a try:"),(0,o.kt)("blockquote",null,(0,o.kt)("p",{parentName:"blockquote"},"Note: the code below has a subtle issue. Make sure to read the section until the end.")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-javascript"},"import { take, call, put } from 'redux-saga/effects'\nimport Api from '...'\n\nfunction* authorize(user, password) {\n  try {\n    const token = yield call(Api.authorize, user, password)\n    yield put({type: 'LOGIN_SUCCESS', token})\n    return token\n  } catch(error) {\n    yield put({type: 'LOGIN_ERROR', error})\n  }\n}\n\nfunction* loginFlow() {\n  while (true) {\n    const {user, password} = yield take('LOGIN_REQUEST')\n    const token = yield call(authorize, user, password)\n    if (token) {\n      yield call(Api.storeItem, {token})\n      yield take('LOGOUT')\n      yield call(Api.clearItem, 'token')\n    }\n  }\n}\n")),(0,o.kt)("p",null,"First, we created a separate Generator ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," which will perform the actual API call and notify the Store upon success."),(0,o.kt)("p",null,"The ",(0,o.kt)("inlineCode",{parentName:"p"},"loginFlow")," implements its entire flow inside a ",(0,o.kt)("inlineCode",{parentName:"p"},"while (true)")," loop, which means once we reach the last step in the flow (",(0,o.kt)("inlineCode",{parentName:"p"},"LOGOUT"),") we start a new iteration by waiting for a new ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGIN_REQUEST")," action."),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"loginFlow")," first waits for a ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGIN_REQUEST")," action. Then, it retrieves the credentials in the action payload (",(0,o.kt)("inlineCode",{parentName:"p"},"user")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"password"),") and makes a ",(0,o.kt)("inlineCode",{parentName:"p"},"call")," to the ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," task."),(0,o.kt)("p",null,"As you noted, ",(0,o.kt)("inlineCode",{parentName:"p"},"call")," isn't only for invoking functions returning Promises. We can also use it to invoke other Generator functions. In the above example, ",(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"loginFlow")," will wait for authorize until it terminates and returns")," (i.e. after performing the api call, dispatching the action and then returning the token to ",(0,o.kt)("inlineCode",{parentName:"p"},"loginFlow"),")."),(0,o.kt)("p",null,"If the API call succeeds, ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," will dispatch a ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGIN_SUCCESS")," action then return the fetched token. If it results in an error, it'll dispatch a ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGIN_ERROR")," action."),(0,o.kt)("p",null,"If the call to ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," is successful, ",(0,o.kt)("inlineCode",{parentName:"p"},"loginFlow")," will store the returned token in the DOM storage and wait for a ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGOUT")," action. When the user logs out, we remove the stored token and wait for a new user login."),(0,o.kt)("p",null,"If the ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," failed, it'll return ",(0,o.kt)("inlineCode",{parentName:"p"},"undefined"),", which will cause ",(0,o.kt)("inlineCode",{parentName:"p"},"loginFlow")," to skip the previous process and wait for a new ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGIN_REQUEST")," action."),(0,o.kt)("p",null,"Observe how the entire logic is stored in one place. A new developer reading our code doesn't have to travel between various places to understand the control flow. It's like reading a synchronous algorithm: steps are laid out in their natural order. And we have functions which call other functions and wait for their results."),(0,o.kt)("h3",{id:"but-there-is-still-a-subtle-issue-with-the-above-approach"},"But there is still a subtle issue with the above approach"),(0,o.kt)("p",null,"Suppose that when the ",(0,o.kt)("inlineCode",{parentName:"p"},"loginFlow")," is waiting for the following call to resolve:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-javascript"},"function* loginFlow() {\n  while (true) {\n    // ...\n    try {\n      const token = yield call(authorize, user, password)\n      // ...\n    }\n    // ...\n  }\n}\n")),(0,o.kt)("p",null,"The user clicks on the ",(0,o.kt)("inlineCode",{parentName:"p"},"Logout")," button causing a ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGOUT")," action to be dispatched."),(0,o.kt)("p",null,"The following example illustrates the hypothetical sequence of the events:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"UI                              loginFlow\n--------------------------------------------------------\nLOGIN_REQUEST...................call authorize.......... waiting to resolve\n........................................................\n........................................................\nLOGOUT.................................................. missed!\n........................................................\n................................authorize returned...... dispatch a `LOGIN_SUCCESS`!!\n........................................................\n")),(0,o.kt)("p",null,"When ",(0,o.kt)("inlineCode",{parentName:"p"},"loginFlow")," is blocked on the ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," call, an eventual ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGOUT")," occurring in between the call and the response will be missed, because ",(0,o.kt)("inlineCode",{parentName:"p"},"loginFlow")," hasn't yet performed the ",(0,o.kt)("inlineCode",{parentName:"p"},"yield take('LOGOUT')"),"."),(0,o.kt)("p",null,"The problem with the above code is that ",(0,o.kt)("inlineCode",{parentName:"p"},"call")," is a blocking Effect. i.e. the Generator can't perform/handle anything else until the call terminates. But in our case we do not only want ",(0,o.kt)("inlineCode",{parentName:"p"},"loginFlow")," to execute the authorization call, but also watch for an eventual ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGOUT")," action that may occur in the middle of this call. That's because ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGOUT")," is ",(0,o.kt)("em",{parentName:"p"},"concurrent")," to the ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," call."),(0,o.kt)("p",null,"So what's needed is some way to start ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," without blocking so ",(0,o.kt)("inlineCode",{parentName:"p"},"loginFlow")," can continue and watch for an eventual/concurrent ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGOUT")," action."),(0,o.kt)("p",null,"To express non-blocking calls, the library provides another Effect: ",(0,o.kt)("a",{parentName:"p",href:"https://redux-saga.js.org/docs/api/index.html#forkfn-args"},(0,o.kt)("inlineCode",{parentName:"a"},"fork")),". When we fork a ",(0,o.kt)("em",{parentName:"p"},"task"),", the task is started in the background and the caller can continue its flow without waiting for the forked task to terminate."),(0,o.kt)("p",null,"So in order for ",(0,o.kt)("inlineCode",{parentName:"p"},"loginFlow")," to not miss a concurrent ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGOUT"),", we must not ",(0,o.kt)("inlineCode",{parentName:"p"},"call")," the ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," task, instead we have to ",(0,o.kt)("inlineCode",{parentName:"p"},"fork")," it."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-javascript"},"import { fork, call, take, put } from 'redux-saga/effects'\n\nfunction* loginFlow() {\n  while (true) {\n    ...\n    try {\n      // non-blocking call, what's the returned value here ?\n      const ?? = yield fork(authorize, user, password)\n      ...\n    }\n    ...\n  }\n}\n")),(0,o.kt)("p",null,"The issue now is since our ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," action is started in the background, we can't get the ",(0,o.kt)("inlineCode",{parentName:"p"},"token")," result (because we'd have to wait for it). So we need to move the token storage operation into the ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," task."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-javascript"},"import { fork, call, take, put } from 'redux-saga/effects'\nimport Api from '...'\n\nfunction* authorize(user, password) {\n  try {\n    const token = yield call(Api.authorize, user, password)\n    yield put({type: 'LOGIN_SUCCESS', token})\n    yield call(Api.storeItem, {token})\n  } catch(error) {\n    yield put({type: 'LOGIN_ERROR', error})\n  }\n}\n\nfunction* loginFlow() {\n  while (true) {\n    const {user, password} = yield take('LOGIN_REQUEST')\n    yield fork(authorize, user, password)\n    yield take(['LOGOUT', 'LOGIN_ERROR'])\n    yield call(Api.clearItem, 'token')\n  }\n}\n")),(0,o.kt)("p",null,"We're also doing ",(0,o.kt)("inlineCode",{parentName:"p"},"yield take(['LOGOUT', 'LOGIN_ERROR'])"),". It means we are watching for 2 concurrent actions:"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("p",{parentName:"li"},"If the ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," task succeeds before the user logs out, it'll dispatch a ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGIN_SUCCESS")," action, then terminate. Our ",(0,o.kt)("inlineCode",{parentName:"p"},"loginFlow")," saga will then wait only for a future ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGOUT")," action (because ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGIN_ERROR")," will never happen).")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("p",{parentName:"li"},"If the ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," fails before the user logs out, it will dispatch a ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGIN_ERROR")," action, then terminate. So ",(0,o.kt)("inlineCode",{parentName:"p"},"loginFlow")," will take the ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGIN_ERROR")," before the ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGOUT")," then it will enter in a another ",(0,o.kt)("inlineCode",{parentName:"p"},"while")," iteration and will wait for the next ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGIN_REQUEST")," action.")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("p",{parentName:"li"},"If the user logs out before the ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," terminates, then ",(0,o.kt)("inlineCode",{parentName:"p"},"loginFlow")," will take a ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGOUT")," action and also wait for the next ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGIN_REQUEST"),"."))),(0,o.kt)("p",null,"Note the call for ",(0,o.kt)("inlineCode",{parentName:"p"},"Api.clearItem")," is supposed to be idempotent. It'll have no effect if no token was stored by the ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," call. ",(0,o.kt)("inlineCode",{parentName:"p"},"loginFlow")," makes sure no token will be in the storage before waiting for the next login."),(0,o.kt)("p",null,"But we're not yet done. If we take a ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGOUT")," in the middle of an API call, we have to ",(0,o.kt)("strong",{parentName:"p"},"cancel")," the ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," process, otherwise we'll have 2 concurrent tasks evolving in parallel: The ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," task will continue running and upon a successful (resp. failed) result, will dispatch a ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGIN_SUCCESS")," (resp. a ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGIN_ERROR"),") action leading to an inconsistent state."),(0,o.kt)("p",null,"In order to cancel a forked task, we use a dedicated Effect ",(0,o.kt)("a",{parentName:"p",href:"https://redux-saga.js.org/docs/api/index.html#canceltask"},(0,o.kt)("inlineCode",{parentName:"a"},"cancel"))),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-javascript"},"import { take, put, call, fork, cancel } from 'redux-saga/effects'\n\n// ...\n\nfunction* loginFlow() {\n  while (true) {\n    const {user, password} = yield take('LOGIN_REQUEST')\n    // fork return a Task object\n    const task = yield fork(authorize, user, password)\n    const action = yield take(['LOGOUT', 'LOGIN_ERROR'])\n    if (action.type === 'LOGOUT')\n      yield cancel(task)\n    yield call(Api.clearItem, 'token')\n  }\n}\n")),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"yield fork")," results in a ",(0,o.kt)("a",{parentName:"p",href:"https://redux-saga.js.org/docs/api/index.html#task"},"Task Object"),". We assign the returned object into a local constant ",(0,o.kt)("inlineCode",{parentName:"p"},"task"),". Later if we take a ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGOUT")," action, we pass that task to the ",(0,o.kt)("inlineCode",{parentName:"p"},"cancel")," Effect. If the task is still running, it'll be aborted. If the task has already completed then nothing will happen and the cancellation will result in a no-op. And finally, if the task completed with an error, then we do nothing, because we know the task already completed."),(0,o.kt)("p",null,"We are ",(0,o.kt)("em",{parentName:"p"},"almost")," done (concurrency is not that easy; you have to take it seriously)."),(0,o.kt)("p",null,"Suppose that when we receive a ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGIN_REQUEST")," action, our reducer sets some ",(0,o.kt)("inlineCode",{parentName:"p"},"isLoginPending")," flag to true so it can display some message or spinner in the UI. If we get a ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGOUT")," in the middle of an API call and abort the task by ",(0,o.kt)("em",{parentName:"p"},"killing it")," (i.e. the task is stopped right away), then we may end up again with an inconsistent state. We'll still have ",(0,o.kt)("inlineCode",{parentName:"p"},"isLoginPending")," set to true and our reducer will be waiting for an outcome action (",(0,o.kt)("inlineCode",{parentName:"p"},"LOGIN_SUCCESS")," or ",(0,o.kt)("inlineCode",{parentName:"p"},"LOGIN_ERROR"),")."),(0,o.kt)("p",null,"Fortunately, the ",(0,o.kt)("inlineCode",{parentName:"p"},"cancel")," Effect won't brutally kill our ",(0,o.kt)("inlineCode",{parentName:"p"},"authorize")," task. Instead, it'll give it a chance to perform its cleanup logic. The cancelled task can handle any cancellation logic (as well as any other type of completion) in its ",(0,o.kt)("inlineCode",{parentName:"p"},"finally")," block. Since a finally block execute on any type of completion (normal return, error, or forced cancellation), there is an Effect ",(0,o.kt)("inlineCode",{parentName:"p"},"cancelled")," which you can use if you want handle cancellation in a special way:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-javascript"},"import { take, call, put, cancelled } from 'redux-saga/effects'\nimport Api from '...'\n\nfunction* authorize(user, password) {\n  try {\n    const token = yield call(Api.authorize, user, password)\n    yield put({type: 'LOGIN_SUCCESS', token})\n    yield call(Api.storeItem, {token})\n    return token\n  } catch(error) {\n    yield put({type: 'LOGIN_ERROR', error})\n  } finally {\n    if (yield cancelled()) {\n      // ... put special cancellation handling code here\n    }\n  }\n}\n")),(0,o.kt)("p",null,"You may have noticed that we haven't done anything about clearing our ",(0,o.kt)("inlineCode",{parentName:"p"},"isLoginPending")," state. For that, there are at least two possible solutions:"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},"dispatch a dedicated action ",(0,o.kt)("inlineCode",{parentName:"li"},"RESET_LOGIN_PENDING")),(0,o.kt)("li",{parentName:"ul"},"make the reducer clear the ",(0,o.kt)("inlineCode",{parentName:"li"},"isLoginPending")," on a ",(0,o.kt)("inlineCode",{parentName:"li"},"LOGOUT")," action")))}d.isMDXComponent=!0}}]);