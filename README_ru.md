# redux-saga

[![Join the chat at https://gitter.im/yelouafi/redux-saga](https://badges.gitter.im/yelouafi/redux-saga.svg)](https://gitter.im/yelouafi/redux-saga?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![npm version](https://img.shields.io/npm/v/redux-saga.svg?style=flat-square)](https://www.npmjs.com/package/redux-saga) [![CDNJS](https://img.shields.io/cdnjs/v/redux-saga.svg?style=flat-square)](https://cdnjs.com/libraries/redux-saga)
[![OpenCollective](https://opencollective.com/redux-saga/backers/badge.svg)](#backers)
[![OpenCollective](https://opencollective.com/redux-saga/sponsors/badge.svg)](#sponsors)

`redux-saga` - это библиотека, которая призвана упростить и улучшить выполнение сайд-эффектов (т.е. таких действий, как асинхронные операции, типа загрузки данных и "грязных" действий, типа доступа к браузерному кэшу) в React/Redux приложениях.

Можно представить это так, что сага - это как отдельный поток в вашем приложении, который отвечает за сайд-эффекты. `redux-saga` - это redux мидлвар, что означает, что этот поток может запускаться, останавливаться и отменяться из основного приложения с помощью обычных redux экшенов, оно имеет доступ к полному состоянию redux приложения и также может диспатчить redux экшены.

Библиотека использует концепцию ES6, под названием генераторы, для того, чтобы сделать эти асинхронные потоки легкими для чтения, написания и тестирования. *(если вы не знакомы с этим, [здесь есть некоторые ссылки для ознакомления](https://redux-saga.js.org/docs/ExternalResources.html))* Тем самым, эти асинхронные потоки выглядят, как ваш стандартный синхронный JavaScript код. (наподобие `async`/`await`, но генераторы имеют несколько отличных возможностей, необходимых нам)

Возможно, вы уже использовали `redux-thunk`, перед тем как обрабатывать ваши выборки данных. В отличие от redux thunk, вы не оказываетесь в callback аду, вы можете легко тестировать ваши асинхронные потоки и ваши экшены остаются чистыми.

# Приступая к работе

```sh
$ npm install --save redux-saga
```
или

```sh
$ yarn add redux-saga
```

Альтернативно, вы можете использовать предоставленные UMD сборки напрямую в `<script>` на HTML странице. Смотрите [эту секцию](#using-umd-build-in-the-browser).

## Пример использования

Предположим, что у нас есть интерфейс для извлечения некоторых пользовательских данных с удаленного сервера при нажатии кнопки. (Для краткости, мы просто покажем код запуска экшена.)

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
Компонент диспатчит action в виде простого объекта в Store. Мы создадим сагу, которая слушает все `USER_FETCH_REQUESTED` экшены и триггерит вызовы API для извлечения пользовательских данных.

#### `sagas.js`

```javascript
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects'
import Api from '...'

// worker Saga: будет запускаться на экшены типа `USER_FETCH_REQUESTED`
function* fetchUser(action) {
   try {
      const user = yield call(Api.fetchUser, action.payload.userId);
      yield put({type: "USER_FETCH_SUCCEEDED", user: user});
   } catch (e) {
      yield put({type: "USER_FETCH_FAILED", message: e.message});
   }
}

/*
  Запускаем `fetchUser` на каждый задиспатченый экшен `USER_FETCH_REQUESTED`.
  Позволяет одновременно получать данные пользователей.
*/
function* mySaga() {
  yield takeEvery("USER_FETCH_REQUESTED", fetchUser);
}

/*
  В качестве альтернативы вы можете использовать `takeLatest`.

  Не допускает одновременное получение данных пользователей. Если `USER_FETCH_REQUESTED`
  диспатчится в то время когда предыдущий запрос все еще находится в ожидании ответа,
  то этот ожидающий ответа запрос отменяется и срабатывает только последний.
*/
function* mySaga() {
  yield takeLatest("USER_FETCH_REQUESTED", fetchUser);
}

export default mySaga;
```

Для запуска нашей саги, мы подключим ее к Redux Store, используя `redux-saga` мидлвар.

#### `main.js`

```javascript
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'

import reducer from './reducers'
import mySaga from './sagas'

// создаем saga мидлвар
const sagaMiddleware = createSagaMiddleware()
// монтируем его в Store
const store = createStore(
  reducer,
  applyMiddleware(sagaMiddleware)
)

// затем запускаем сагу
sagaMiddleware.run(mySaga)

// рендерим приложение
```

# Документация

- [Введение](https://redux-saga.js.org/docs/introduction/BeginnerTutorial.html)
- [Базовые концепции](https://redux-saga.js.org/docs/basics/index.html)
- [Продвинутое использование](https://redux-saga.js.org/docs/advanced/index.html)
- [Рецепты](https://redux-saga.js.org/docs/recipes/index.html)
- [Сторонние ресурсы](https://redux-saga.js.org/docs/ExternalResources.html)
- [Устранение проблем](https://redux-saga.js.org/docs/Troubleshooting.html)
- [Глоссарий](https://redux-saga.js.org/docs/Glossary.html)
- [Справочник по API](https://redux-saga.js.org/docs/api/index.html)

# Переводы

- [Chinese](https://github.com/superRaytin/redux-saga-in-chinese)
- [Chinese Traditional](https://github.com/neighborhood999/redux-saga)
- [Japanese](https://github.com/redux-saga/redux-saga/blob/master/README_ja.md)
- [Korean](https://github.com/redux-saga/redux-saga/blob/master/README_ko.md)
- [Russian](https://github.com/redux-saga/redux-saga/blob/master/README_ru.md)

# Использование UMD сборки в браузере

Также существует **umd** сборка `redux-saga` доступная в каталоге `dist/`. При использовании umd сборки, `redux-saga` доступна как `ReduxSaga` в объекте `window`.

umd версия полезна, если вы не используете Webpack или Browserify. Вы можете получить доступ к ней, непосредственно из [unpkg](https://unpkg.com/).

Доступны следующие сборки:

- [https://unpkg.com/redux-saga/dist/redux-saga.js](https://unpkg.com/redux-saga/dist/redux-saga.js)
- [https://unpkg.com/redux-saga/dist/redux-saga.min.js](https://unpkg.com/redux-saga/dist/redux-saga.min.js)

**Важно!** Если ваш браузер не поддерживает *ES2015 генераторы*, вы должны подключить работающий полифил, аналогичный [предоставляемому `babel`](https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.25/browser-polyfill.min.js). Этот полифил должен быть импортирован до **redux-saga**:

```javascript
import 'babel-polyfill'
// затем
import sagaMiddleware from 'redux-saga'
```

# Сборка примеров из исходных файлов

```sh
$ git clone https://github.com/yelouafi/redux-saga.git
$ cd redux-saga
$ npm install
$ npm test
```

Ниже приведены примеры, портированые (пока) из репозиториев Redux.

### Примеры счетчика

Есть три примера счетчика.

#### counter-vanilla

Демо, использующее ванильный JavaScript и UMD сборки. Все исходники находятся в `index.html`.

Для запуска примера, просто откройте `index.html` в вашем браузере.

> Важно: ваш браузер должен поддерживать Генераторы. Последние версии Chrome/Firefox/Edge подойдут.

#### counter

Демо, использующее `webpack` и высокоуровневое API `takeEvery`.

```sh
$ npm run counter

# тестовый образец для генератора
$ npm run test-counter
```

#### cancellable-counter

Демо, использующее низкоуровневое API для демонстрации отмены задачи.

```sh
$ npm run cancellable-counter
```

### Пример Shopping Cart

```sh
$ npm run shop

# тестовый образец для генератора
$ npm run test-shop
```

### async пример

```sh
$ npm run async

# тестовый образец для генераторов
$ npm run test-async
```

### real-world пример (с webpack hot reloading)

```sh
$ npm run real-world

# Извините, тестов пока нет
```


### Меценат
Поддержите нас при помощи ежемесячного пожертвования и помогите нам продолжать нашу деятельность. \[[Стать меценатом](https://opencollective.com/redux-saga#backer)\]

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


### Спонсоры
Стань спонсором и получи свой логотип в нашем README на Github с ссылкой на ваш сайт. \[[Стать спонсором](https://opencollective.com/redux-saga#sponsor)\]

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
