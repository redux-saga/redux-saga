'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.asEffect = exports.takem = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.take = take;
exports.put = put;
exports.race = race;
exports.call = call;
exports.apply = apply;
exports.cps = cps;
exports.fork = fork;
exports.spawn = spawn;
exports.join = join;
exports.cancel = cancel;
exports.select = select;
exports.actionChannel = actionChannel;
exports.cancelled = cancelled;
exports.flush = flush;
exports.takeEvery = takeEvery;
exports.takeLatest = takeLatest;
exports.throttle = throttle;

var _utils = require('./utils');

var _sagaHelpers = require('./sagaHelpers');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var IO = (0, _utils.sym)('IO');
var TAKE = 'TAKE';
var PUT = 'PUT';
var RACE = 'RACE';
var CALL = 'CALL';
var CPS = 'CPS';
var FORK = 'FORK';
var JOIN = 'JOIN';
var CANCEL = 'CANCEL';
var SELECT = 'SELECT';
var ACTION_CHANNEL = 'ACTION_CHANNEL';
var CANCELLED = 'CANCELLED';
var FLUSH = 'FLUSH';

var TEST_HINT = '\n(HINT: if you are getting this errors in tests, consider using createMockTask from redux-saga/utils)';

var deprecationWarning = function deprecationWarning(deprecated, preferred) {
  return deprecated + ' has been deprecated in favor of ' + preferred + ', please update your code';
};

var effect = function effect(type, payload) {
  var _ref;

  return _ref = {}, _defineProperty(_ref, IO, true), _defineProperty(_ref, type, payload), _ref;
};

function take() {
  var patternOrChannel = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '*';

  if (arguments.length) {
    (0, _utils.check)(arguments[0], _utils.is.notUndef, 'take(patternOrChannel): patternOrChannel is undefined');
  }
  if (_utils.is.pattern(patternOrChannel)) {
    return effect(TAKE, { pattern: patternOrChannel });
  }
  if (_utils.is.channel(patternOrChannel)) {
    return effect(TAKE, { channel: patternOrChannel });
  }
  throw new Error('take(patternOrChannel): argument ' + String(patternOrChannel) + ' is not valid channel or a valid pattern');
}

take.maybe = function () {
  var eff = take.apply(undefined, arguments);
  eff[TAKE].maybe = true;
  return eff;
};

var takem = exports.takem = (0, _utils.deprecate)(take.maybe, deprecationWarning('takem', 'take.maybe'));

function put(channel, action) {
  if (arguments.length > 1) {
    (0, _utils.check)(channel, _utils.is.notUndef, 'put(channel, action): argument channel is undefined');
    (0, _utils.check)(channel, _utils.is.channel, 'put(channel, action): argument ' + channel + ' is not a valid channel');
    (0, _utils.check)(action, _utils.is.notUndef, 'put(channel, action): argument action is undefined');
  } else {
    (0, _utils.check)(channel, _utils.is.notUndef, 'put(action): argument action is undefined');
    action = channel;
    channel = null;
  }
  return effect(PUT, { channel: channel, action: action });
}

put.resolve = function () {
  var eff = put.apply(undefined, arguments);
  eff[PUT].resolve = true;
  return eff;
};

put.sync = (0, _utils.deprecate)(put.resolve, deprecationWarning('put.sync', 'put.resolve'));

function race(effects) {
  return effect(RACE, effects);
}

function getFnCallDesc(meth, fn, args) {
  (0, _utils.check)(fn, _utils.is.notUndef, meth + ': argument fn is undefined');

  var context = null;
  if (_utils.is.array(fn)) {
    var _fn = fn;

    var _fn2 = _slicedToArray(_fn, 2);

    context = _fn2[0];
    fn = _fn2[1];
  } else if (fn.fn) {
    var _fn3 = fn;
    context = _fn3.context;
    fn = _fn3.fn;
  }
  (0, _utils.check)(fn, _utils.is.func, meth + ': argument ' + fn + ' is not a function');

  return { context: context, fn: fn, args: args };
}

function call(fn) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  return effect(CALL, getFnCallDesc('call', fn, args));
}

function apply(context, fn) {
  var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  return effect(CALL, getFnCallDesc('apply', { context: context, fn: fn }, args));
}

function cps(fn) {
  for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }

  return effect(CPS, getFnCallDesc('cps', fn, args));
}

function fork(fn) {
  for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
    args[_key3 - 1] = arguments[_key3];
  }

  return effect(FORK, getFnCallDesc('fork', fn, args));
}

function spawn(fn) {
  for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
    args[_key4 - 1] = arguments[_key4];
  }

  var eff = fork.apply(undefined, [fn].concat(args));
  eff[FORK].detached = true;
  return eff;
}

