"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[532],{3905:function(e,t,n){n.d(t,{Zo:function(){return d},kt:function(){return m}});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},i=Object.keys(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var l=a.createContext({}),u=function(e){var t=a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},d=function(e){var t=u(e.components);return a.createElement(l.Provider,{value:t},e.children)},c={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},p=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,i=e.originalType,l=e.parentName,d=s(e,["components","mdxType","originalType","parentName"]),p=u(n),m=r,g=p["".concat(l,".").concat(m)]||p[m]||c[m]||i;return n?a.createElement(g,o(o({ref:t},d),{},{components:n})):a.createElement(g,o({ref:t},d))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var i=n.length,o=new Array(i);o[0]=p;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s.mdxType="string"==typeof e?e:r,o[1]=s;for(var u=2;u<i;u++)o[u]=n[u];return a.createElement.apply(null,o)}return a.createElement.apply(null,n)}p.displayName="MDXCreateElement"},2783:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return s},contentTitle:function(){return l},metadata:function(){return u},toc:function(){return d},default:function(){return p}});var a=n(7462),r=n(3366),i=(n(7294),n(3905)),o=["components"],s={title:"Getting Started",hide_title:!0},l="Getting started",u={unversionedId:"introduction/GettingStarted",id:"introduction/GettingStarted",isDocsHomePage:!1,title:"Getting Started",description:"Install",source:"@site/../docs/introduction/GettingStarted.md",sourceDirName:"introduction",slug:"/introduction/GettingStarted",permalink:"/docs/introduction/GettingStarted",editUrl:"https://github.com/redux-saga/redux-saga/edit/main/docs/../docs/introduction/GettingStarted.md",tags:[],version:"current",frontMatter:{title:"Getting Started",hide_title:!0},sidebar:"docs",previous:{title:"About",permalink:"/docs/About"},next:{title:"Beginner Tutorial",permalink:"/docs/introduction/BeginnerTutorial"}},d=[{value:"Install",id:"install",children:[],level:2},{value:"Usage Example",id:"usage-example",children:[{value:"<code>sagas.js</code>",id:"sagasjs",children:[],level:4},{value:"<code>main.js</code>",id:"mainjs",children:[],level:4}],level:2},{value:"Using UMD build in the browser",id:"using-umd-build-in-the-browser",children:[],level:2}],c={toc:d};function p(e){var t=e.components,n=(0,r.Z)(e,o);return(0,i.kt)("wrapper",(0,a.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"getting-started"},"Getting started"),(0,i.kt)("h2",{id:"install"},"Install"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-sh"},"$ npm install redux-saga\n")),(0,i.kt)("p",null,"or"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-sh"},"$ yarn add redux-saga\n")),(0,i.kt)("p",null,"Alternatively, you may use the provided UMD builds directly in the ",(0,i.kt)("inlineCode",{parentName:"p"},"<script>")," tag of an HTML page. See ",(0,i.kt)("a",{parentName:"p",href:"#using-umd-build-in-the-browser"},"this section"),"."),(0,i.kt)("h2",{id:"usage-example"},"Usage Example"),(0,i.kt)("p",null,"Suppose we have a UI to fetch some user data from a remote server when a button is clicked. (For brevity, we'll just show the action triggering code.)"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-javascript"},"class UserComponent extends React.Component {\n  ...\n  onSomeButtonClicked() {\n    const { userId, dispatch } = this.props\n    dispatch({type: 'USER_FETCH_REQUESTED', payload: {userId}})\n  }\n  ...\n}\n")),(0,i.kt)("p",null,"The Component dispatches a plain Object action to the Store. We'll create a Saga that watches for all ",(0,i.kt)("inlineCode",{parentName:"p"},"USER_FETCH_REQUESTED")," actions and triggers an API call to fetch the user data."),(0,i.kt)("h4",{id:"sagasjs"},(0,i.kt)("inlineCode",{parentName:"h4"},"sagas.js")),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-javascript"},"import { call, put, takeEvery, takeLatest } from 'redux-saga/effects'\nimport Api from '...'\n\n// worker Saga: will be fired on USER_FETCH_REQUESTED actions\nfunction* fetchUser(action) {\n  try {\n    const user = yield call(Api.fetchUser, action.payload.userId)\n    yield put({ type: 'USER_FETCH_SUCCEEDED', user: user })\n  } catch (e) {\n    yield put({ type: 'USER_FETCH_FAILED', message: e.message })\n  }\n}\n\n/*\n  Starts fetchUser on each dispatched `USER_FETCH_REQUESTED` action.\n  Allows concurrent fetches of user.\n*/\nfunction* mySaga() {\n  yield takeEvery('USER_FETCH_REQUESTED', fetchUser)\n}\n\n/*\n  Alternatively you may use takeLatest.\n\n  Does not allow concurrent fetches of user. If \"USER_FETCH_REQUESTED\" gets\n  dispatched while a fetch is already pending, that pending fetch is cancelled\n  and only the latest one will be run.\n*/\nfunction* mySaga() {\n  yield takeLatest('USER_FETCH_REQUESTED', fetchUser)\n}\n\nexport default mySaga\n")),(0,i.kt)("p",null,"To run our Saga, we'll have to connect it to the Redux Store using the ",(0,i.kt)("inlineCode",{parentName:"p"},"redux-saga")," middleware."),(0,i.kt)("h4",{id:"mainjs"},(0,i.kt)("inlineCode",{parentName:"h4"},"main.js")),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-javascript"},"import { configureStore } from '@reduxjs/toolkit'\nimport createSagaMiddleware from 'redux-saga'\n\nimport reducer from './reducers'\nimport mySaga from './sagas'\n\n// create the saga middleware\nconst sagaMiddleware = createSagaMiddleware()\n// mount it on the Store\nconst store = configureStore(\n  reducer, \n  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware),\n)\n\n// then run the saga\nsagaMiddleware.run(mySaga)\n\n// render the application\n")),(0,i.kt)("h2",{id:"using-umd-build-in-the-browser"},"Using UMD build in the browser"),(0,i.kt)("p",null,"There is also a ",(0,i.kt)("strong",{parentName:"p"},"UMD")," build of ",(0,i.kt)("inlineCode",{parentName:"p"},"redux-saga")," available in the ",(0,i.kt)("inlineCode",{parentName:"p"},"dist/")," folder. When using the umd build ",(0,i.kt)("inlineCode",{parentName:"p"},"redux-saga")," is available as ",(0,i.kt)("inlineCode",{parentName:"p"},"ReduxSaga")," in the window object. This enables you to create Saga middleware without using ES6 ",(0,i.kt)("inlineCode",{parentName:"p"},"import")," syntax like this:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-javascript"},"var sagaMiddleware = ReduxSaga.default()\n")),(0,i.kt)("p",null,"The UMD version is useful if you don't use Webpack or Browserify. You can access it directly from ",(0,i.kt)("a",{parentName:"p",href:"https://unpkg.com/"},"unpkg"),"."),(0,i.kt)("p",null,"The following builds are available:"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"https://unpkg.com/redux-saga/dist/redux-saga.umd.js"},"https://unpkg.com/redux-saga/dist/redux-saga.umd.js")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"https://unpkg.com/redux-saga/dist/redux-saga.umd.min.js"},"https://unpkg.com/redux-saga/dist/redux-saga.umd.min.js"))),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},"Important!"),"\nIf the browser you are targeting doesn't support ",(0,i.kt)("em",{parentName:"p"},"ES2015 generators"),", you must transpile them (i.e., with ",(0,i.kt)("a",{parentName:"p",href:"https://github.com/facebook/regenerator/tree/main/packages/transform"},"babel plugin"),") and provide a valid runtime, such as ",(0,i.kt)("a",{parentName:"p",href:"https://unpkg.com/regenerator-runtime/runtime.js"},"the one here"),". The runtime must be imported before ",(0,i.kt)("strong",{parentName:"p"},"redux-saga"),":"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-javascript"},"import 'regenerator-runtime/runtime'\n// then\nimport sagaMiddleware from 'redux-saga'\n")))}p.isMDXComponent=!0}}]);