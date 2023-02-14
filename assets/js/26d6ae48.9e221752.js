"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[781],{3905:function(e,t,n){n.d(t,{Zo:function(){return p},kt:function(){return h}});var a=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function r(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?r(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):r(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,a,o=function(e,t){if(null==e)return{};var n,a,o={},r=Object.keys(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var c=a.createContext({}),s=function(e){var t=a.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},p=function(e){var t=s(e.components);return a.createElement(c.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},u=a.forwardRef((function(e,t){var n=e.components,o=e.mdxType,r=e.originalType,c=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),u=s(n),h=o,m=u["".concat(c,".").concat(h)]||u[h]||d[h]||r;return n?a.createElement(m,i(i({ref:t},p),{},{components:n})):a.createElement(m,i({ref:t},p))}));function h(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var r=n.length,i=new Array(r);i[0]=u;var l={};for(var c in t)hasOwnProperty.call(t,c)&&(l[c]=t[c]);l.originalType=e,l.mdxType="string"==typeof e?e:o,i[1]=l;for(var s=2;s<r;s++)i[s]=n[s];return a.createElement.apply(null,i)}return a.createElement.apply(null,n)}u.displayName="MDXCreateElement"},6327:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return l},contentTitle:function(){return c},metadata:function(){return s},toc:function(){return p},default:function(){return u}});var a=n(7462),o=n(3366),r=(n(7294),n(3905)),i=["components"],l={title:"Future Actions",hide_title:!0},c="Pulling future actions",s={unversionedId:"advanced/FutureActions",id:"advanced/FutureActions",isDocsHomePage:!1,title:"Future Actions",description:"Until now we've used the helper effect takeEvery in order to spawn a new task on each incoming action. This mimics somewhat the behavior of redux-thunk: each time a Component, for example, invokes a fetchProducts Action Creator, the Action Creator will dispatch a thunk to execute the control flow.",source:"@site/../docs/advanced/FutureActions.md",sourceDirName:"advanced",slug:"/advanced/FutureActions",permalink:"/docs/advanced/FutureActions",editUrl:"https://github.com/redux-saga/redux-saga/edit/main/docs/../docs/advanced/FutureActions.md",tags:[],version:"current",frontMatter:{title:"Future Actions",hide_title:!0},sidebar:"docs",previous:{title:"Fork Model",permalink:"/docs/advanced/ForkModel"},next:{title:"Non-Blocking Calls",permalink:"/docs/advanced/NonBlockingCalls"}},p=[{value:"A basic logger",id:"a-basic-logger",children:[],level:2}],d={toc:p};function u(e){var t=e.components,n=(0,o.Z)(e,i);return(0,r.kt)("wrapper",(0,a.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"pulling-future-actions"},"Pulling future actions"),(0,r.kt)("p",null,"Until now we've used the helper effect ",(0,r.kt)("inlineCode",{parentName:"p"},"takeEvery")," in order to spawn a new task on each incoming action. This mimics somewhat the behavior of ",(0,r.kt)("inlineCode",{parentName:"p"},"redux-thunk"),": each time a Component, for example, invokes a ",(0,r.kt)("inlineCode",{parentName:"p"},"fetchProducts")," Action Creator, the Action Creator will dispatch a thunk to execute the control flow."),(0,r.kt)("p",null,"In reality, ",(0,r.kt)("inlineCode",{parentName:"p"},"takeEvery")," is just a wrapper effect for internal helper function built on top of the lower-level and more powerful API. In this section we'll see a new Effect, ",(0,r.kt)("inlineCode",{parentName:"p"},"take"),", which makes it possible to build complex control flow by allowing total control of the action observation process."),(0,r.kt)("h2",{id:"a-basic-logger"},"A basic logger"),(0,r.kt)("p",null,"Let's take a basic example of a Saga that watches all actions dispatched to the store and logs them to the console."),(0,r.kt)("p",null,"Using ",(0,r.kt)("inlineCode",{parentName:"p"},"takeEvery('*')")," (with the wildcard ",(0,r.kt)("inlineCode",{parentName:"p"},"*")," pattern), we can catch all dispatched actions regardless of their types."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-javascript"},"import { select, takeEvery } from 'redux-saga/effects'\n\nfunction* watchAndLog() {\n  yield takeEvery('*', function* logger(action) {\n    const state = yield select()\n\n    console.log('action', action)\n    console.log('state after', state)\n  })\n}\n")),(0,r.kt)("p",null,"Now let's see how to use the ",(0,r.kt)("inlineCode",{parentName:"p"},"take")," Effect to implement the same flow as above:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-javascript"},"import { select, take } from 'redux-saga/effects'\n\nfunction* watchAndLog() {\n  while (true) {\n    const action = yield take('*')\n    const state = yield select()\n\n    console.log('action', action)\n    console.log('state after', state)\n  }\n}\n")),(0,r.kt)("p",null,"The ",(0,r.kt)("inlineCode",{parentName:"p"},"take")," is just like ",(0,r.kt)("inlineCode",{parentName:"p"},"call")," and ",(0,r.kt)("inlineCode",{parentName:"p"},"put")," we saw earlier. It creates another command object that tells the middleware to wait for a specific action. The resulting behavior of the ",(0,r.kt)("inlineCode",{parentName:"p"},"call")," Effect is the same as when the middleware suspends the Generator until a Promise resolves. In the ",(0,r.kt)("inlineCode",{parentName:"p"},"take")," case, it'll suspend the Generator until a matching action is dispatched. In the above example, ",(0,r.kt)("inlineCode",{parentName:"p"},"watchAndLog")," is suspended until any action is dispatched."),(0,r.kt)("p",null,"Note how we're running an endless loop ",(0,r.kt)("inlineCode",{parentName:"p"},"while (true)"),". Remember, this is a Generator function, which doesn't have a run-to-completion behavior. Our Generator will block on each iteration waiting for an action to happen."),(0,r.kt)("p",null,"Using ",(0,r.kt)("inlineCode",{parentName:"p"},"take")," has a subtle impact on how we write our code. In the case of ",(0,r.kt)("inlineCode",{parentName:"p"},"takeEvery"),", the invoked tasks have no control on when they'll be called. They will be invoked again and again on each matching action. They also have no control on when to stop the observation."),(0,r.kt)("p",null,"In the case of ",(0,r.kt)("inlineCode",{parentName:"p"},"take"),", the control is inverted. Instead of the actions being ",(0,r.kt)("em",{parentName:"p"},"pushed")," to the handler tasks, the Saga is ",(0,r.kt)("em",{parentName:"p"},"pulling")," the action by itself. It looks as if the Saga is performing a normal function call ",(0,r.kt)("inlineCode",{parentName:"p"},"action = getNextAction()")," which will resolve when the action is dispatched."),(0,r.kt)("p",null,"This inversion of control allows us to implement control flows that are non-trivial to do with the traditional ",(0,r.kt)("em",{parentName:"p"},"push")," approach."),(0,r.kt)("p",null,"As a basic example, suppose that in our Todo application, we want to watch user actions and show a congratulation message after the user has created their first three todos."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-javascript"},"import { take, put } from 'redux-saga/effects'\n\nfunction* watchFirstThreeTodosCreation() {\n  for (let i = 0; i < 3; i++) {\n    const action = yield take('TODO_CREATED')\n  }\n  yield put({type: 'SHOW_CONGRATULATION'})\n}\n")),(0,r.kt)("p",null,"Instead of a ",(0,r.kt)("inlineCode",{parentName:"p"},"while (true)"),", we're running a ",(0,r.kt)("inlineCode",{parentName:"p"},"for")," loop, which will iterate only three times. After taking the first three ",(0,r.kt)("inlineCode",{parentName:"p"},"TODO_CREATED")," actions, ",(0,r.kt)("inlineCode",{parentName:"p"},"watchFirstThreeTodosCreation")," will cause the application to display a congratulation message then terminate. This means the Generator will be garbage collected and no more observation will take place."),(0,r.kt)("p",null,"Another benefit of the pull approach is that we can describe our control flow using a familiar synchronous style. For example, suppose we want to implement a login flow with two actions: ",(0,r.kt)("inlineCode",{parentName:"p"},"LOGIN")," and ",(0,r.kt)("inlineCode",{parentName:"p"},"LOGOUT"),". Using ",(0,r.kt)("inlineCode",{parentName:"p"},"takeEvery")," (or ",(0,r.kt)("inlineCode",{parentName:"p"},"redux-thunk"),"), we'll have to write two separate tasks (or thunks): one for ",(0,r.kt)("inlineCode",{parentName:"p"},"LOGIN")," and the other for ",(0,r.kt)("inlineCode",{parentName:"p"},"LOGOUT"),"."),(0,r.kt)("p",null,"The result is that our logic is now spread in two places. In order for someone reading our code to understand it, they would have to read the source of the two handlers and make the link between the logic in both in their head. In other words, it means they would have to rebuild the model of the flow in their head by rearranging mentally the logic placed in various places of the code in the correct order."),(0,r.kt)("p",null,"Using the pull model, we can write our flow in the same place instead of handling the same action repeatedly."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-javascript"},"function* loginFlow() {\n  while (true) {\n    yield take('LOGIN')\n    // ... perform the login logic\n    yield take('LOGOUT')\n    // ... perform the logout logic\n  }\n}\n")),(0,r.kt)("p",null,"The ",(0,r.kt)("inlineCode",{parentName:"p"},"loginFlow")," Saga more clearly conveys the expected action sequence. It knows that the ",(0,r.kt)("inlineCode",{parentName:"p"},"LOGIN")," action should always be followed by a ",(0,r.kt)("inlineCode",{parentName:"p"},"LOGOUT")," action, and that ",(0,r.kt)("inlineCode",{parentName:"p"},"LOGOUT")," is always followed by a ",(0,r.kt)("inlineCode",{parentName:"p"},"LOGIN")," (a good UI should always enforce a consistent order of the actions, by hiding or disabling unexpected actions)."))}u.isMDXComponent=!0}}]);