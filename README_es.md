<img src='https://redux-saga.js.org/logo/0800/Redux-Saga-Logo-Landscape.png' alt='Logo de Redux saga en panorama' width='800px'>

# redux-saga

[![npm version](https://img.shields.io/npm/v/redux-saga.svg)](https://www.npmjs.com/package/redux-saga)
[![CDNJS](https://img.shields.io/cdnjs/v/redux-saga.svg)](https://cdnjs.com/libraries/redux-saga)
[![npm](https://img.shields.io/npm/dm/redux-saga.svg)](https://www.npmjs.com/package/redux-saga)
[![Build Status](https://travis-ci.org/redux-saga/redux-saga.svg?branch=master)](https://travis-ci.org/redux-saga/redux-saga)
[![Join the chat at https://gitter.im/yelouafi/redux-saga](https://badges.gitter.im/yelouafi/redux-saga.svg)](https://gitter.im/yelouafi/redux-saga?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![OpenCollective](https://opencollective.com/redux-saga/backers/badge.svg)](#backers)
[![OpenCollective](https://opencollective.com/redux-saga/sponsors/badge.svg)](#sponsors)

`redux-saga` es una librería hecha con la intención de facilitar el manejo de _efectos secundarios (side effects)_ (ej. operaciones asíncronas como la _obtención de datos (data fetching)_ y cosas impuras como el acceso al cache del navegador), de manera más eficiente, más simple de probar, y para mejorar el manejo de fallas.

El modelo mental es que una saga represente (a manera de simulación) un hilo diferente en la aplicación y que únicamente sea responsable de los efectos secundarios. `redux-saga` es un _middleware (capa intermedia)_ de redux, lo que significa que este _"hilo"_ puede ser iniciado, suspendido, y cancelado desde la aplicación principal con una acción cualquiera de redux, tiene acceso a todo el _estado (state)_ de la aplicación en redux y también puede _ejecutar (dispatch)_ acciones en redux.

Usa una de las caracteristicas de ES6 llamada _Generadores (Generators)_ para que procedimientos o operaciones asíncronas sean fáciles de leer, escribir y probar. *(Sí no estás familirizado con generadores [aquí hay algúnos enlaces introductorios en inglés](https://redux-saga.js.org/docs/ExternalResources.html))* Al usar estos generadores, estas opreaciones asíncronas se asemejan a código común y corriente síncrono en JavaScript. (Algo así como `async`/`await`, pero los generadores tienen algúnas ventajas adicionales excelentes que necesitamos)

Es posible que ya hayas usado `redux-thunk` para manejar la obtención de datos en tu aplicación. Contrario a `redux-thunk`, aquí no necesitarás llenar tu aplicación de [_callback hells_](http://callbackhell.com/), también podrás probar tus operaciones asíncronas de manera sencilla y tus acciones en redux se mantendrán _puras(pure actions)_.

# Getting started

## Instalación

```sh
$ npm install --save redux-saga
```
o

```sh
$ yarn add redux-saga
```

También puedes usar los builds UMD que se encuentran directamente en el tag `<script>` de una página HTML. Ve [esta sección](#usando-umd-en-el-navegador).

## Ejemplo de uso

Imagina que tienes un UI que necesita solicitar datos de un servidor cuando un botón en pantalla es presionado. (Por simplicidad solo te mostraremos la acción que ejecutará el código)

```javascript
class UserComponent extends React.Component {
  ...
  onSomeButtonClicked() {
    const { userId, dispatch } = this.props
    dispatch({type: 'USER_FETCH_REQUESTED', payload: {userId}})
  }
  ...
}
```

El Componente _envía (dispatches)_ un objeto de una acción hacia el _Store (almacén de datos)_. Crearemos una Saga que observe todas las acciones de tipo `USER_FETCH_REQUESTED` y que ejecute una llamada de API para solicitar los datos del usuario.

#### `sagas.js`

```javascript
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects'
import Api from '...'

// Saga: será ejecutada cuando la acción USER_FETCH_REQUESTED sea envíada/ejecutada
function* fetchUser(action) {
   try {
      const user = yield call(Api.fetchUser, action.payload.userId);
      yield put({type: "USER_FETCH_SUCCEEDED", user: user});
   } catch (e) {
      yield put({type: "USER_FETCH_FAILED", message: e.message});
   }
}

/*
  Llama a fetchUser cada vez que la acción `USER_FETCH_REQUESTED` es enviada/ejecutada.
  `takeEvery` permite que las peticiones se ejecuten de manera concurrente.
*/
function* mySaga() {
  yield takeEvery("USER_FETCH_REQUESTED", fetchUser);
}

/*
  Igualmente podrías usar `takeLatest`.

  No permite solicitudes concurrentes del mismo tipo de accion. Si una accion de tipo `USER_FETCH_REQUESTED`
  se envía mientras otra está está siendo ejecutada en ese preciso momento, la acción que está siendo ejecutada será cancelada y sólo la última en recibirse será ejecutada.
*/
function* mySaga() {
  yield takeLatest("USER_FETCH_REQUESTED", fetchUser);
}

export default mySaga;
```

Para ejecutar una Saga, necesitamos conectarla a un _Redux Store (almacén de datos Redux)_ usando `redux-saga` como un _middleware_.

#### `main.js`

```javascript
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'

import reducer from './reducers'
import mySaga from './sagas'

// creamos el saga middleware
const sagaMiddleware = createSagaMiddleware()
// lo montamos en la Redux Store
const store = createStore(
  reducer,
  applyMiddleware(sagaMiddleware)
)

// y se inicia la saga
sagaMiddleware.run(mySaga)

// por último se muestra la aplicación
```

# Documentación

- [Introducción](https://redux-saga.js.org/docs/introduction/BeginnerTutorial.html)
- [Conceptos Básicos](https://redux-saga.js.org/docs/basics/index.html)
- [Conceptos avanzados](https://redux-saga.js.org/docs/advanced/index.html)
- [Recetas (_Recipes_)](https://redux-saga.js.org/docs/recipes/index.html)
- [Referencias externas](https://redux-saga.js.org/docs/ExternalResources.html)
- [Como solucionar problemas comúnes](https://redux-saga.js.org/docs/Troubleshooting.html)
- [Golsario](https://redux-saga.js.org/docs/Glossary.html)
- [Documentación del API](https://redux-saga.js.org/docs/api/index.html)

# Traducciones

- [Chino](https://github.com/superRaytin/redux-saga-in-chinese)
- [Chino tradicional](https://github.com/neighborhood999/redux-saga)
- [Japonés](https://github.com/redux-saga/redux-saga/blob/master/README_ja.md)
- [Koreano](https://github.com/mskims/redux-saga-in-korean)
- [Portugués](https://github.com/joelbarbosa/redux-saga-pt_BR)
- [Ruso](https://github.com/redux-saga/redux-saga/blob/master/README_ru.md)

# Usando umd en el navegador

Además de `npm` y `yarn`, existe una distribución **umd** de `redux-saga` y se encuentra disponible en la carpeta `dist/`. Cuando se utilice un _build_ umd de `redux-saga` este estará disponible como `ReduxSaga` en el objeto `window`. Esto permite que se pueda create un  Saga middleware sin necesidad de usar un `import` de ES6, esto funciona de la siguiente manera:

```javascript
var sagaMiddleware = ReduxSaga.default()
```

La versión umd es útil si no se utiliza Webpack o Browserify. Se puede encontrar directamente en [unpkg](https://unpkg.com/).

Los siguientes _builds_ están disponibles:

- [https://unpkg.com/redux-saga/dist/redux-saga.js](https://unpkg.com/redux-saga/dist/redux-saga.js)
- [https://unpkg.com/redux-saga/dist/redux-saga.min.js](https://unpkg.com/redux-saga/dist/redux-saga.min.js)

**¡Importante!** Si el navegador que utilizara la aplicación no tiene soporte para generadores de ES2015, se deberá transpilarlos (ej. con el [plugin babel](https://github.com/facebook/regenerator/tree/master/packages/regenerator-transform)) y proveer un _runtime_ válido, como [este](https://unpkg.com/regenerator-runtime/runtime.js). Este _runtime_ debe ser importado antes de importar **redux-saga**:

```javascript
import 'regenerator-runtime/runtime'
// después
import sagaMiddleware from 'redux-saga'
```

# Compilado desde el código fuente

```sh
$ git clone https://github.com/redux-saga/redux-saga.git
$ cd redux-saga
$ npm install
$ npm test
```

Más abajo podrás encontrar ejemplos portados (hasta el momento) de los _repos_ de Redux.

### Ejemplos de contadores

Hay tres ejemplos de contadores.

#### contador-vainilla (vanilla JavaScript)

Demo usando vanilla JavaScript y builds UMD. Todo el código fuente está escrito directamente en `index.html`.

Para ejecuta el ejemplo, solo abre `index.html` en tu navegador.

> Importante: tu navegador debe contar con soporte para generadores. Las últimas versiones de Chrome/Firefox/Edge tienen el soporte necesario.

#### counter

Demo usando `webpack` y el API de alto nivel `takeEvery`.

```sh
$ npm run counter

# probar el generador de ejemplo
$ npm run test-counter
```

#### cancellable-counter

Demo usando un API de bajo nivel que demuestra como cancelar una tarea.

```sh
$ npm run cancellable-counter
```

### Ejemplo de un carrito de compras

```sh
$ npm run shop

# probar el generador de ejemplo
$ npm run test-shop
```

### Ejemplo asíncrono

```sh
$ npm run async

# probar el ejemplo de generadores
$ npm run test-async
```

### Ejemplo de una situación real (con webpack y _hot reloading_)

```sh
$ npm run real-world

# lo siento, aún no se implementan las pruebas
```

### TypeScript

Redux-Saga con TypeScript requieren de `DOM.Iterable` o `ES2015.Iterable`. Si tu `target` es `ES6`, es posible que estés listo, sin embargo, si pleaneas ejecutarlo en una ambiente `ES5` necesitarás añadirlo por tu cuenta.
Revisa tu archivo `tsconfig.json`, y la documentación oficial para las <a href="https://www.typescriptlang.org/docs/handbook/compiler-options.html">opciones del compilador</a>.

### Logo

El logo oficial de Redux-Saga en diferentes estilos lo puedes encontrar en el [directorio de logos](https://github.com/redux-saga/redux-saga/tree/master/logo).


### Backers
Por favor, apoyanos con una donación mensual para seguir seguir con nuestras actividades. \[[Convertirme en  backer](https://opencollective.com/redux-saga#backer)\]

<a href="https://opencollective.com/redux-saga/backer/0/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/0/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/1/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/1/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/2/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/2/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/3/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/3/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/4/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/4/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/5/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/5/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/6/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/6/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/7/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/7/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/8/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/8/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/9/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/9/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/10/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/10/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/11/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/11/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/12/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/12/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/13/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/13/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/14/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/14/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/15/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/15/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/16/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/16/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/17/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/17/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/18/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/18/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/19/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/19/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/20/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/20/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/21/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/21/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/22/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/22/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/23/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/23/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/24/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/24/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/25/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/25/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/26/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/26/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/27/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/27/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/28/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/28/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/29/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/29/avatar.svg"></a>


### Patrocinadores
Conviertete en patrocinador y pon tu logo en nuestro README en Github con un enlace a tu sitio. \[[Convertirme en patrocinador](https://opencollective.com/redux-saga#sponsor)\]

<a href="https://opencollective.com/redux-saga/sponsor/0/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/1/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/2/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/3/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/4/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/5/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/6/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/7/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/8/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/9/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/9/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/10/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/10/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/11/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/11/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/12/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/12/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/13/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/13/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/14/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/14/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/15/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/15/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/16/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/16/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/17/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/17/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/18/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/18/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/19/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/19/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/20/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/20/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/21/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/21/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/22/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/22/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/23/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/23/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/24/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/24/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/25/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/25/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/26/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/26/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/27/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/27/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/28/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/28/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/29/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/29/avatar.svg"></a>