function join() {
  for (var _len5 = arguments.length, tasks = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
    tasks[_key5] = arguments[_key5];
  }

  if (tasks.length > 1) {
    return tasks.map(function (t) {
      return join(t);
    });
  }
  var task = tasks[0];
  (0, _utils.check)(task, _utils.is.notUndef, 'join(task): argument task is undefined');
  (0, _utils.check)(task, _utils.is.task, 'join(task): argument ' + task + ' is not a valid Task object ' + TEST_HINT);
  return effect(JOIN, task);
}

function cancel() {
  for (var _len6 = arguments.length, tasks = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
    tasks[_key6] = arguments[_key6];
  }

  if (tasks.length > 1) {
    return tasks.map(function (t) {
      return cancel(t);
    });
  }
  var task = tasks[0];
  if (tasks.length === 1) {
    (0, _utils.check)(task, _utils.is.notUndef, 'cancel(task): argument task is undefined');
    (0, _utils.check)(task, _utils.is.task, 'cancel(task): argument ' + task + ' is not a valid Task object ' + TEST_HINT);
  }
  return effect(CANCEL, task || _utils.SELF_CANCELLATION);
}

function select(selector) {
  for (var _len7 = arguments.length, args = Array(_len7 > 1 ? _len7 - 1 : 0), _key7 = 1; _key7 < _len7; _key7++) {
    args[_key7 - 1] = arguments[_key7];
  }

  if (arguments.length === 0) {
    selector = _utils.ident;
  } else {
    (0, _utils.check)(selector, _utils.is.notUndef, 'select(selector,[...]): argument selector is undefined');
    (0, _utils.check)(selector, _utils.is.func, 'select(selector,[...]): argument ' + selector + ' is not a function');
  }
  return effect(SELECT, { selector: selector, args: args });
}

/**
  channel(pattern, [buffer])    => creates an event channel for store actions
**/
function actionChannel(pattern, buffer) {
  (0, _utils.check)(pattern, _utils.is.notUndef, 'actionChannel(pattern,...): argument pattern is undefined');
  if (arguments.length > 1) {
    (0, _utils.check)(buffer, _utils.is.notUndef, 'actionChannel(pattern, buffer): argument buffer is undefined');
    (0, _utils.check)(buffer, _utils.is.buffer, 'actionChannel(pattern, buffer): argument ' + buffer + ' is not a valid buffer');
  }
  return effect(ACTION_CHANNEL, { pattern: pattern, buffer: buffer });
}

function cancelled() {
  return effect(CANCELLED, {});
}

function flush(channel) {
  (0, _utils.check)(channel, _utils.is.channel, 'flush(channel): argument ' + channel + ' is not valid channel');
  return effect(FLUSH, channel);
}

function takeEvery(patternOrChannel, worker) {
  for (var _len8 = arguments.length, args = Array(_len8 > 2 ? _len8 - 2 : 0), _key8 = 2; _key8 < _len8; _key8++) {
    args[_key8 - 2] = arguments[_key8];
  }

  return fork.apply(undefined, [_sagaHelpers.takeEveryHelper, patternOrChannel, worker].concat(args));
}

function takeLatest(patternOrChannel, worker) {
  for (var _len9 = arguments.length, args = Array(_len9 > 2 ? _len9 - 2 : 0), _key9 = 2; _key9 < _len9; _key9++) {
    args[_key9 - 2] = arguments[_key9];
  }

  return fork.apply(undefined, [_sagaHelpers.takeLatestHelper, patternOrChannel, worker].concat(args));
}

function throttle(ms, pattern, worker) {
  for (var _len10 = arguments.length, args = Array(_len10 > 3 ? _len10 - 3 : 0), _key10 = 3; _key10 < _len10; _key10++) {
    args[_key10 - 3] = arguments[_key10];
  }

  return fork.apply(undefined, [_sagaHelpers.throttleHelper, ms, pattern, worker].concat(args));
}

var createAsEffectType = function createAsEffectType(type) {
  return function (effect) {
    return effect && effect[IO] && effect[type];
  };
};

var asEffect = exports.asEffect = {
  take: createAsEffectType(TAKE),
  put: createAsEffectType(PUT),
  race: createAsEffectType(RACE),
  call: createAsEffectType(CALL),
  cps: createAsEffectType(CPS),
  fork: createAsEffectType(FORK),
  join: createAsEffectType(JOIN),
  cancel: createAsEffectType(CANCEL),
  select: createAsEffectType(SELECT),
  actionChannel: createAsEffectType(ACTION_CHANNEL),
  cancelled: createAsEffectType(CANCELLED),
  flush: createAsEffectType(FLUSH)
};