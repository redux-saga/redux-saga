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
	exports.utils = exports.effects = exports.takeLatest = exports.takeEvery = exports.eventChannel = exports.channel = exports.END = exports.CANCEL = exports.runSaga = exports.isCancelError = exports.SagaCancellationException = undefined;

	var _runSaga = __webpack_require__(10);

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

	var _channel = __webpack_require__(3);

	Object.defineProperty(exports, 'END', {
	  enumerable: true,
	  get: function get() {
	    return _channel.END;
	  }
	});
	Object.defineProperty(exports, 'channel', {
	  enumerable: true,
	  get: function get() {
	    return _channel.channel;
	  }
	});
	Object.defineProperty(exports, 'eventChannel', {
	  enumerable: true,
	  get: function get() {
	    return _channel.eventChannel;
	  }
	});

	var _sagaHelpers = __webpack_require__(11);

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

	var _middleware = __webpack_require__(9);

	var _middleware2 = _interopRequireDefault(_middleware);

	var _SagaCancellationException2 = __webpack_require__(2);

	var _SagaCancellationException3 = _interopRequireDefault(_SagaCancellationException2);

	var _effects = __webpack_require__(7);

	var effects = _interopRequireWildcard(_effects);

	var _utils = __webpack_require__(13);

	var utils = _interopRequireWildcard(_utils);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	exports.default = _middleware2.default;
	var SagaCancellationException = exports.SagaCancellationException = _SagaCancellationException3.default;
	var isCancelError = exports.isCancelError = function isCancelError(error) {
	  return error instanceof SagaCancellationException;
	};

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
	exports.autoInc = autoInc;
	exports.makeIterator = makeIterator;
	exports.log = log;
	var sym = exports.sym = function sym(id) {
	  return '@@redux-saga/' + id;
	};
	var TASK = exports.TASK = sym('TASK');
	var kTrue = exports.kTrue = function kTrue() {
	  return true;
	};
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
	  array: Array.isArray,
	  promise: function promise(p) {
	    return p && is.func(p.then);
	  },
	  iterator: function iterator(it) {
	    return it && is.func(it.next) && is.func(it.throw);
	  },
	  task: function task(it) {
	    return it && it[TASK];
	  },
	  channel: function channel(it) {
	    return is.func(it.take);
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
	  return new Promise(function (resolve) {
	    return setTimeout(resolve, ms);
	  });
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
	    console.log('redux-saga ' + level + ': ' + message + '\n' + (error.stack || error));
	  } else {
	    console[level].call(console, message, error);
	  }
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)))

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = SagaCancellationException;

	/**
	* Creates an instance of a cancellation error
	* used internally by the Library to handle Cancellations effects
	* params:
	*    type: PARALLEL_AUTO_CANCEL | RACE_AUTO_CANCEL | MANUAL_CANCEL
	*    saga: current saga where the cancellation is to be thrown
	*    origin: Origin saga from which the cancellation originated
	*/

	function SagaCancellationException(type, saga, origin) {
	  var message = 'SagaCancellationException; type: ' + type + ', saga: ' + saga + ', origin: ' + origin;

	  this.name = 'SagaCancellationException';
	  this.message = message;
	  this.type = type;
	  this.saga = saga;
	  this.origin = origin;
	  this.stack = new Error().stack;
	}
	SagaCancellationException.prototype = Object.create(Error.prototype);
	SagaCancellationException.prototype.constructor = SagaCancellationException;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.UNDEFINED_INPUT_ERROR = exports.END = undefined;
	exports.emitter = emitter;
	exports.channel = channel;
	exports.eventChannel = eventChannel;

	var _utils = __webpack_require__(1);

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

	var UNDEFINED_INPUT_ERROR = exports.UNDEFINED_INPUT_ERROR = '\n  Saga was provided with an undefined action\n  Hints :\n  - check that your Action Creator returns a non undefined value\n  - if the Saga was started using runSaga, check that your subscribe source provides the action to its listeners\n';

	function channel() {

	  var closed = false;
	  var cbs = [];

	  function put(input) {
	    if (input === undefined) throw new Error(UNDEFINED_INPUT_ERROR);else if (closed) return;

	    var isError = input instanceof Error;
	    closed = input === END || isError;
	    if (closed) {
	      var arr = cbs;
	      cbs = null;
	      for (var i = 0, len = arr.length; i < len; i++) {
	        var cb = arr[i];
	        isError ? cb(input) : cb(null, input);
	      }
	    } else {
	      var arr = cbs;
	      cbs = [];
	      for (var i = 0, len = arr.length; i < len; i++) {
	        var cb = arr[i];
	        if (cb.match(input)) {
	          cb(null, input);
	        } else cbs.push(cb);
	      }
	    }
	  }

	  function take(pattern, cb) {
	    if (arguments.length === 1) {
	      cb = pattern;
	      pattern = '*';
	    }
	    (0, _utils.check)(cb, _utils.is.func, 'channel\'s take 2nd argument must be a function');
	    if (closed) return cb(null, END);
	    cb.match = matcher(pattern);
	    cb.pattern = pattern;
	    cbs.push(cb);
	    cb.cancel = function () {
	      return (0, _utils.remove)(cbs, cb);
	    };
	  }

	  return {
	    take: take,
	    put: put,
	    close: function close() {
	      return put(END);
	    }
	  };
	}

	function eventChannel(subscribe) {
	  var chan = channel();
	  var unsubscribe = subscribe(chan.put);

	  return {
	    take: chan.take,
	    close: function close() {
	      chan.close();
	      unsubscribe();
	    }
	  };
	}

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.asEffect = exports.SELECT_ARG_ERROR = exports.UNDEFINED_PATTERN_OR_CHANNEL = exports.INAVLID_CHANNEL = exports.UNDEFINED_CHANNEL = exports.CANCEL_ARG_ERROR = exports.JOIN_ARG_ERROR = exports.FORK_ARG_ERROR = exports.CALL_FUNCTION_ARG_ERROR = undefined;

	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

	exports.take = take;
	exports.put = put;
	exports.race = race;
	exports.call = call;
	exports.apply = apply;
	exports.cps = cps;
	exports.fork = fork;
	exports.join = join;
	exports.cancel = cancel;
	exports.select = select;

	var _utils = __webpack_require__(1);

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	var CALL_FUNCTION_ARG_ERROR = exports.CALL_FUNCTION_ARG_ERROR = "call/cps/fork first argument must be a function, an array [context, function] or an object {context, fn}";
	var FORK_ARG_ERROR = exports.FORK_ARG_ERROR = "fork first argument must be a generator function or an iterator";
	var JOIN_ARG_ERROR = exports.JOIN_ARG_ERROR = "join argument must be a valid task (a result of a fork)";
	var CANCEL_ARG_ERROR = exports.CANCEL_ARG_ERROR = "cancel argument must be a valid task (a result of a fork)";
	var UNDEFINED_CHANNEL = exports.UNDEFINED_CHANNEL = "Undefined channel passed to `take`";
	var INAVLID_CHANNEL = exports.INAVLID_CHANNEL = "Invalid channel passed to take (a channel must have a `take` method)";
	var UNDEFINED_PATTERN_OR_CHANNEL = exports.UNDEFINED_PATTERN_OR_CHANNEL = "Undefined pattern/channel passed to `take` (HINT: check if you didn't mispell a constant or a property)";
	var SELECT_ARG_ERROR = exports.SELECT_ARG_ERROR = "select first argument must be a function";

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

	var effect = function effect(type, payload) {
	  var _ref;

	  return _ref = {}, _defineProperty(_ref, IO, true), _defineProperty(_ref, type, payload), _ref;
	};

	function take(channel, pattern) {
	  if (arguments.length >= 2) {
	    if (_utils.is.undef(channel)) throw new Error(UNDEFINED_CHANNEL);else if (!_utils.is.channel(channel)) throw new Error(INAVLID_CHANNEL);
	  } else if (arguments.length === 1) {
	    (0, _utils.check)(channel, _utils.is.notUndef, UNDEFINED_PATTERN_OR_CHANNEL);
	    if (!_utils.is.channel(channel)) {
	      pattern = channel;
	      channel = null;
	    }
	  } else {
	    pattern = '*';
	  }

	  return effect(TAKE, { channel: channel, pattern: pattern });
	}

	function put(action) {
	  return effect(PUT, action);
	}

	function race(effects) {
	  return effect(RACE, effects);
	}

	function getFnCallDesc(fn, args) {
	  (0, _utils.check)(fn, _utils.is.notUndef, CALL_FUNCTION_ARG_ERROR);

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
	  (0, _utils.check)(fn, _utils.is.func, CALL_FUNCTION_ARG_ERROR);

	  return { context: context, fn: fn, args: args };
	}

	function call(fn) {
	  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	    args[_key - 1] = arguments[_key];
	  }

	  return effect(CALL, getFnCallDesc(fn, args));
	}

	function apply(context, fn) {
	  var args = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

	  return effect(CALL, getFnCallDesc({ context: context, fn: fn }, args));
	}

	function cps(fn) {
	  for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
	    args[_key2 - 1] = arguments[_key2];
	  }

	  return effect(CPS, getFnCallDesc(fn, args));
	}

	function fork(fn) {
	  for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
	    args[_key3 - 1] = arguments[_key3];
	  }

	  return effect(FORK, getFnCallDesc(fn, args));
	}

	fork.detached = function (fn) {
	  for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
	    args[_key4 - 1] = arguments[_key4];
	  }

	  var eff = fork.apply(undefined, [fn].concat(args));
	  eff[FORK].detached = true;
	  return eff;
	};

	var isForkedTask = function isForkedTask(task) {
	  return task[_utils.TASK];
	};

	function join(taskDesc) {
	  if (!isForkedTask(taskDesc)) throw new Error(JOIN_ARG_ERROR);

	  return effect(JOIN, taskDesc);
	}

	function cancel(taskDesc) {
	  if (!isForkedTask(taskDesc)) throw new Error(CANCEL_ARG_ERROR);

	  return effect(CANCEL, taskDesc);
	}

	function select(selector) {
	  for (var _len5 = arguments.length, args = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
	    args[_key5 - 1] = arguments[_key5];
	  }

	  if (arguments.length === 0) {
	    selector = _utils.ident;
	  } else {
	    (0, _utils.check)(selector, _utils.is.func, SELECT_ARG_ERROR);
	  }
	  return effect(SELECT, { selector: selector, args: args });
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
	  }
	};

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.MANUAL_CANCEL = exports.FORK_AUTO_CANCEL = exports.RACE_AUTO_CANCEL = exports.PARALLEL_AUTO_CANCEL = exports.CANCEL = exports.NOT_ITERATOR_ERROR = undefined;
	exports.default = proc;

	var _utils = __webpack_require__(1);

	var _asap = __webpack_require__(8);

	var _asap2 = _interopRequireDefault(_asap);

	var _io = __webpack_require__(4);

	var _monitorActions = __webpack_require__(6);

	var monitorActions = _interopRequireWildcard(_monitorActions);

	var _SagaCancellationException = __webpack_require__(2);

	var _SagaCancellationException2 = _interopRequireDefault(_SagaCancellationException);

	var _channel = __webpack_require__(3);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	var NOT_ITERATOR_ERROR = exports.NOT_ITERATOR_ERROR = 'proc first argument (Saga function result) must be an iterator';
	var CANCEL = exports.CANCEL = (0, _utils.sym)('@@redux-saga/cancelPromise');
	var PARALLEL_AUTO_CANCEL = exports.PARALLEL_AUTO_CANCEL = 'PARALLEL_AUTO_CANCEL';
	var RACE_AUTO_CANCEL = exports.RACE_AUTO_CANCEL = 'RACE_AUTO_CANCEL';
	var FORK_AUTO_CANCEL = exports.FORK_AUTO_CANCEL = 'FORK_AUTO_CANCEL';
	var MANUAL_CANCEL = exports.MANUAL_CANCEL = 'MANUAL_CANCEL';

	var nextEffectId = (0, _utils.autoInc)();

	function forkQueue(cb) {
	  var tasks = [];

	  function addTask(task) {
	    tasks.push(task);
	    task.cont = function (err) {
	      (0, _utils.remove)(tasks, task);
	      cb(err);
	    };
	    task.cont.cancel = task.cancel;
	  }

	  function cancelAll(ex) {
	    tasks.forEach(function (t) {
	      return t.cancel(ex);
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
	  var monitor = arguments.length <= 4 || arguments[4] === undefined ? _utils.noop : arguments[4];
	  var parentEffectId = arguments.length <= 5 || arguments[5] === undefined ? 0 : arguments[5];
	  var name = arguments.length <= 6 || arguments[6] === undefined ? 'anonymous' : arguments[6];
	  var cont = arguments[7];


	  (0, _utils.check)(iterator, _utils.is.iterator, NOT_ITERATOR_ERROR);

	  var stdChannel = (0, _channel.eventChannel)(subscribe);

	  var taskQueue = forkQueue(function (err) {
	    if (err) {
	      var ex = new _SagaCancellationException2.default(FORK_AUTO_CANCEL, name, name);
	      if (!iterator._isMainRunning) {
	        iterator._result = undefined;
	        taskQueue.cancelAll(ex);
	        end(err);
	      } else {
	        _cancel(ex);
	        task.cont && task.cont(err);
	      }
	    } else if (!iterator._isMainRunning && !taskQueue.getTasks().length) {
	      end(null, iterator._result);
	    }
	  });

	  // Promise to be resolved/rejected when this generator terminates (or throws)
	  var deferredEnd = (0, _utils.deferred)();

	  /**
	    cancel : (SagaCancellationException) -> ()
	      Tracks the current effect cancellation
	    Each time the generator progresses. calling runEffect will set a new value
	    on it. It allows propagating cancellation to child effects
	  **/
	  next.cancel = _utils.noop;

	  /**
	    Creates a new task descriptor for this generator
	  **/
	  var task = newTask(parentEffectId, name, iterator, deferredEnd.promise, cont);

	  /**
	    This may be called by a parent generator to trigger/propagate cancellation
	    We'll simply cancel the current effect, which will reject that effect
	    The rejection will throw the injected SagaCancellationException into the flow
	    of this generator
	  **/
	  function _cancel(_ref) {
	    var type = _ref.type;
	    var origin = _ref.origin;

	    if (iterator._isRunning) {
	      iterator._isCancelled = true;
	      var ex = new _SagaCancellationException2.default(type, name, origin);
	      if (iterator._isMainRunning) {
	        next.cancel(ex);
	      }
	      taskQueue.cancelAll(ex);
	    }
	  }
	  cont && (cont.cancel = _cancel);
	  task.done[CANCEL] = _cancel;

	  // tracks the running status
	  iterator._isRunning = true;
	  iterator._isMainRunning = true;

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
	    if (!iterator._isMainRunning) throw new Error('Trying to resume an already finished generator');

	    try {
	      // calling iterator.throw on a generator that doesn't define a correponding try/Catch
	      // will throw an exception and jump to the catch block below
	      var result = error ? iterator.throw(error) : iterator.next(arg);
	      if (!result.done) {
	        runEffect(result.value, parentEffectId, '', next);
	      } else {
	        //console.log(name, 'ended, pending tasks', taskQueue.taskNames())
	        iterator._isMainRunning = false;
	        iterator._result = result.value;
	        if (!taskQueue.getTasks().length) end(null, result.value);
	      }
	    } catch (error) {
	      iterator._isMainRunning = false;
	      if (error instanceof _SagaCancellationException2.default) {
	        end();
	        if (_utils.isDev) {
	          (0, _utils.log)('warn', name + ': uncaught', error);
	        }
	      } else {
	        taskQueue.cancelAll(new _SagaCancellationException2.default(FORK_AUTO_CANCEL, name, name));
	        end(error);
	        if (!task.cont) (0, _utils.log)('error', name + ': uncaught', error);
	      }
	    }
	  }

	  function end(error, result) {
	    iterator._isRunning = false;
	    if (!error) {
	      iterator._result = result;
	      deferredEnd.resolve(result);
	      task.cont && !iterator._isCancelled && task.cont(null, result);
	    } else {
	      iterator._error = error;
	      deferredEnd.reject(error);
	      task.cont && task.cont(error);
	    }
	    stdChannel.close();
	  }

	  function runEffect(effect, parentEffectId) {
	    var label = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];
	    var cb = arguments[3];

	    var effectId = nextEffectId();
	    monitor(monitorActions.effectTriggered(effectId, parentEffectId, label, effect));

	    /**
	      completion callback and cancel callback are mutually exclusive
	      We can't cancel an already completed effect
	      And We can't complete an already cancelled effectId
	    **/
	    var effectSettled = undefined;

	    // Completion callback passed to the appropriate effect runner
	    function currCb(err, res) {
	      if (effectSettled) return;

	      effectSettled = true;
	      cb.cancel = _utils.noop; // defensive measure
	      err ? monitor(monitorActions.effectRejected(effectId, err)) : monitor(monitorActions.effectResolved(effectId, res));

	      cb(err, res);
	    }
	    // tracks down the current cancel
	    currCb.cancel = _utils.noop;

	    // setup cancellation logic on the parent cb
	    cb.cancel = function (cancelError) {
	      // prevents cancelling an already completed effect
	      if (effectSettled) return;

	      effectSettled = true;
	      /**
	        propagates cancel downward
	        catch uncaught cancellations errors,
	        because w'll throw our own cancellation error inside this generator
	      **/
	      try {
	        currCb.cancel(cancelError);
	      } catch (err) {
	        void 0;
	      }
	      currCb.cancel = _utils.noop; // defensive measure

	      /**
	        triggers/propagates the cancellation error
	      **/
	      cb(cancelError);
	      monitor(monitorActions.effectRejected(effectId, cancelError));
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
	    var data = undefined;
	    return(
	      // Non declarative effect
	      _utils.is.promise(effect) ? resolvePromise(effect, currCb) : _utils.is.iterator(effect) ? resolveIterator(effect, effectId, name, currCb)

	      // declarative effects
	      : _utils.is.array(effect) ? runParallelEffect(effect, effectId, currCb) : _utils.is.notUndef(data = _io.asEffect.take(effect)) ? runTakeEffect(data, currCb) : _utils.is.notUndef(data = _io.asEffect.put(effect)) ? runPutEffect(data, currCb) : _utils.is.notUndef(data = _io.asEffect.race(effect)) ? runRaceEffect(data, effectId, currCb) : _utils.is.notUndef(data = _io.asEffect.call(effect)) ? runCallEffect(data, effectId, currCb) : _utils.is.notUndef(data = _io.asEffect.cps(effect)) ? runCPSEffect(data, currCb) : _utils.is.notUndef(data = _io.asEffect.fork(effect)) ? runForkEffect(data, effectId, currCb) : _utils.is.notUndef(data = _io.asEffect.join(effect)) ? runJoinEffect(data, currCb) : _utils.is.notUndef(data = _io.asEffect.cancel(effect)) ? runCancelEffect(data, currCb) : _utils.is.notUndef(data = _io.asEffect.select(effect)) ? runSelectEffect(data, currCb) : /* anything else returned as is        */currCb(null, effect)
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

	  function runTakeEffect(_ref2, cb) {
	    var channel = _ref2.channel;
	    var pattern = _ref2.pattern;

	    channel = channel || stdChannel;
	    channel.take(pattern, cb);
	  }

	  function runPutEffect(action, cb) {
	    /*
	      Use a reentrant lock `asap` to flatten all nested dispatches
	      If this put cause another Saga to take this action an then immediately
	      put an action that will be taken by this Saga. Then the outer Saga will miss
	      the action from the inner Saga b/c this put has not yet returned.
	    */
	    (0, _asap2.default)(function () {
	      var result = undefined;
	      try {
	        result = dispatch(action);
	      } catch (error) {
	        return cb(error);
	      }

	      if (_utils.is.promise(result)) {
	        resolvePromise(result, cb);
	      } else {
	        cb(null, result);
	      }
	    });
	    // Put effects are non cancellables
	  }

	  function runCallEffect(_ref3, effectId, cb) {
	    var context = _ref3.context;
	    var fn = _ref3.fn;
	    var args = _ref3.args;

	    var result = undefined;
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

	    var result = undefined,
	        error = undefined,
	        _iterator = undefined;

	    // we run the function, next we'll check if this is a generator function
	    // (generator is a function that returns an iterator)

	    // catch synchronous failures; see #152
	    try {
	      result = fn.apply(context, args);
	    } catch (err) {
	      error = err;
	    }

	    // A generator function: i.e. returns an iterator
	    if (_utils.is.iterator(result)) {
	      _iterator = result;
	    }

	    //simple effect: wrap in a generator
	    // do not bubble up synchronous failures, instead create a failed task. See #152
	    else {
	        _iterator = error ? (0, _utils.makeIterator)(function () {
	          throw error;
	        }) : (0, _utils.makeIterator)(function () {
	          var pc = undefined;
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

	    var task = proc(_iterator, subscribe, dispatch, getState, monitor, effectId, fn.name);
	    if (!detached && task.isRunning()) {
	      taskQueue.addTask(task);
	    }
	    cb(null, task);
	    // Fork effects are non cancellables
	  }

	  function runJoinEffect(task, cb) {
	    task.cont && task.cont();
	    task.cont = cb;
	    cb.cancel = task.cancel;
	  }

	  function runCancelEffect(task, cb) {
	    if (task.isRunning()) {
	      task.cancel(new _SagaCancellationException2.default(MANUAL_CANCEL, name, name));
	      task.cont && task.cont();
	    }
	    cb();
	    // cancel effects are non cancellables
	  }

	  // Reimplementing Promise.all
	  function runParallelEffect(effects, effectId, cb) {
	    if (!effects.length) {
	      cb(null, []);
	      return;
	    }

	    var completedCount = 0;
	    var completed = undefined;
	    var results = Array(effects.length);

	    function checkEffectEnd() {
	      if (completedCount === results.length) {
	        completed = true;
	        cb(null, results);
	      }
	    }

	    var childCbs = effects.map(function (eff, idx) {
	      var chCbAtIdx = function chCbAtIdx(err, res) {
	        // Either we've been cancelled, or an error aborted the whole effect
	        if (completed) return;
	        // one of the effects failed or we got an END action
	        if (err || res === _channel.END) {
	          // cancel all other effects
	          // This is an AUTO_CANCEL (not triggered by a manual cancel)
	          // Catch uncaught cancellation errors, because w'll only throw the actual
	          // rejection error (err) inside this generator
	          try {
	            cb.cancel(new _SagaCancellationException2.default(PARALLEL_AUTO_CANCEL, name, name));
	          } catch (err) {
	            void 0;
	          }

	          err ? cb(err) : cb(null, _channel.END);
	        } else {
	          results[idx] = res;
	          completedCount++;
	          checkEffectEnd();
	        }
	      };
	      chCbAtIdx.cancel = _utils.noop;
	      return chCbAtIdx;
	    });

	    // This is different, a cancellation coming from upward
	    // either a MANUAL_CANCEL or a parent AUTO_CANCEL
	    // No need to catch, will be swallowed by the caller
	    cb.cancel = function (cancelError) {
	      // prevents unnecessary cancellation
	      if (!completed) {
	        completed = true;
	        childCbs.forEach(function (chCb) {
	          return chCb.cancel(cancelError);
	        });
	      }
	    };

	    effects.forEach(function (eff, idx) {
	      return runEffect(eff, effectId, idx, childCbs[idx]);
	    });
	  }

	  // And yet; Promise.race
	  function runRaceEffect(effects, effectId, cb) {
	    var completed = undefined;
	    var keys = Object.keys(effects);
	    var childCbs = {};

	    keys.forEach(function (key) {
	      var chCbAtKey = function chCbAtKey(err, res) {
	        // Either we've  been cancelled, or an error aborted the whole effect
	        if (completed) return;

	        if (err) {
	          // Race Auto cancellation
	          try {
	            cb.cancel(new _SagaCancellationException2.default(RACE_AUTO_CANCEL, name, name));
	          } catch (err) {
	            void 0;
	          }

	          cb(_defineProperty({}, key, err));
	        } else if (res !== _channel.END) {
	          try {
	            cb.cancel(new _SagaCancellationException2.default(RACE_AUTO_CANCEL, name, name));
	          } catch (err) {
	            void 0;
	          }
	          completed = true;
	          cb(null, _defineProperty({}, key, res));
	        }
	      };
	      chCbAtKey.cancel = _utils.noop;
	      childCbs[key] = chCbAtKey;
	    });

	    cb.cancel = function (cancelError) {
	      // prevents unnecessary cancellation
	      if (!completed) {
	        completed = true;
	        keys.forEach(function (key) {
	          return childCbs[key].cancel(cancelError);
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

	  function newTask(id, name, iterator, done, cont) {
	    var _ref7;

	    return _ref7 = {}, _defineProperty(_ref7, _utils.TASK, true), _defineProperty(_ref7, 'id', id), _defineProperty(_ref7, 'name', name), _defineProperty(_ref7, 'done', done), _defineProperty(_ref7, 'cont', cont), _defineProperty(_ref7, 'cancel', function cancel(error) {
	      if (!(error instanceof _SagaCancellationException2.default)) {
	        error = new _SagaCancellationException2.default(MANUAL_CANCEL, name, error);
	      }
	      _cancel(error);
	    }), _defineProperty(_ref7, 'isRunning', function isRunning() {
	      return iterator._isRunning;
	    }), _defineProperty(_ref7, 'isCancelled', function isCancelled() {
	      return iterator._isCancelled;
	    }), _defineProperty(_ref7, 'result', function result() {
	      return iterator._result;
	    }), _defineProperty(_ref7, 'error', function error() {
	      return iterator._error;
	    }), _ref7;
	  }
	}

/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.effectTriggered = effectTriggered;
	exports.effectResolved = effectResolved;
	exports.effectRejected = effectRejected;

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	var MONITOR_ACTION = exports.MONITOR_ACTION = 'MONITOR_ACTION';
	var EFFECT_TRIGGERED = exports.EFFECT_TRIGGERED = 'EFFECT_TRIGGERED';
	var EFFECT_RESOLVED = exports.EFFECT_RESOLVED = 'EFFECT_RESOLVED';
	var EFFECT_REJECTED = exports.EFFECT_REJECTED = 'EFFECT_REJECTED';

	function effectTriggered(effectId, parentEffectId, label, effect) {
	  var _ref;

	  return _ref = {}, _defineProperty(_ref, MONITOR_ACTION, true), _defineProperty(_ref, 'type', EFFECT_TRIGGERED), _defineProperty(_ref, 'effectId', effectId), _defineProperty(_ref, 'parentEffectId', parentEffectId), _defineProperty(_ref, 'label', label), _defineProperty(_ref, 'effect', effect), _ref;
	}

	function effectResolved(effectId, result) {
	  var _ref2;

	  return _ref2 = {}, _defineProperty(_ref2, MONITOR_ACTION, true), _defineProperty(_ref2, 'type', EFFECT_RESOLVED), _defineProperty(_ref2, 'effectId', effectId), _defineProperty(_ref2, 'result', result), _ref2;
	}

	function effectRejected(effectId, error) {
	  var _ref3;

	  return _ref3 = {}, _defineProperty(_ref3, MONITOR_ACTION, true), _defineProperty(_ref3, 'type', EFFECT_REJECTED), _defineProperty(_ref3, 'effectId', effectId), _defineProperty(_ref3, 'error', error), _ref3;
	}

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.select = exports.cancel = exports.join = exports.fork = exports.cps = exports.apply = exports.call = exports.race = exports.put = exports.take = undefined;

	var _io = __webpack_require__(4);

	exports.take = _io.take;
	exports.put = _io.put;
	exports.race = _io.race;
	exports.call = _io.call;
	exports.apply = _io.apply;
	exports.cps = _io.cps;
	exports.fork = _io.fork;
	exports.join = _io.join;
	exports.cancel = _io.cancel;
	exports.select = _io.select;

/***/ },
/* 8 */
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
	  var nextTask = undefined;
	  while (nextTask = queue.shift()) {
	    nextTask();
	  }
	  isSuspended = false;
	};

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.MIDDLEWARE_NOT_CONNECTED_ERROR = exports.sagaArgError = undefined;
	exports.default = sagaMiddlewareFactory;

	var _utils = __webpack_require__(1);

	var _proc = __webpack_require__(5);

	var _proc2 = _interopRequireDefault(_proc);

	var _channel = __webpack_require__(3);

	var _monitorActions = __webpack_require__(6);

	var _SagaCancellationException = __webpack_require__(2);

	var _SagaCancellationException2 = _interopRequireDefault(_SagaCancellationException);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	//import asap from './asap'
	var sagaArgError = exports.sagaArgError = function sagaArgError(fn, pos, saga) {
	  return '\n  ' + fn + ' can only be called on Generator functions\n  Argument ' + saga + ' at position ' + pos + ' is not function!\n';
	};

	var MIDDLEWARE_NOT_CONNECTED_ERROR = exports.MIDDLEWARE_NOT_CONNECTED_ERROR = 'Before running a Saga, you must mount the Saga middleware on the Store using applyMiddleware';

	function sagaMiddlewareFactory() {
	  for (var _len = arguments.length, sagas = Array(_len), _key = 0; _key < _len; _key++) {
	    sagas[_key] = arguments[_key];
	  }

	  var runSagaDynamically = undefined;

	  function sagaMiddleware(_ref) {
	    var getState = _ref.getState;
	    var dispatch = _ref.dispatch;

	    runSagaDynamically = runSaga;
	    var sagaEmitter = (0, _channel.emitter)();
	    var monitor = _utils.isDev ? function (action) {
	      return Promise.resolve().then(function () {
	        return dispatch(action);
	      });
	    } : undefined;

	    function runSaga(saga) {
	      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
	        args[_key2 - 1] = arguments[_key2];
	      }

	      return (0, _proc2.default)(saga.apply(undefined, args), sagaEmitter.subscribe, dispatch, getState, monitor, 0, saga.name);
	    }

	    sagas.forEach(function (saga) {
	      return runSaga(saga);
	    });

	    return function (next) {
	      return function (action) {
	        var result = next(action); // hit reducers
	        // filter out monitor actions to avoid endless loops
	        // see https://github.com/yelouafi/redux-saga/issues/61
	        if (!action[_monitorActions.MONITOR_ACTION]) sagaEmitter.emit(action);
	        return result;
	      };
	    };
	  }

	  sagaMiddleware.run = function (saga) {
	    for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
	      args[_key3 - 1] = arguments[_key3];
	    }

	    if (!runSagaDynamically) {
	      throw new Error(MIDDLEWARE_NOT_CONNECTED_ERROR);
	    }
	    (0, _utils.check)(saga, _utils.is.func, sagaArgError('sagaMiddleware.run', 0, saga));

	    var task = runSagaDynamically.apply(undefined, [saga].concat(args));
	    task.done.catch(function (err) {
	      if (!(err instanceof _SagaCancellationException2.default)) throw err;
	    });
	    return task;
	  };

	  return sagaMiddleware;
	}

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.NOT_ITERATOR_ERROR = undefined;
	exports.runSaga = runSaga;

	var _utils = __webpack_require__(1);

	var _proc = __webpack_require__(5);

	var _proc2 = _interopRequireDefault(_proc);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var NOT_ITERATOR_ERROR = exports.NOT_ITERATOR_ERROR = "runSaga must be called on an iterator";

	function runSaga(iterator, _ref) {
	  var subscribe = _ref.subscribe;
	  var dispatch = _ref.dispatch;
	  var getState = _ref.getState;
	  var monitor = arguments.length <= 2 || arguments[2] === undefined ? _utils.noop : arguments[2];


	  (0, _utils.check)(iterator, _utils.is.iterator, NOT_ITERATOR_ERROR);

	  return (0, _proc2.default)(iterator, subscribe, dispatch, getState, monitor);
	}

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

	exports.takeEvery = takeEvery;
	exports.takeLatest = takeLatest;

	var _channel = __webpack_require__(3);

	var _utils = __webpack_require__(1);

	var _io = __webpack_require__(4);

	var _SagaCancellationException = __webpack_require__(2);

	var _SagaCancellationException2 = _interopRequireDefault(_SagaCancellationException);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var done = { done: true, value: undefined };
	var qEnd = {};

	function fsmIterator(fsm, q0) {
	  var name = arguments.length <= 2 || arguments[2] === undefined ? 'iterator' : arguments[2];

	  var updateState = undefined,
	      qNext = q0;

	  function next(arg, error) {
	    if (qNext === qEnd) return done;

	    if (error) {
	      qNext = qEnd;
	      if (!(error instanceof _SagaCancellationException2.default)) throw error;
	      return done;
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

	  var action = undefined,
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

	  var task = undefined,
	      action = undefined;
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
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.createMockTask = createMockTask;

	var _utils = __webpack_require__(1);

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	function createMockTask() {
	  var _ref;

	  var running = true;
	  var _result = undefined,
	      _error = undefined;

	  return _ref = {}, _defineProperty(_ref, _utils.TASK, true), _defineProperty(_ref, 'isRunning', function isRunning() {
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

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.monitorActions = exports.createMockTask = exports.MANUAL_CANCEL = exports.PARALLEL_AUTO_CANCEL = exports.RACE_AUTO_CANCEL = exports.CANCEL = exports.asEffect = exports.delay = exports.arrayOfDeffered = exports.deferred = exports.is = exports.noop = exports.TASK = undefined;

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
	Object.defineProperty(exports, 'delay', {
	  enumerable: true,
	  get: function get() {
	    return _utils.delay;
	  }
	});

	var _io = __webpack_require__(4);

	Object.defineProperty(exports, 'asEffect', {
	  enumerable: true,
	  get: function get() {
	    return _io.asEffect;
	  }
	});

	var _proc = __webpack_require__(5);

	Object.defineProperty(exports, 'CANCEL', {
	  enumerable: true,
	  get: function get() {
	    return _proc.CANCEL;
	  }
	});
	Object.defineProperty(exports, 'RACE_AUTO_CANCEL', {
	  enumerable: true,
	  get: function get() {
	    return _proc.RACE_AUTO_CANCEL;
	  }
	});
	Object.defineProperty(exports, 'PARALLEL_AUTO_CANCEL', {
	  enumerable: true,
	  get: function get() {
	    return _proc.PARALLEL_AUTO_CANCEL;
	  }
	});
	Object.defineProperty(exports, 'MANUAL_CANCEL', {
	  enumerable: true,
	  get: function get() {
	    return _proc.MANUAL_CANCEL;
	  }
	});

	var _testUtils = __webpack_require__(12);

	Object.defineProperty(exports, 'createMockTask', {
	  enumerable: true,
	  get: function get() {
	    return _testUtils.createMockTask;
	  }
	});

	var _monitorActions = __webpack_require__(6);

	var monitorActions = _interopRequireWildcard(_monitorActions);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	exports.monitorActions = monitorActions;

/***/ },
/* 14 */
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