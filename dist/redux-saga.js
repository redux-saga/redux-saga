(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["ReduxSaga"] = factory();
	else
		root["ReduxSaga"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.utils = exports.effects = exports.delay = exports.takeLatest = exports.takeEvery = exports.buffers = exports.channel = exports.eventChannel = exports.END = exports.CANCEL = exports.runSaga = undefined;

	var _runSaga = __webpack_require__(9);

	Object.defineProperty(exports, 'runSaga', {
	  enumerable: true,
	  get: function get() {
	    return _runSaga.runSaga;
	  }
	});

	var _proc = __webpack_require__(5);

	Object.defineProperty(exports, 'CANCEL', {
	  enumerable: true,
	  get: function get() {
	    return _proc.CANCEL;
	  }
	});

	var _channel = __webpack_require__(2);

	Object.defineProperty(exports, 'END', {
	  enumerable: true,
	  get: function get() {
	    return _channel.END;
	  }
	});
	Object.defineProperty(exports, 'eventChannel', {
	  enumerable: true,
	  get: function get() {
	    return _channel.eventChannel;
	  }
	});
	Object.defineProperty(exports, 'channel', {
	  enumerable: true,
	  get: function get() {
	    return _channel.channel;
	  }
	});

	var _buffers = __webpack_require__(4);

	Object.defineProperty(exports, 'buffers', {
	  enumerable: true,
	  get: function get() {
	    return _buffers.buffers;
	  }
	});

	var _sagaHelpers = __webpack_require__(10);

	Object.defineProperty(exports, 'takeEvery', {
	  enumerable: true,
	  get: function get() {
	    return _sagaHelpers.takeEvery;
	  }
	});
	Object.defineProperty(exports, 'takeLatest', {
	  enumerable: true,
	  get: function get() {
	    return _sagaHelpers.takeLatest;
	  }
	});

	var _utils = __webpack_require__(1);

	Object.defineProperty(exports, 'delay', {
	  enumerable: true,
	  get: function get() {
	    return _utils.delay;
	  }
	});

	var _middleware = __webpack_require__(8);

	var _middleware2 = _interopRequireDefault(_middleware);

	var _effects = __webpack_require__(6);

	var effects = _interopRequireWildcard(_effects);

	var _utils2 = __webpack_require__(11);

	var utils = _interopRequireWildcard(_utils2);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	exports.default = _middleware2.default;
	exports.effects = effects;
	exports.utils = utils;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	exports.ident = ident;
	exports.check = check;
	exports.remove = remove;
	exports.deferred = deferred;
	exports.arrayOfDeffered = arrayOfDeffered;
	exports.delay = delay;
	exports.createMockTask = createMockTask;
	exports.autoInc = autoInc;
	exports.makeIterator = makeIterator;
	exports.log = log;

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	var sym = exports.sym = function sym(id) {
	  return '@@redux-saga/' + id;
	};
	var TASK = exports.TASK = sym('TASK');
	var MATCH = exports.MATCH = sym('MATCH');
	var konst = exports.konst = function konst(v) {
	  return function () {
	    return v;
	  };
	};
	var kTrue = exports.kTrue = konst(true);
	var kFalse = exports.kFalse = konst(false);
	var noop = exports.noop = function noop() {};
	function ident(v) {
	  return v;
	}

	var isDev = exports.isDev = typeof process !== 'undefined' && process.env && ("development") === 'development';

	function check(value, predicate, error) {
	  if (!predicate(value)) throw new Error(error);
	}

	var is = exports.is = {
	  undef: function undef(v) {
	    return v === null || v === undefined;
	  },
	  notUndef: function notUndef(v) {
	    return v !== null && v !== undefined;
	  },
	  func: function func(f) {
	    return typeof f === 'function';
	  },
	  number: function number(n) {
	    return typeof n === 'number';
	  },
	  array: Array.isArray,
	  promise: function promise(p) {
	    return p && is.func(p.then);
	  },
	  iterator: function iterator(it) {
	    return it && is.func(it.next) && is.func(it.throw);
	  },
	  task: function task(t) {
	    return t && t[TASK];
	  },
	  take: function take(ch) {
	    return ch && is.func(ch.take);
	  },
	  put: function put(ch) {
	    return ch && is.func(ch.put);
	  },
	  observable: function observable(ob) {
	    return ob && is.func(ob.subscribe);
	  },
	  buffer: function buffer(buf) {
	    return buf && is.func(buf.isEmpty) && is.func(buf.take) && is.func(buf.put);
	  },
	  pattern: function pattern(pat) {
	    return pat && (typeof pat === 'string' || is.func(pat) || is.array(pat));
	  }
	};

	function remove(array, item) {
	  var index = array.indexOf(item);
	  if (index >= 0) array.splice(index, 1);
	}

	function deferred() {
	  var props = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	  var def = _extends({}, props);
	  var promise = new Promise(function (resolve, reject) {
	    def.resolve = resolve;
	    def.reject = reject;
	  });
	  def.promise = promise;
	  return def;
	}

	function arrayOfDeffered(length) {
	  var arr = [];
	  for (var i = 0; i < length; i++) {
	    arr.push(deferred());
	  }
	  return arr;
	}

	function delay(ms) {
	  var val = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

	  return new Promise(function (resolve) {
	    return setTimeout(function () {
	      return resolve(val);
	    }, ms);
	  });
	}

	function createMockTask() {
	  var _ref;

	  var running = true;
	  var _result = void 0,
	      _error = void 0;

	  return _ref = {}, _defineProperty(_ref, TASK, true), _defineProperty(_ref, 'isRunning', function isRunning() {
	    return running;
	  }), _defineProperty(_ref, 'result', function result() {
	    return _result;
	  }), _defineProperty(_ref, 'error', function error() {
	    return _error;
	  }), _defineProperty(_ref, 'setRunning', function setRunning(b) {
	    return running = b;
	  }), _defineProperty(_ref, 'setResult', function setResult(r) {
	    return _result = r;
	  }), _defineProperty(_ref, 'setError', function setError(e) {
	    return _error = e;
	  }), _ref;
	}

	function autoInc() {
	  var seed = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

	  return function () {
	    return ++seed;
	  };
	}

	var kThrow = function kThrow(err) {
	  throw err;
	};
	function makeIterator(next) {
	  var thro = arguments.length <= 1 || arguments[1] === undefined ? kThrow : arguments[1];
	  var name = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

	  var iterator = { name: name, next: next, throw: thro };
	  if (typeof Symbol !== 'undefined') {
	    iterator[Symbol.iterator] = function () {
	      return iterator;
	    };
	  }
	  return iterator;
	}

	/**
	  Print error in a useful way whether in a browser environment
	  (with expandable error stack traces), or in a node.js environment
	  (text-only log output)
	 **/
	function log(level, message, error) {
	  /*eslint-disable no-console*/
	  if (typeof window === 'undefined') {
	    console.log('redux-saga ' + level + ': ' + message + '\n' + (error && error.stack || error));
	  } else {
	    console[level].call(console, message, error);
	  }
	}

	var internalErr = exports.internalErr = function internalErr(err) {
	  return new Error('\n  redux-saga: Error checking hooks detected an inconsisten state. This is likely a bug\n  in redux-saga code and not yours. Thanks for reporting this in the project\'s github repo.\n  Error: ' + err + '\n');
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(12)))

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.UNDEFINED_INPUT_ERROR = exports.INVALID_BUFFER = exports.END = undefined;
	exports.emitter = emitter;
	exports.channel = channel;
	exports.eventChannel = eventChannel;

	var _utils = __webpack_require__(1);

	var _buffers = __webpack_require__(4);

	var END = exports.END = { type: '@@redux-saga/CHANNEL_END' };

	function emitter() {

	  var subscribers = [];

	  function subscribe(sub) {
	    subscribers.push(sub);
	    return function () {
	      return (0, _utils.remove)(subscribers, sub);
	    };
	  }

	  function emit(item) {
	    var arr = subscribers.slice();
	    for (var i = 0, len = arr.length; i < len; i++) {
	      arr[i](item);
	    }
	  }

	  return {
	    subscribe: subscribe,
	    emit: emit
	  };
	}

	var INVALID_BUFFER = exports.INVALID_BUFFER = 'invalid buffer passed to channel factory function';
	var UNDEFINED_INPUT_ERROR = exports.UNDEFINED_INPUT_ERROR = '\n  Saga was provided with an undefined action\n  Hints :\n  - check that your Action Creator returns a non undefined value\n  - if the Saga was started using runSaga, check that your subscribe source provides the action to its listeners\n';

	function channel(buffer) {

	  var closed = false;
	  var takers = [];

	  if (arguments.length > 0) {
	    (0, _utils.check)(buffer, _utils.is.buffer, INVALID_BUFFER);
	  } else {
	    buffer = _buffers.buffers.fixed();
	  }

	  function checkForbiddenStates() {
	    if (closed && takers.length) throw (0, _utils.internalErr)('Can not have a closed channel with pending takers');
	    if (takers.length && !buffer.isEmpty()) throw (0, _utils.internalErr)('Can not have pedning takers with non empty buffer');
	  }

	  function put(input) {
	    checkForbiddenStates();
	    (0, _utils.check)(input, _utils.is.notUndef, UNDEFINED_INPUT_ERROR);
	    if (!closed) {
	      if (takers.length) {
	        for (var i = 0; i < takers.length; i++) {
	          var cb = takers[i];
	          if (!cb[_utils.MATCH] || cb[_utils.MATCH](input)) {
	            takers.splice(i, 1);
	            return cb(input);
	          }
	        }
	      } else {
	        buffer.put(input);
	      }
	    }
	  }

	  function take(cb, matcher) {
	    checkForbiddenStates();
	    (0, _utils.check)(cb, _utils.is.func, 'channel.take\'s callback must be a function');
	    if (arguments.length > 1) {
	      (0, _utils.check)(matcher, _utils.is.func, 'channel.take\'s matcher argument must be a function');
	      cb[_utils.MATCH] = matcher;
	    }
	    if (closed && buffer.isEmpty()) cb(END);else if (!buffer.isEmpty()) cb(buffer.take());else {
	      takers.push(cb);
	      cb.cancel = function () {
	        return (0, _utils.remove)(takers, cb);
	      };
	    }
	  }

	  function close() {
	    checkForbiddenStates();
	    if (!closed) {
	      closed = true;
	      if (takers.length) {
	        var arr = takers;
	        takers = [];
	        for (var i = 0, len = arr.length; i < len; i++) {
	          arr[i](END);
	        }
	        takers = [];
	      }
	    }
	  }

	  return { take: take, put: put, close: close,
	    get __takers__() {
	      return takers;
	    },
	    get __closed__() {
	      return closed;
	    }
	  };
	}

	function eventChannel(subscribe) {
	  var buffer = arguments.length <= 1 || arguments[1] === undefined ? _buffers.buffers.none() : arguments[1];
	  var matcher = arguments[2];

	  if (arguments.length > 1) (0, _utils.check)(matcher, _utils.is.func, 'Invalid match function passed to eventChannel');

	  var chan = channel(buffer);
	  var unsubscribe = subscribe(function (input) {
	    if (input === END) chan.close();else if (!matcher || matcher(input)) chan.put(input);
	  });

	  return {
	    take: chan.take,
	    close: function close() {
	      if (!chan.__closed__) {
	        chan.close();
	        unsubscribe();
	      }
	    }
	  };
	}

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.asEffect = undefined;

	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

	exports.take = take;
	exports.takem = takem;
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

	var _utils = __webpack_require__(1);

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

	var effect = function effect(type, payload) {
	  var _ref;

	  return _ref = {}, _defineProperty(_ref, IO, true), _defineProperty(_ref, type, payload), _ref;
	};

	function take(channel, pattern) {
	  if (arguments.length >= 2) {
	    (0, _utils.check)(channel, _utils.is.notUndef, 'take(channel, pattern): channel is undefined');
	    (0, _utils.check)(channel, _utils.is.take, 'take(channel, pattern): argument ' + channel + ' is not a valid channel (channel argument must have a take method)');
	    (0, _utils.check)(pattern, _utils.is.notUndef, 'take(channel, pattern): pattern is undefined');
	    (0, _utils.check)(pattern, _utils.is.pattern, 'take(channel, pattern): argument ' + pattern + ' is not a valid pattern (pattern must be String | Function: a => boolean | Array<String>)');
	  } else if (arguments.length === 1) {
	    (0, _utils.check)(channel, _utils.is.notUndef, 'take(patternOrChannel): undefined argument');
	    if (!_utils.is.take(channel)) {
	      if (_utils.is.pattern(channel)) {
	        pattern = channel;
	        channel = null;
	      } else throw new Error('take(patternOrChannel): argument ' + channel + ' is not valid channel or a valid pattern');
	    } else pattern = '*';
	  } else pattern = '*';

	  return effect(TAKE, { channel: channel, pattern: pattern });
	}

	function takem() {
	  var eff = take.apply(undefined, arguments);
	  eff[TAKE].maybe = true;
	  return eff;
	}

	function put(channel, action) {
	  if (arguments.length > 1) {
	    (0, _utils.check)(channel, _utils.is.notUndef, 'put(channel, action): argument channel is undefined');
	    (0, _utils.check)(channel, _utils.is.put, 'put(channel, action): argument ' + channel + ' is not a valid channel (channel argument must have a put method)');
	    (0, _utils.check)(action, _utils.is.notUndef, 'put(channel, action): argument action is undefined');
	  } else {
	    (0, _utils.check)(channel, _utils.is.notUndef, 'put(action): argument action is undefined');
	    action = channel;
	    channel = null;
	  }
	  return effect(PUT, { channel: channel, action: action });
	}

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
	  var args = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

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

	var isForkedTask = function isForkedTask(task) {
	  return task[_utils.TASK];
	};

	function join(task) {
	  (0, _utils.check)(task, _utils.is.notUndef, 'join(task): argument task is undefined');
	  if (!isForkedTask(task)) throw new Error('join(task): argument ' + task + ' is not a valid Task object \n(HINT: if you are getting this errors in tests, consider using createMockTask from redux-saga/utils)');

	  return effect(JOIN, task);
	}

	function cancel(task) {
	  (0, _utils.check)(task, _utils.is.notUndef, 'cancel(task): argument task is undefined');
	  if (!isForkedTask(task)) throw new Error('cancel(task): argument ' + task + ' is not a valid Task object \n(HINT: if you are getting this errors in tests, consider using createMockTask from redux-saga/utils)');

	  return effect(CANCEL, task);
	}

	function select(selector) {
	  for (var _len5 = arguments.length, args = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
	    args[_key5 - 1] = arguments[_key5];
	  }

	  if (arguments.length === 0) {
	    selector = _utils.ident;
	  } else {
	    (0, _utils.check)(select, _utils.is.notUndef, 'select(selector,[...]): argument selector is undefined');
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
	    (0, _utils.check)(buffer, _utils.is.notUndef, 'actionChannel(pattern, buffer): argument ' + buffer + ' is not a valid buffer');
	  }
	  return effect(ACTION_CHANNEL, { pattern: pattern, buffer: buffer });
	}

	function cancelled() {
	  return effect(CANCELLED, {});
	}

	var asEffect = exports.asEffect = {
	  take: function take(effect) {
	    return effect && effect[IO] && effect[TAKE];
	  },
	  put: function put(effect) {
	    return effect && effect[IO] && effect[PUT];
	  },
	  race: function race(effect) {
	    return effect && effect[IO] && effect[RACE];
	  },
	  call: function call(effect) {
	    return effect && effect[IO] && effect[CALL];
	  },
	  cps: function cps(effect) {
	    return effect && effect[IO] && effect[CPS];
	  },
	  fork: function fork(effect) {
	    return effect && effect[IO] && effect[FORK];
	  },
	  join: function join(effect) {
	    return effect && effect[IO] && effect[JOIN];
	  },
	  cancel: function cancel(effect) {
	    return effect && effect[IO] && effect[CANCEL];
	  },
	  select: function select(effect) {
	    return effect && effect[IO] && effect[SELECT];
	  },
	  actionChannel: function actionChannel(effect) {
	    return effect && effect[IO] && effect[ACTION_CHANNEL];
	  },
	  cancelled: function cancelled(effect) {
	    return effect && effect[IO] && effect[CANCELLED];
	  }
	};

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.buffers = exports.BUFFER_OVERFLOW = undefined;

	var _utils = __webpack_require__(1);

	var BUFFER_OVERFLOW = exports.BUFFER_OVERFLOW = 'Channel\'s Buffer overflow!';

	var ON_OVERFLOW_THROW = 1;
	var ON_OVERFLOW_DROP = 2;
	var ON_OVERFLOW_SLIDE = 3;

	var zeroBuffer = { isEmpty: _utils.kTrue, put: _utils.noop, take: _utils.noop };

	/**
	  TODO: Need to make a more optimized implementation: e.g. Ring buffers, linked lists with Node Object pooling...
	**/
	function arrBuffer() {
	  var limit = arguments.length <= 0 || arguments[0] === undefined ? Infinity : arguments[0];
	  var overflowAction = arguments[1];

	  var arr = [];
	  return {
	    isEmpty: function isEmpty() {
	      return !arr.length;
	    },
	    put: function put(it) {
	      if (arr.length < limit) arr.push(it);else {
	        switch (overflowAction) {
	          case ON_OVERFLOW_THROW:
	            throw new Error(BUFFER_OVERFLOW);
	          case ON_OVERFLOW_SLIDE:
	            arr.shift();
	            arr.push(it);
	            break;
	          default:
	          // DROP
	        }
	      }
	    },
	    take: function take() {
	      return arr.shift();
	    }
	  };
	}

	var buffers = exports.buffers = {
	  none: function none() {
	    return zeroBuffer;
	  },
	  fixed: function fixed(limit) {
	    return arrBuffer(limit, ON_OVERFLOW_THROW);
	  },
	  drop: function drop(limit) {
	    return arrBuffer(limit, ON_OVERFLOW_DROP);
	  },
	  slide: function slide(limit) {
	    return arrBuffer(limit, ON_OVERFLOW_SLIDE);
	  }
	};

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Never = exports.CANCEL = exports.NOT_ITERATOR_ERROR = undefined;
	exports.default = proc;

	var _utils = __webpack_require__(1);

	var _asap = __webpack_require__(7);

	var _asap2 = _interopRequireDefault(_asap);

	var _io = __webpack_require__(3);

	var _channel = __webpack_require__(2);

	var _buffers = __webpack_require__(4);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _defineEnumerableProperties(obj, descs) { for (var key in descs) { var desc = descs[key]; desc.configurable = desc.enumerable = true; if ("value" in desc) desc.writable = true; Object.defineProperty(obj, key, desc); } return obj; }

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	var NOT_ITERATOR_ERROR = exports.NOT_ITERATOR_ERROR = 'proc first argument (Saga function result) must be an iterator';

	var CANCEL = exports.CANCEL = (0, _utils.sym)('cancelPromise');

	var nextEffectId = (0, _utils.autoInc)();
	var Never = exports.Never = {
	  toString: function toString() {
	    return '@@redux-saga/Never';
	  }
	};
	Object.freeze(Never);

	var matchers = {
	  wildcard: function wildcard() {
	    return _utils.kTrue;
	  },
	  default: function _default(pattern) {
	    return function (input) {
	      return input.type === pattern;
	    };
	  },
	  array: function array(patterns) {
	    return function (input) {
	      return patterns.some(function (p) {
	        return p === input.type;
	      });
	    };
	  },
	  predicate: function predicate(_predicate) {
	    return function (input) {
	      return _predicate(input);
	    };
	  }
	};

	function matcher(pattern) {
	  return (pattern === '*' ? matchers.wildcard : _utils.is.array(pattern) ? matchers.array : _utils.is.func(pattern) ? matchers.predicate : matchers.default)(pattern);
	}

	/**
	  Used to track a parent task and its forks
	  In the new fork model, forked tasks are attached by default to their parent
	  We model this using the concept of Parent task && main Task
	  main task is the main flow of the current Generator, the parent tasks is the
	  aggregation of the main tasks + all its forked tasks.
	  Thus the whole model represents an execution tree with multiple branches (vs the
	  linear execution tree in sequential (non parallel) programming)

	  A parent tasks has the following semantics
	  - It completes iff all its forks either complete or all cancelled
	  - If it's cancelled, all forks are cancelled as well
	  - It aborts if any uncaught error bubbles up from forks
	  - If it completes, the return value is the one returned by the main task
	**/
	function forkQueue(name, mainTask, cb) {
	  var tasks = [],
	      result = void 0,
	      completed = false;
	  addTask(mainTask);

	  function addTask(task) {
	    tasks.push(task);
	    task.cont = function (err, res) {
	      if (completed) return;

	      (0, _utils.remove)(tasks, task);
	      task.cont = _utils.noop;
	      if (err) {
	        cancelAll();
	        cb(err);
	      } else {
	        if (task === mainTask) result = res;
	        if (!tasks.length) {
	          completed = true;
	          cb(null, result);
	        }
	      }
	    };
	    //task.cont.cancel = task.cancel
	  }

	  function cancelAll() {
	    if (completed) return;
	    completed = true;
	    tasks.forEach(function (t) {
	      t.cont = _utils.noop;
	      t.cancel();
	    });
	    tasks = [];
	  }

	  return {
	    addTask: addTask,
	    cancelAll: cancelAll,
	    getTasks: function getTasks() {
	      return tasks;
	    },
	    taskNames: function taskNames() {
	      return tasks.map(function (t) {
	        return t.name;
	      });
	    }
	  };
	}

	function proc(iterator) {
	  var subscribe = arguments.length <= 1 || arguments[1] === undefined ? function () {
	    return _utils.noop;
	  } : arguments[1];
	  var dispatch = arguments.length <= 2 || arguments[2] === undefined ? _utils.noop : arguments[2];
	  var getState = arguments.length <= 3 || arguments[3] === undefined ? _utils.noop : arguments[3];
	  var monitor = arguments[4];
	  var parentEffectId = arguments.length <= 5 || arguments[5] === undefined ? 0 : arguments[5];
	  var name = arguments.length <= 6 || arguments[6] === undefined ? 'anonymous' : arguments[6];
	  var cont = arguments[7];


	  (0, _utils.check)(iterator, _utils.is.iterator, NOT_ITERATOR_ERROR);

	  var stdChannel = (0, _channel.eventChannel)(subscribe);
	  /**
	    Tracks the current effect cancellation
	    Each time the generator progresses. calling runEffect will set a new value
	    on it. It allows propagating cancellation to child effects
	  **/
	  next.cancel = _utils.noop;

	  /**
	    Creates a new task descriptor for this generator, We'll also create a main task
	    to track the main flow (besides other forked tasks)
	  **/
	  var task = newTask(parentEffectId, name, iterator, cont);
	  var mainTask = { name: name, cancel: cancelMain, isRunning: true };
	  var taskQueue = forkQueue(name, mainTask, end);

	  /**
	    cancellation of the main task. We'll simply resume the Generator with a Cancel
	  **/
	  function cancelMain() {
	    if (mainTask.isRunning && !mainTask.isCancelled) {
	      mainTask.isCancelled = true;
	      next(null, Never);
	    }
	  }

	  /**
	    This may be called by a parent generator to trigger/propagate cancellation
	    cancel all pending tasks (including the main task), then end the current task.
	      Cancellation propagates down to the whole execution tree holded by this Parent task
	    It's also propagated to all joiners of this task and their execution tree/joiners
	      Cancellation is noop for terminated/Cancelled tasks tasks
	  **/
	  function cancel() {
	    /**
	      We need to check both Running and Cancelled status
	      Tasks can be Cancelled but still Running
	    **/
	    if (iterator._isRunning && !iterator._isCancelled) {
	      iterator._isCancelled = true;
	      taskQueue.cancelAll();
	      /**
	        Ending with a Never result will propagate the Cancellation to all joiners
	      **/
	      end(null, Never);
	    }
	  }
	  /**
	    attaches cancellation logic to this task's continuation
	    this will permit cancellation to propagate down the call chain
	  **/
	  cont && (cont.cancel = cancel);

	  // tracks the running status
	  iterator._isRunning = true;

	  // kicks up the generator
	  next();

	  // then return the task descriptor to the caller
	  return task;

	  /**
	    This is the generator driver
	    It's a recursive async/continuation function which calls itself
	    until the generator terminates or throws
	  **/
	  function next(error, arg) {
	    // Preventive measure. If we end up here, then there is really something wrong
	    if (!mainTask.isRunning) throw new Error('Trying to resume an already finished generator');

	    try {
	      var result = void 0;
	      if (error) result = iterator.throw(error);else if (arg === Never) {
	        /**
	          getting Never autoamtically cancels the main task
	          We can get this value here
	            - By cancelling the parent task manually
	          - By joining a Cancelled task
	          - By taking from a channel that ended using `take` (and not `takem` used to trap End of channels)
	        **/
	        mainTask.isCancelled = true;
	        /**
	          Cancels the current effect; this will propagate the cancellation down to any called tasks
	        **/
	        next.cancel();
	        /**
	          If this Generator has a `return` method then invokes it
	          Thill will jump to the finally block
	        **/
	        result = _utils.is.func(iterator.return) ? iterator.return(Never) : { done: true, value: Never };
	      } else result = iterator.next(arg);

	      if (!result.done) {
	        runEffect(result.value, parentEffectId, '', next);
	      } else {
	        /**
	          This Generator has ended, terminate the main task and notify the fork queue
	        **/
	        mainTask.isMainRunning = false;
	        mainTask.cont && mainTask.cont(null, result.value);
	      }
	    } catch (error) {
	      if (mainTask.isCancelled) (0, _utils.log)('error', 'uncaught at ' + name, error.message);
	      mainTask.isMainRunning = false;
	      mainTask.cont(error);
	    }
	  }

	  function end(error, result) {
	    iterator._isRunning = false;
	    stdChannel.close();
	    if (!error) {
	      if (result === Never && _utils.isDev) (0, _utils.log)('info', name + ' has been cancelled', '');
	      iterator._result = result;
	      iterator._deferredEnd && iterator._deferredEnd.resolve(result);
	    } else {
	      if (error instanceof Error) error.sagaStack = 'at ' + name + ' \n ' + (error.sagaStack || error.message);
	      if (!task.cont) (0, _utils.log)('error', 'uncaught', error.sagaStack || error.message);
	      iterator._error = error;
	      iterator._deferredEnd && iterator._deferredEnd.reject(error);
	    }
	    task.cont && task.cont(error, result);
	    task.joiners.forEach(function (j) {
	      return j.cb(error, result);
	    });
	    task.joiners = null;
	  }

	  function runEffect(effect, parentEffectId) {
	    var label = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];
	    var cb = arguments[3];

	    var effectId = nextEffectId();
	    monitor && monitor.effectTriggered({ effectId: effectId, parentEffectId: parentEffectId, label: label, effect: effect });

	    /**
	      completion callback and cancel callback are mutually exclusive
	      We can't cancel an already completed effect
	      And We can't complete an already cancelled effectId
	    **/
	    var effectSettled = void 0;

	    // Completion callback passed to the appropriate effect runner
	    function currCb(err, res) {
	      if (effectSettled) return;

	      effectSettled = true;
	      cb.cancel = _utils.noop; // defensive measure
	      if (monitor) {
	        err ? monitor.effectRejected(effectId, err) : monitor.effectResolved(effectId, res);
	      }

	      cb(err, res);
	    }
	    // tracks down the current cancel
	    currCb.cancel = _utils.noop;

	    // setup cancellation logic on the parent cb
	    cb.cancel = function () {
	      // prevents cancelling an already completed effect
	      if (effectSettled) return;

	      effectSettled = true;
	      /**
	        propagates cancel downward
	        catch uncaught cancellations errors; since we can no longer call the completion
	        callback, log errors raised during cancellations into the console
	      **/
	      try {
	        currCb.cancel();
	      } catch (err) {
	        (0, _utils.log)('error', 'uncaught at ' + name, err.message);
	      }
	      currCb.cancel = _utils.noop; // defensive measure

	      monitor && monitor.effectCancelled(effectId);
	    };

	    /**
	      each effect runner must attach its own logic of cancellation to the provided callback
	      it allows this generator to propagate cancellation downward.
	        ATTENTION! effect runners must setup the cancel logic by setting cb.cancel = [cancelMethod]
	      And the setup must occur before calling the callback
	        This is a sort of inversion of control: called async functions are responsible
	      of completing the flow by calling the provided continuation; while caller functions
	      are responsible for aborting the current flow by calling the attached cancel function
	        Library users can attach their own cancellation logic to promises by defining a
	      promise[CANCEL] method in their returned promises
	      ATTENTION! calling cancel must have no effect on an already completed or cancelled effect
	    **/
	    var data = void 0;
	    return(
	      // Non declarative effect
	      _utils.is.promise(effect) ? resolvePromise(effect, currCb) : _utils.is.iterator(effect) ? resolveIterator(effect, effectId, name, currCb)

	      // declarative effects
	      : _utils.is.array(effect) ? runParallelEffect(effect, effectId, currCb) : _utils.is.notUndef(data = _io.asEffect.take(effect)) ? runTakeEffect(data, currCb) : _utils.is.notUndef(data = _io.asEffect.put(effect)) ? runPutEffect(data, currCb) : _utils.is.notUndef(data = _io.asEffect.race(effect)) ? runRaceEffect(data, effectId, currCb) : _utils.is.notUndef(data = _io.asEffect.call(effect)) ? runCallEffect(data, effectId, currCb) : _utils.is.notUndef(data = _io.asEffect.cps(effect)) ? runCPSEffect(data, currCb) : _utils.is.notUndef(data = _io.asEffect.fork(effect)) ? runForkEffect(data, effectId, currCb) : _utils.is.notUndef(data = _io.asEffect.join(effect)) ? runJoinEffect(data, currCb) : _utils.is.notUndef(data = _io.asEffect.cancel(effect)) ? runCancelEffect(data, currCb) : _utils.is.notUndef(data = _io.asEffect.select(effect)) ? runSelectEffect(data, currCb) : _utils.is.notUndef(data = _io.asEffect.actionChannel(effect)) ? runChannelEffect(data, currCb) : _utils.is.notUndef(data = _io.asEffect.cancelled(effect)) ? runCancelledEffect(data, currCb) : /* anything else returned as is        */currCb(null, effect)
	    );
	  }

	  function resolvePromise(promise, cb) {
	    var cancelPromise = promise[CANCEL];
	    if (typeof cancelPromise === 'function') {
	      cb.cancel = cancelPromise;
	    }
	    promise.then(function (result) {
	      return cb(null, result);
	    }, function (error) {
	      return cb(error);
	    });
	  }

	  function resolveIterator(iterator, effectId, name, cb) {
	    proc(iterator, subscribe, dispatch, getState, monitor, effectId, name, cb);
	  }

	  function runTakeEffect(_ref, cb) {
	    var channel = _ref.channel;
	    var pattern = _ref.pattern;
	    var maybe = _ref.maybe;

	    channel = channel || stdChannel;
	    var takeCb = function takeCb(inp) {
	      return inp instanceof Error ? cb(inp) : inp === _channel.END && !maybe ? cb(null, Never) : cb(null, inp);
	    };
	    try {
	      channel.take(takeCb, matcher(pattern));
	    } catch (err) {
	      return cb(err);
	    }
	    cb.cancel = takeCb.cancel;
	  }

	  function runPutEffect(_ref2, cb) {
	    var channel = _ref2.channel;
	    var action = _ref2.action;

	    /*
	      Use a reentrant lock `asap` to flatten all nested dispatches
	      If this put cause another Saga to take this action an then immediately
	      put an action that will be taken by this Saga. Then the outer Saga will miss
	      the action from the inner Saga b/c this put has not yet returned.
	    */
	    (0, _asap2.default)(function () {
	      var result = void 0;
	      try {
	        result = (channel ? channel.put : dispatch)(action);
	      } catch (error) {
	        return cb(error);
	      }

	      if (_utils.is.promise(result)) {
	        resolvePromise(result, cb);
	      } else {
	        return cb(null, result);
	      }
	    });
	    // Put effects are non cancellables
	  }

	  function runCallEffect(_ref3, effectId, cb) {
	    var context = _ref3.context;
	    var fn = _ref3.fn;
	    var args = _ref3.args;

	    var result = void 0;
	    // catch synchronous failures; see #152
	    try {
	      result = fn.apply(context, args);
	    } catch (error) {
	      return cb(error);
	    }
	    return _utils.is.promise(result) ? resolvePromise(result, cb) : _utils.is.iterator(result) ? resolveIterator(result, effectId, fn.name, cb) : cb(null, result);
	  }

	  function runCPSEffect(_ref4, cb) {
	    var context = _ref4.context;
	    var fn = _ref4.fn;
	    var args = _ref4.args;

	    // CPS (ie node style functions) can define their own cancellation logic
	    // by setting cancel field on the cb

	    // catch synchronous failures; see #152
	    try {
	      fn.apply(context, args.concat(cb));
	    } catch (error) {
	      return cb(error);
	    }
	  }

	  function runForkEffect(_ref5, effectId, cb) {
	    var context = _ref5.context;
	    var fn = _ref5.fn;
	    var args = _ref5.args;
	    var detached = _ref5.detached;

	    var result = void 0,
	        error = void 0,
	        _iterator = void 0;

	    // we run the function, next we'll check if this is a generator function
	    // (generator is a function that returns an iterator)

	    // catch synchronous failures; see #152
	    try {
	      result = fn.apply(context, args);
	    } catch (err) {
	      if (!detached) return cb(err);else error = err;
	    }

	    // A generator function: i.e. returns an iterator
	    if (_utils.is.iterator(result)) {
	      _iterator = result;
	    }

	    //simple effect: wrap in a generator
	    // do not bubble up synchronous failures for detached forks, instead create a failed task. See #152
	    else {
	        _iterator = error ? (0, _utils.makeIterator)(function () {
	          throw error;
	        }) : (0, _utils.makeIterator)(function () {
	          var pc = void 0;
	          var eff = { done: false, value: result };
	          var ret = function ret(value) {
	            return { done: true, value: value };
	          };
	          return function (arg) {
	            if (!pc) {
	              pc = true;
	              return eff;
	            } else {
	              return ret(arg);
	            }
	          };
	        }());
	      }

	    var task = proc(_iterator, subscribe, dispatch, getState, monitor, effectId, fn.name, detached ? null : _utils.noop);
	    if (!detached) {
	      if (_iterator._isRunning) taskQueue.addTask(task);else if (_iterator._error) return cb(_iterator._error);
	    }
	    cb(null, task);
	    // Fork effects are non cancellables
	  }

	  function runJoinEffect(t, cb) {
	    if (t.isRunning()) {
	      (function () {
	        var joiner = { task: task, cb: cb };
	        cb.cancel = function () {
	          return (0, _utils.remove)(t.joiners, joiner);
	        };
	        t.joiners.push(joiner);
	      })();
	    } else {
	      cb(t.error(), t.result());
	    }
	  }

	  function runCancelEffect(task, cb) {
	    if (task.isRunning()) {
	      task.cancel();
	    }
	    cb();
	    // cancel effects are non cancellables
	  }

	  function runParallelEffect(effects, effectId, cb) {
	    if (!effects.length) {
	      cb(null, []);
	      return;
	    }

	    var completedCount = 0;
	    var completed = void 0;
	    var results = Array(effects.length);

	    function checkEffectEnd() {
	      if (completedCount === results.length) {
	        completed = true;
	        cb(null, results);
	      }
	    }

	    var childCbs = effects.map(function (eff, idx) {
	      var chCbAtIdx = function chCbAtIdx(err, res) {
	        if (completed) return;
	        if (err || res === _channel.END || res === Never) {
	          cb.cancel();
	          err ? cb(err) : cb(null, res);
	        } else {
	          results[idx] = res;
	          completedCount++;
	          checkEffectEnd();
	        }
	      };
	      chCbAtIdx.cancel = _utils.noop;
	      return chCbAtIdx;
	    });

	    cb.cancel = function () {
	      if (!completed) {
	        completed = true;
	        childCbs.forEach(function (chCb) {
	          return chCb.cancel();
	        });
	      }
	    };

	    effects.forEach(function (eff, idx) {
	      return runEffect(eff, effectId, idx, childCbs[idx]);
	    });
	  }

	  function runRaceEffect(effects, effectId, cb) {
	    var completed = void 0;
	    var keys = Object.keys(effects);
	    var childCbs = {};

	    keys.forEach(function (key) {
	      var chCbAtKey = function chCbAtKey(err, res) {
	        if (completed) return;

	        if (err) {
	          // Race Auto cancellation
	          cb.cancel();
	          cb(err);
	        } else if (res !== _channel.END && res !== Never) {
	          cb.cancel();
	          completed = true;
	          cb(null, _defineProperty({}, key, res));
	        }
	      };
	      chCbAtKey.cancel = _utils.noop;
	      childCbs[key] = chCbAtKey;
	    });

	    cb.cancel = function () {
	      // prevents unnecessary cancellation
	      if (!completed) {
	        completed = true;
	        keys.forEach(function (key) {
	          return childCbs[key].cancel();
	        });
	      }
	    };
	    keys.forEach(function (key) {
	      return runEffect(effects[key], effectId, key, childCbs[key]);
	    });
	  }

	  function runSelectEffect(_ref6, cb) {
	    var selector = _ref6.selector;
	    var args = _ref6.args;

	    try {
	      var state = selector.apply(undefined, [getState()].concat(_toConsumableArray(args)));
	      cb(null, state);
	    } catch (error) {
	      cb(error);
	    }
	  }

	  function runChannelEffect(_ref7, cb) {
	    var pattern = _ref7.pattern;
	    var buffer = _ref7.buffer;

	    var match = matcher(pattern);
	    match.pattern = pattern;
	    cb(null, (0, _channel.eventChannel)(subscribe, buffer || _buffers.buffers.fixed(), match));
	  }

	  function runCancelledEffect(data, cb) {
	    cb(null, !!mainTask.isCancelled);
	  }

	  function newTask(id, name, iterator, cont) {
	    var _done, _ref8, _mutatorMap;

	    iterator._deferredEnd = null;
	    return _ref8 = {}, _defineProperty(_ref8, _utils.TASK, true), _defineProperty(_ref8, 'id', id), _defineProperty(_ref8, 'name', name), _done = 'done', _mutatorMap = {}, _mutatorMap[_done] = _mutatorMap[_done] || {}, _mutatorMap[_done].get = function () {
	      if (iterator._deferredEnd) return iterator._deferredEnd.promise;else {
	        var def = (0, _utils.deferred)();
	        iterator._deferredEnd = def;
	        if (!iterator._isRunning) iterator._error ? def.reject(iterator._error) : def.resolve(iterator._result);
	        return def.promise;
	      }
	    }, _defineProperty(_ref8, 'cont', cont), _defineProperty(_ref8, 'joiners', []), _defineProperty(_ref8, 'cancel', cancel), _defineProperty(_ref8, 'isRunning', function isRunning() {
	      return iterator._isRunning;
	    }), _defineProperty(_ref8, 'isCancelled', function isCancelled() {
	      return iterator._isCancelled;
	    }), _defineProperty(_ref8, 'result', function result() {
	      return iterator._result;
	    }), _defineProperty(_ref8, 'error', function error() {
	      return iterator._error;
	    }), _defineEnumerableProperties(_ref8, _mutatorMap), _ref8;
	  }
	}

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _io = __webpack_require__(3);

	Object.defineProperty(exports, 'take', {
	  enumerable: true,
	  get: function get() {
	    return _io.take;
	  }
	});
	Object.defineProperty(exports, 'takem', {
	  enumerable: true,
	  get: function get() {
	    return _io.takem;
	  }
	});
	Object.defineProperty(exports, 'put', {
	  enumerable: true,
	  get: function get() {
	    return _io.put;
	  }
	});
	Object.defineProperty(exports, 'race', {
	  enumerable: true,
	  get: function get() {
	    return _io.race;
	  }
	});
	Object.defineProperty(exports, 'call', {
	  enumerable: true,
	  get: function get() {
	    return _io.call;
	  }
	});
	Object.defineProperty(exports, 'apply', {
	  enumerable: true,
	  get: function get() {
	    return _io.apply;
	  }
	});
	Object.defineProperty(exports, 'cps', {
	  enumerable: true,
	  get: function get() {
	    return _io.cps;
	  }
	});
	Object.defineProperty(exports, 'fork', {
	  enumerable: true,
	  get: function get() {
	    return _io.fork;
	  }
	});
	Object.defineProperty(exports, 'spawn', {
	  enumerable: true,
	  get: function get() {
	    return _io.spawn;
	  }
	});
	Object.defineProperty(exports, 'join', {
	  enumerable: true,
	  get: function get() {
	    return _io.join;
	  }
	});
	Object.defineProperty(exports, 'cancel', {
	  enumerable: true,
	  get: function get() {
	    return _io.cancel;
	  }
	});
	Object.defineProperty(exports, 'select', {
	  enumerable: true,
	  get: function get() {
	    return _io.select;
	  }
	});
	Object.defineProperty(exports, 'actionChannel', {
	  enumerable: true,
	  get: function get() {
	    return _io.actionChannel;
	  }
	});
	Object.defineProperty(exports, 'cancelled', {
	  enumerable: true,
	  get: function get() {
	    return _io.cancelled;
	  }
	});

