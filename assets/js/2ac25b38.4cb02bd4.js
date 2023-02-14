"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[108],{3905:function(e,t,n){n.d(t,{Zo:function(){return u},kt:function(){return f}});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var s=r.createContext({}),l=function(e){var t=r.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):c(c({},t),e)),n},u=function(e){var t=l(e.components);return r.createElement(s.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,o=e.originalType,s=e.parentName,u=i(e,["components","mdxType","originalType","parentName"]),d=l(n),f=a,k=d["".concat(s,".").concat(f)]||d[f]||p[f]||o;return n?r.createElement(k,c(c({ref:t},u),{},{components:n})):r.createElement(k,c({ref:t},u))}));function f(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=n.length,c=new Array(o);c[0]=d;var i={};for(var s in t)hasOwnProperty.call(t,s)&&(i[s]=t[s]);i.originalType=e,i.mdxType="string"==typeof e?e:a,c[1]=i;for(var l=2;l<o;l++)c[l]=n[l];return r.createElement.apply(null,c)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},1523:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return i},contentTitle:function(){return s},metadata:function(){return l},toc:function(){return u},default:function(){return d}});var r=n(7462),a=n(3366),o=(n(7294),n(3905)),c=["components"],i={title:"Concurrency",hide_title:!0},s="Concurrency",l={unversionedId:"advanced/Concurrency",id:"advanced/Concurrency",isDocsHomePage:!1,title:"Concurrency",description:"In the basics section, we saw how to use the helper effects takeEvery and takeLatest in order to manage concurrency between Effects.",source:"@site/../docs/advanced/Concurrency.md",sourceDirName:"advanced",slug:"/advanced/Concurrency",permalink:"/docs/advanced/Concurrency",editUrl:"https://github.com/redux-saga/redux-saga/edit/main/docs/../docs/advanced/Concurrency.md",tags:[],version:"current",frontMatter:{title:"Concurrency",hide_title:!0},sidebar:"docs",previous:{title:"Composing Sagas",permalink:"/docs/advanced/ComposingSagas"},next:{title:"Fork Model",permalink:"/docs/advanced/ForkModel"}},u=[{value:"<code>takeEvery</code>",id:"takeevery",children:[],level:2},{value:"<code>takeLatest</code>",id:"takelatest",children:[],level:2}],p={toc:u};function d(e){var t=e.components,n=(0,a.Z)(e,c);return(0,o.kt)("wrapper",(0,r.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"concurrency"},"Concurrency"),(0,o.kt)("p",null,"In the basics section, we saw how to use the helper effects ",(0,o.kt)("inlineCode",{parentName:"p"},"takeEvery")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"takeLatest")," in order to manage concurrency between Effects."),(0,o.kt)("p",null,"In this section we'll see how those helpers could be implemented using the low-level Effects."),(0,o.kt)("h2",{id:"takeevery"},(0,o.kt)("inlineCode",{parentName:"h2"},"takeEvery")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-javascript"},'import {fork, take} from "redux-saga/effects"\n\nconst takeEvery = (pattern, saga, ...args) => fork(function*() {\n  while (true) {\n    const action = yield take(pattern)\n    yield fork(saga, ...args.concat(action))\n  }\n})\n')),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"takeEvery")," allows multiple ",(0,o.kt)("inlineCode",{parentName:"p"},"saga")," tasks to be forked concurrently."),(0,o.kt)("h2",{id:"takelatest"},(0,o.kt)("inlineCode",{parentName:"h2"},"takeLatest")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-javascript"},'import {cancel, fork, take} from "redux-saga/effects"\n\nconst takeLatest = (pattern, saga, ...args) => fork(function*() {\n  let lastTask\n  while (true) {\n    const action = yield take(pattern)\n    if (lastTask) {\n      yield cancel(lastTask) // cancel is no-op if the task has already terminated\n    }\n    lastTask = yield fork(saga, ...args.concat(action))\n  }\n})\n')),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"takeLatest")," doesn't allow multiple Saga tasks to be fired concurrently. As soon as it gets a new dispatched action, it cancels any previously-forked task (if still running)."),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"takeLatest")," can be useful to handle AJAX requests where we want to only have the response to the latest request."))}d.isMDXComponent=!0}}]);