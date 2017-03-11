'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.runSaga = runSaga;

var _utils = require('./utils');

var _proc = require('./proc');

var _proc2 = _interopRequireDefault(_proc);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function runSaga(iterator, _ref) {
  var subscribe = _ref.subscribe,
      dispatch = _ref.dispatch,
      getState = _ref.getState,
      sagaMonitor = _ref.sagaMonitor,
      logger = _ref.logger,
      onError = _ref.onError;


  (0, _utils.check)(iterator, _utils.is.iterator, "runSaga must be called on an iterator");

  var effectId = (0, _utils.uid)();
  if (sagaMonitor) {
    sagaMonitor.effectTriggered({ effectId: effectId, root: true, parentEffectId: 0, effect: { root: true, saga: iterator, args: [] } });
  }
  var task = (0, _proc2.default)(iterator, subscribe, (0, _utils.wrapSagaDispatch)(dispatch), getState, { sagaMonitor: sagaMonitor, logger: logger, onError: onError }, effectId, iterator.name);

  if (sagaMonitor) {
    sagaMonitor.effectResolved(effectId, task);
  }

  return task;
}