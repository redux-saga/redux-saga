'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sagaMiddlewareFactory;

var _utils = require('./utils');

var _proc = require('./proc');

var _proc2 = _interopRequireDefault(_proc);

var _channel = require('./channel');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function sagaMiddlewareFactory() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var runSagaDynamically = void 0;
  var sagaMonitor = options.sagaMonitor;

  // monitors are expected to have a certain interface, let's fill-in any missing ones

  if (sagaMonitor) {
    sagaMonitor.effectTriggered = sagaMonitor.effectTriggered || _utils.noop;
    sagaMonitor.effectResolved = sagaMonitor.effectResolved || _utils.noop;
    sagaMonitor.effectRejected = sagaMonitor.effectRejected || _utils.noop;
    sagaMonitor.effectCancelled = sagaMonitor.effectCancelled || _utils.noop;
    sagaMonitor.actionDispatched = sagaMonitor.actionDispatched || _utils.noop;
  }

  if (_utils.is.func(options)) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Saga middleware no longer accept Generator functions. Use sagaMiddleware.run instead');
    } else {
      throw new Error('You passed a function to the Saga middleware. You are likely trying to start a        Saga by directly passing it to the middleware. This is no longer possible starting from 0.10.0.        To run a Saga, you must do it dynamically AFTER mounting the middleware into the store.\n        Example:\n          import createSagaMiddleware from \'redux-saga\'\n          ... other imports\n\n          const sagaMiddleware = createSagaMiddleware()\n          const store = createStore(reducer, applyMiddleware(sagaMiddleware))\n          sagaMiddleware.run(saga, ...args)\n      ');
    }
  }

  if (options.logger && !_utils.is.func(options.logger)) {
    throw new Error('`options.logger` passed to the Saga middleware is not a function!');
  }

  if (options.onerror) {
    if (_utils.isDev) (0, _utils.log)('warn', '`options.onerror` is deprecated. Use `options.onError` instead.');
    options.onError = options.onerror;
    delete options.onerror;
  }

  if (options.onError && !_utils.is.func(options.onError)) {
    throw new Error('`options.onError` passed to the Saga middleware is not a function!');
  }

  if (options.emitter && !_utils.is.func(options.emitter)) {
    throw new Error('`options.emitter` passed to the Saga middleware is not a function!');
  }

  function sagaMiddleware(_ref) {
    var getState = _ref.getState,
        dispatch = _ref.dispatch;

    runSagaDynamically = runSaga;
    var sagaEmitter = (0, _channel.emitter)();
    sagaEmitter.emit = (options.emitter || _utils.ident)(sagaEmitter.emit);
    var sagaDispatch = (0, _utils.wrapSagaDispatch)(dispatch);

    function runSaga(saga, args, sagaId) {
      return (0, _proc2.default)(saga.apply(undefined, _toConsumableArray(args)), sagaEmitter.subscribe, sagaDispatch, getState, options, sagaId, saga.name);
    }

    return function (next) {
      return function (action) {
        if (sagaMonitor) {
          sagaMonitor.actionDispatched(action);
        }
        var result = next(action); // hit reducers
        sagaEmitter.emit(action);
        return result;
      };
    };
  }

  sagaMiddleware.run = function (saga) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    (0, _utils.check)(runSagaDynamically, _utils.is.notUndef, 'Before running a Saga, you must mount the Saga middleware on the Store using applyMiddleware');
    (0, _utils.check)(saga, _utils.is.func, 'sagaMiddleware.run(saga, ...args): saga argument must be a Generator function!');

    var effectId = (0, _utils.uid)();
    if (sagaMonitor) {
      sagaMonitor.effectTriggered({ effectId: effectId, root: true, parentEffectId: 0, effect: { root: true, saga: saga, args: args } });
    }
    var task = runSagaDynamically(saga, args, effectId);
    if (sagaMonitor) {
      sagaMonitor.effectResolved(effectId, task);
    }
    return task;
  };

  return sagaMiddleware;
}