/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = asap;
	var queue = [];
	var isSuspended = false;

	function asap(task) {
	  if (!isSuspended) {
	    isSuspended = true;
	    queue.push(task);
	    asap.flush();
	  } else {
	    queue.push(task);
	  }
	}

	asap.suspend = function () {
	  return isSuspended = true;
	};
	asap.flush = function () {
	  var nextTask = void 0;
	  while (nextTask = queue.shift()) {
	    nextTask();
	  }
	  isSuspended = false;
	};

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = sagaMiddlewareFactory;

	var _utils = __webpack_require__(1);

	var _proc = __webpack_require__(5);

	var _proc2 = _interopRequireDefault(_proc);

	var _channel = __webpack_require__(2);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function sagaMiddlewareFactory() {
	  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	  var runSagaDynamically = void 0;

	  if (_utils.is.func(options)) {
	    throw new Error('You passed a function to the Saga middleware. You are likely trying to start a    Saga by directly passing it to the middleware. This is no longer possible starting from 0.10.0.    To run a Saga, you must do it dynamically AFTER mounting the middleware into the store.\n    Example:\n      import createSagaMiddleware from \'redux-saga\'\n      ... other imports\n\n      const sagaMiddleware = createSagaMiddleware()\n      const store = createStore(reducer, applyMiddleware(sagaMiddleware))\n      sagaMiddleware.run(saga, ...args)\n    ');
	  }

	  function sagaMiddleware(_ref) {
	    var getState = _ref.getState;
	    var dispatch = _ref.dispatch;

	    runSagaDynamically = runSaga;
	    var sagaEmitter = (0, _channel.emitter)();

	    function runSaga(saga) {
	      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	        args[_key - 1] = arguments[_key];
	      }

	      return (0, _proc2.default)(saga.apply(undefined, args), sagaEmitter.subscribe, dispatch, getState, options.sagaMonitor, 0, saga.name);
	    }

	    return function (next) {
	      return function (action) {
	        var result = next(action); // hit reducers
	        sagaEmitter.emit(action);
	        return result;
	      };
	    };
	  }

	  sagaMiddleware.run = function (saga) {
	    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
	      args[_key2 - 1] = arguments[_key2];
	    }

	    (0, _utils.check)(runSagaDynamically, _utils.is.notUndef, 'Before running a Saga, you must mount the Saga middleware on the Store using applyMiddleware');
	    (0, _utils.check)(saga, _utils.is.func, 'sagaMiddleware.run(saga, ...args): saga argument must be a Generator function!');
	    return runSagaDynamically.apply(undefined, [saga].concat(args));
	  };

	  return sagaMiddleware;
	}

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.runSaga = runSaga;

	var _utils = __webpack_require__(1);

	var _proc = __webpack_require__(5);

	var _proc2 = _interopRequireDefault(_proc);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function runSaga(iterator, _ref, monitor) {
	  var subscribe = _ref.subscribe;
	  var dispatch = _ref.dispatch;
	  var getState = _ref.getState;


	  (0, _utils.check)(iterator, _utils.is.iterator, "runSaga must be called on an iterator");

	  return (0, _proc2.default)(iterator, subscribe, dispatch, getState, monitor);
	}

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

	exports.takeEvery = takeEvery;
	exports.takeLatest = takeLatest;

	var _channel = __webpack_require__(2);

	var _utils = __webpack_require__(1);

	var _io = __webpack_require__(3);

	var done = { done: true, value: undefined };
	var qEnd = {};

	function fsmIterator(fsm, q0) {
	  var name = arguments.length <= 2 || arguments[2] === undefined ? 'iterator' : arguments[2];

	  var updateState = void 0,
	      qNext = q0;

	  function next(arg, error) {
	    if (qNext === qEnd) return done;

	    if (error) {
	      qNext = qEnd;
	      throw error;
	    } else {
	      updateState && updateState(arg);

	      var _fsm$qNext = fsm[qNext]();

	      var _fsm$qNext2 = _slicedToArray(_fsm$qNext, 3);

	      var q = _fsm$qNext2[0];
	      var output = _fsm$qNext2[1];
	      var _updateState = _fsm$qNext2[2];

	      qNext = q;
	      updateState = _updateState;
	      return qNext === qEnd ? done : output;
	    }
	  }

	  return (0, _utils.makeIterator)(next, function (error) {
	    return next(null, error);
	  }, name);
	}

	function takeEvery(pattern, worker) {
	  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
	    args[_key - 2] = arguments[_key];
	  }

	  var yTake = { done: false, value: (0, _io.take)(pattern) };
	  var yFork = function yFork(ac) {
	    return { done: false, value: _io.fork.apply(undefined, [worker].concat(args, [ac])) };
	  };

	  var action = void 0,
	      setAction = function setAction(ac) {
	    return action = ac;
	  };
	  return fsmIterator({
	    q1: function q1() {
	      return ['q2', yTake, setAction];
	    },
	    q2: function q2() {
	      return action === _channel.END ? [qEnd] : ['q1', yFork(action)];
	    }
	  }, 'q1', 'takeEvery(' + String(pattern) + ', ' + worker.name + ')');
	}

	function takeLatest(pattern, worker) {
	  for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
	    args[_key2 - 2] = arguments[_key2];
	  }

	  var yTake = { done: false, value: (0, _io.take)(pattern) };
	  var yFork = function yFork(ac) {
	    return { done: false, value: _io.fork.apply(undefined, [worker].concat(args, [ac])) };
	  };
	  var yCancel = function yCancel(task) {
	    return { done: false, value: (0, _io.cancel)(task) };
	  };

	  var task = void 0,
	      action = void 0;
	  var setTask = function setTask(t) {
	    return task = t;
	  };
	  var setAction = function setAction(ac) {
	    return action = ac;
	  };
	  return fsmIterator({
	    q1: function q1() {
	      return ['q2', yTake, setAction];
	    },
	    q2: function q2() {
	      return action === _channel.END ? [qEnd] : task ? ['q3', yCancel(task)] : ['q1', yFork(action), setTask];
	    },
	    q3: function q3() {
	      return ['q1', yFork(action), setTask];
	    }
	  }, 'q1', 'takeLatest(' + String(pattern) + ', ' + worker.name + ')');
	}

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _utils = __webpack_require__(1);

	Object.defineProperty(exports, 'TASK', {
	  enumerable: true,
	  get: function get() {
	    return _utils.TASK;
	  }
	});
	Object.defineProperty(exports, 'noop', {
	  enumerable: true,
	  get: function get() {
	    return _utils.noop;
	  }
	});
	Object.defineProperty(exports, 'is', {
	  enumerable: true,
	  get: function get() {
	    return _utils.is;
	  }
	});
	Object.defineProperty(exports, 'deferred', {
	  enumerable: true,
	  get: function get() {
	    return _utils.deferred;
	  }
	});
	Object.defineProperty(exports, 'arrayOfDeffered', {
	  enumerable: true,
	  get: function get() {
	    return _utils.arrayOfDeffered;
	  }
	});
	Object.defineProperty(exports, 'createMockTask', {
	  enumerable: true,
	  get: function get() {
	    return _utils.createMockTask;
	  }
	});

	var _io = __webpack_require__(3);

	Object.defineProperty(exports, 'asEffect', {
	  enumerable: true,
	  get: function get() {
	    return _io.asEffect;
	  }
	});

/***/ },
/* 12 */
/***/ function(module, exports) {

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ }
/******/ ])
});
;