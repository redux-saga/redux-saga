"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[701],{3905:function(e,t,n){n.d(t,{Zo:function(){return u},kt:function(){return d}});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var c=r.createContext({}),s=function(e){var t=r.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},u=function(e){var t=s(e.components);return r.createElement(c.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},f=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,o=e.originalType,c=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),f=s(n),d=a,g=f["".concat(c,".").concat(d)]||f[d]||p[d]||o;return n?r.createElement(g,i(i({ref:t},u),{},{components:n})):r.createElement(g,i({ref:t},u))}));function d(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=n.length,i=new Array(o);i[0]=f;var l={};for(var c in t)hasOwnProperty.call(t,c)&&(l[c]=t[c]);l.originalType=e,l.mdxType="string"==typeof e?e:a,i[1]=l;for(var s=2;s<o;s++)i[s]=n[s];return r.createElement.apply(null,i)}return r.createElement.apply(null,n)}f.displayName="MDXCreateElement"},1265:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return l},contentTitle:function(){return c},metadata:function(){return s},toc:function(){return u},default:function(){return f}});var r=n(7462),a=n(3366),o=(n(7294),n(3905)),i=["components"],l={id:"Glossary",title:"Glossary",hide_title:!0},c="Glossary",s={unversionedId:"Glossary",id:"Glossary",isDocsHomePage:!1,title:"Glossary",description:"This is a glossary of the core terms in Redux Saga.",source:"@site/../docs/Glossary.md",sourceDirName:".",slug:"/Glossary",permalink:"/docs/Glossary",editUrl:"https://github.com/redux-saga/redux-saga/edit/main/docs/../docs/Glossary.md",tags:[],version:"current",frontMatter:{id:"Glossary",title:"Glossary",hide_title:!0},sidebar:"docs",previous:{title:"Troubleshooting",permalink:"/docs/Troubleshooting"},next:{title:"API Reference",permalink:"/docs/api"}},u=[{value:"Effect",id:"effect",children:[],level:3},{value:"Task",id:"task",children:[],level:3},{value:"Blocking/Non-blocking call",id:"blockingnon-blocking-call",children:[],level:3},{value:"Watcher/Worker",id:"watcherworker",children:[],level:3}],p={toc:u};function f(e){var t=e.components,n=(0,a.Z)(e,i);return(0,o.kt)("wrapper",(0,r.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"glossary"},"Glossary"),(0,o.kt)("p",null,"This is a glossary of the core terms in Redux Saga."),(0,o.kt)("h3",{id:"effect"},"Effect"),(0,o.kt)("p",null,"An effect is a plain JavaScript Object containing some instructions to be executed by the saga middleware."),(0,o.kt)("p",null,"You create effects using factory functions provided by the redux-saga library. For example you use\n",(0,o.kt)("inlineCode",{parentName:"p"},"call(myfunc, 'arg1', 'arg2')")," to instruct the middleware to invoke ",(0,o.kt)("inlineCode",{parentName:"p"},"myfunc('arg1', 'arg2')")," and return\nthe result back to the Generator that yielded the effect"),(0,o.kt)("h3",{id:"task"},"Task"),(0,o.kt)("p",null,"A task is like a process running in background. In a redux-saga based application there can be\nmultiple tasks running in parallel. You create tasks by using the ",(0,o.kt)("inlineCode",{parentName:"p"},"fork")," function"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-javascript"},'import {fork} from "redux-saga/effects"\n\nfunction* saga() {\n  ...\n  const task = yield fork(otherSaga, ...args)\n  ...\n}\n')),(0,o.kt)("h3",{id:"blockingnon-blocking-call"},"Blocking/Non-blocking call"),(0,o.kt)("p",null,"A Blocking call means that the Saga yielded an Effect and will wait for the outcome of its execution before\nresuming to the next instruction inside the yielding Generator."),(0,o.kt)("p",null,"A Non-blocking call means that the Saga will resume immediately after yielding the Effect."),(0,o.kt)("p",null,"For example"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-javascript"},'import {call, cancel, join, take, put} from "redux-saga/effects"\n\nfunction* saga() {\n  yield take(ACTION)              // Blocking: will wait for the action\n  yield call(ApiFn, ...args)      // Blocking: will wait for ApiFn (If ApiFn returns a Promise)\n  yield call(otherSaga, ...args)  // Blocking: will wait for otherSaga to terminate\n\n  yield put(...)                   // Non-Blocking: will dispatch within internal scheduler\n\n  const task = yield fork(otherSaga, ...args)  // Non-blocking: will not wait for otherSaga\n  yield cancel(task)                           // Non-blocking: will resume immediately\n  // or\n  yield join(task)                              // Blocking: will wait for the task to terminate\n}\n')),(0,o.kt)("h3",{id:"watcherworker"},"Watcher/Worker"),(0,o.kt)("p",null,"refers to a way of organizing the control flow using two separate Sagas"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("p",{parentName:"li"},"The watcher: will watch for dispatched actions and fork a worker on every action")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("p",{parentName:"li"},"The worker: will handle the action and terminate"))),(0,o.kt)("p",null,"example"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-javascript"},"function* watcher() {\n  while (true) {\n    const action = yield take(ACTION)\n    yield fork(worker, action.payload)\n  }\n}\n\nfunction* worker(payload) {\n  // ... do some stuff\n}\n")))}f.isMDXComponent=!0}}]);