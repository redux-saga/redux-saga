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
	exports.utils = exports.effects = exports.takeLatest = exports.takeEvery = exports.storeIO = exports.runSaga = exports.isCancelError = exports.SagaCancellationException = undefined;

	var _runSaga = __webpack_require__(9);

	Object.defineProperty(exports, 'runSaga', {
	  enumerable: true,
	  get: function get() {
	    return _runSaga.runSaga;
	  }
	});
	Object.defineProperty(exports, 'storeIO', {
	  enumerable: true,
	  get: function get() {
	    return _runSaga.storeIO;
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

	var _middleware = __webpack_require__(8);

	var _middleware2 = _interopRequireDefault(_middleware);

	var _SagaCancellationException2 = __webpack_require__(2);

	var _SagaCancellationException3 = _interopRequireDefault(_SagaCancellationException2);

	var _effects = __webpack_require__(7);

	var effects = _interopRequireWildcard(_effects);

	var _utils = __webpack_require__(12);

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

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.check = check;
	exports.remove = remove;
	exports.deferred = deferred;
	exports.arrayOfDeffered = arrayOfDeffered;
	exports.autoInc = autoInc;
	exports.asap = asap;
	var TASK = exports.TASK = Symbol('TASK');
	var kTrue = exports.kTrue = function kTrue() {
	  return true;
	};
	var noop = exports.noop = function noop() {};

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
	    return it && is.func(it.next) && is.func(it[Symbol.iterator]);
	  },
	  throw: function _throw(it) {
	    return it && is.func(it.throw);
	  },
	  task: function task(it) {
	    return it && it[TASK];
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

	function autoInc() {
	  var seed = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

	  return function () {
	    return ++seed;
	  };
	}

	function asap(action) {
	  return Promise.resolve(1).then(function () {
	    return action();
	  });
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13)))

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

	"use strict";

	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.asEffect = exports.INVALID_PATTERN = exports.CANCEL_ARG_ERROR = exports.JOIN_ARG_ERROR = exports.FORK_ARG_ERROR = exports.CALL_FUNCTION_ARG_ERROR = undefined;
	exports.matcher = matcher;
	exports.take = take;
	exports.put = put;
	exports.race = race;
	exports.call = call;
	exports.apply = apply;
	exports.cps = cps;
	exports.fork = fork;
	exports.join = join;
	exports.cancel = cancel;

	var _utils = __webpack_require__(1);

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	var CALL_FUNCTION_ARG_ERROR = exports.CALL_FUNCTION_ARG_ERROR = "call/cps/fork first argument must be a function, an array [context, function] or an object {context, fn}";
	var FORK_ARG_ERROR = exports.FORK_ARG_ERROR = "fork first argument must be a generator function or an iterator";
	var JOIN_ARG_ERROR = exports.JOIN_ARG_ERROR = "join argument must be a valid task (a result of a fork)";
	var CANCEL_ARG_ERROR = exports.CANCEL_ARG_ERROR = "cancel argument must be a valid task (a result of a fork)";
	var INVALID_PATTERN = exports.INVALID_PATTERN = "Invalid pattern passed to `take` (HINT: check if you didn't mispell a constant)";

	var IO = Symbol('IO');
	var TAKE = 'TAKE';
	var PUT = 'PUT';
	var RACE = 'RACE';
	var CALL = 'CALL';
	var CPS = 'CPS';
	var FORK = 'FORK';
	var JOIN = 'JOIN';
	var CANCEL = 'CANCEL';

	var effect = function effect(type, payload) {
	  var _ref;

	  return _ref = {}, _defineProperty(_ref, IO, true), _defineProperty(_ref, type, payload), _ref;
	};

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

	function take(pattern) {
	  if (arguments.length > 0 && _utils.is.undef(pattern)) {
	    throw new Error(INVALID_PATTERN);
	  }

	  return effect(TAKE, _utils.is.undef(pattern) ? '*' : pattern);
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
	  }
	};

/***/ },
/* 4 */
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
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.MANUAL_CANCEL = exports.RACE_AUTO_CANCEL = exports.PARALLEL_AUTO_CANCEL = exports.CANCEL = exports.undefindInputError = exports.NOT_ITERATOR_ERROR = undefined;
	exports.default = proc;

	var _utils = __webpack_require__(1);

	var _io = __webpack_require__(3);

	var _monitorActions = __webpack_require__(4);

	var monitorActions = _interopRequireWildcard(_monitorActions);

	var _SagaCancellationException = __webpack_require__(2);

	var _SagaCancellationException2 = _interopRequireDefault(_SagaCancellationException);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	var NOT_ITERATOR_ERROR = exports.NOT_ITERATOR_ERROR = 'proc first argument (Saga function result) must be an iterator';
	var undefindInputError = exports.undefindInputError = function undefindInputError(name) {
	  return '\n  ' + name + ' saga was provided with an undefined input action\n  Hints :\n  - check that your Action Creator returns a non undefined value\n  - if the Saga was started using runSaga, check that your subscribe source provides the action to its listeners\n';
	};

	var CANCEL = exports.CANCEL = Symbol('@@redux-saga/cancelPromise');
	var PARALLEL_AUTO_CANCEL = exports.PARALLEL_AUTO_CANCEL = 'PARALLEL_AUTO_CANCEL';
	var RACE_AUTO_CANCEL = exports.RACE_AUTO_CANCEL = 'RACE_AUTO_CANCEL';
	var MANUAL_CANCEL = exports.MANUAL_CANCEL = 'MANUAL_CANCEL';

	var nextEffectId = (0, _utils.autoInc)();

	function proc(iterator) {
	  var subscribe = arguments.length <= 1 || arguments[1] === undefined ? function () {
	    return _utils.noop;
	  } : arguments[1];
	  var dispatch = arguments.length <= 2 || arguments[2] === undefined ? _utils.noop : arguments[2];
	  var monitor = arguments.length <= 3 || arguments[3] === undefined ? _utils.noop : arguments[3];
	  var parentEffectId = arguments.length <= 4 || arguments[4] === undefined ? 0 : arguments[4];
	  var name = arguments.length <= 5 || arguments[5] === undefined ? 'anonymous' : arguments[5];

	  (0, _utils.check)(iterator, _utils.is.iterator, NOT_ITERATOR_ERROR);

	  var UNDEFINED_INPUT_ERROR = undefindInputError(name);

	  // tracks the current `take` effects
	  var deferredInputs = [];
	  var canThrow = _utils.is.throw(iterator);
	  // Promise to be resolved/rejected when this generator terminates (or throws)
	  var deferredEnd = (0, _utils.deferred)();

	  // subscribe to input events, this will resolve the current `take` effects
	  var unsubscribe = subscribe(function (input) {
	    if (input === undefined) throw UNDEFINED_INPUT_ERROR;

	    for (var i = 0; i < deferredInputs.length; i++) {
	      var def = deferredInputs[i];
	      if (def.match(input)) {
	        // cancel all deferredInputs; parallel takes are disallowed
	        // and in concurrent takes, first wins
	        deferredInputs = [];
	        def.resolve(input);
	      }
	    }
	  });

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
	  var task = newTask(parentEffectId, name, iterator, deferredEnd.promise);

	  /**
	    this maybe called by a parent generator to trigger/propagate cancellation
	    W'll simply cancel the current effect, which will reject that effect
	    The rejection will throw the injected SagaCancellationException into the flow
	    of this generator
	  **/
	  task.done[CANCEL] = function (_ref) {
	    var type = _ref.type;
	    var origin = _ref.origin;

	    next.cancel(new _SagaCancellationException2.default(type, name, origin));
	  };

	  // tracks the running status
	  iterator._isRunning = true;

	  // kicks up the generator
	  next();

	  // then return the task descriptor to the caller
	  return task;

	  /**
	    This is the generator driver
	    It's a recursive aysnc/continuation function which calls itself
	    until the generator terminates or throws
	  **/
	  function next(error, arg) {
	    // Preventive measure. If we endup here, then there is really something wrong
	    if (!iterator._isRunning) throw new Error('Trying to resume an already finished generator');

	    try {
	      if (error && !canThrow) throw error;

	      // calling iterator.throw on a generator that doesnt defined a correponding try/Catch
	      var result = error ? iterator.throw(error) : iterator.next(arg);
	      if (!result.done) {
	        runEffect(result.value, parentEffectId, '', next);
	      } else {
	        end(result.value);
	      }
	    } catch (error) {
	      end(error, true);

	      /*eslint-disable no-console*/
	      if (error instanceof _SagaCancellationException2.default) {
	        if (_utils.isDev) console.warn(name + ': uncaught', error);
	      } else {
	        throw error;
	      }
	    }
	  }

	  function end(result, isError) {
	    iterator._isRunning = false;
	    if (!isError) {
	      iterator._result = result;
	      deferredEnd.resolve(result);
	    } else {
	      iterator._error = result;
	      deferredEnd.reject(result);
	    }
	    unsubscribe();
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
	      : _utils.is.array(effect) ? runParallelEffect(effect, effectId, currCb) : _utils.is.notUndef(data = _io.asEffect.take(effect)) ? runTakeEffect(data, currCb) : _utils.is.notUndef(data = _io.asEffect.put(effect)) ? runPutEffect(data, currCb) : _utils.is.notUndef(data = _io.asEffect.race(effect)) ? runRaceEffect(data, effectId, currCb) : _utils.is.notUndef(data = _io.asEffect.call(effect)) ? runCallEffect(data, effectId, currCb) : _utils.is.notUndef(data = _io.asEffect.cps(effect)) ? runCPSEffect(data, currCb) : _utils.is.notUndef(data = _io.asEffect.fork(effect)) ? runForkEffect(data, effectId, currCb) : _utils.is.notUndef(data = _io.asEffect.join(effect)) ? runJoinEffect(data, currCb) : _utils.is.notUndef(data = _io.asEffect.cancel(effect)) ? runCancelEffect(data, currCb) : /* anything else returned as is        */currCb(null, effect)
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
	    resolvePromise(proc(iterator, subscribe, dispatch, monitor, effectId, name).done, cb);
	  }

	  function runTakeEffect(pattern, cb) {
	    var def = {
	      match: (0, _io.matcher)(pattern),
	      pattern: pattern,
	      resolve: function resolve(input) {
	        return cb(null, input);
	      }
	    };
	    deferredInputs.push(def);
	    // cancellation logic for take effect
	    cb.cancel = function () {
	      return (0, _utils.remove)(deferredInputs, def);
	    };
	  }

	  function runPutEffect(action, cb) {
	    //synchronously nested dispatches can not be performed
	    // because on a sync interleaved take/put the receiver will dispatch the
	    // action before the sender can take the aknowledge
	    // this workaround allows the dispatch to occur on the next microtask
	    (0, _utils.asap)(function () {
	      return cb(null, dispatch(action));
	    });
	    // Put effects are non cancellables
	  }

	  function runCallEffect(_ref2, effectId, cb) {
	    var context = _ref2.context;
	    var fn = _ref2.fn;
	    var args = _ref2.args;

	    var result = fn.apply(context, args);
	    return _utils.is.promise(result) ? resolvePromise(result, cb) : _utils.is.iterator(result) ? resolveIterator(result, effectId, fn.name, cb) : cb(null, result);
	  }

	  function runCPSEffect(_ref3, cb) {
	    var context = _ref3.context;
	    var fn = _ref3.fn;
	    var args = _ref3.args;

	    // CPS (ie node style functions) can define their own cancellation logic
	    // by setting cancel field on the cb
	    fn.apply(context, args.concat(cb));
	  }

	  function runForkEffect(_ref4, effectId, cb) {
	    var context = _ref4.context;
	    var fn = _ref4.fn;
	    var args = _ref4.args;

	    var result = undefined,
	        _iterator = undefined;

	    // we run the function, next we'll check if this is a generator function
	    // (generator is a function that returns an iterator)
	    result = fn.apply(context, args);

	    // A generator function: i.e. returns an iterator
	    if (_utils.is.iterator(result)) {
	      _iterator = result;
	    }

	    //simple effect: wrap in a generator
	    else {
	        _iterator = regeneratorRuntime.mark(function _callee() {
	          return regeneratorRuntime.wrap(function _callee$(_context) {
	            while (1) {
	              switch (_context.prev = _context.next) {
	                case 0:
	                  _context.next = 2;
	                  return result;

	                case 2:
	                  return _context.abrupt('return', _context.sent);

	                case 3:
	                case 'end':
	                  return _context.stop();
	              }
	            }
	          }, _callee, this);
	        })();
	      }

	    cb(null, proc(_iterator, subscribe, dispatch, monitor, effectId, fn.name, true));
	    // Fork effects are non cancellables
	  }

	  function runJoinEffect(task, cb) {
	    resolvePromise(task.done, cb);
	  }

	  function runCancelEffect(task, cb) {
	    // cancel the given task
	    // uncaught cancellations errors bubbles upward
	    task.done[CANCEL](new _SagaCancellationException2.default(MANUAL_CANCEL, name, name));
	    cb();
	    // cancel effects are non cancellables
	  }

	  // Reimplementing Promise.all. We're in 2016
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
	        // Either we've  been cancelled, or an error aborted the whole effect
	        if (completed) return;
	        // one of the effects failed
	        if (err) {
	          // cancel all other effects
	          // This is an AUTO_CANCEL (not triggered by a manual cancel)
	          // Catch uncaught cancellation errors, because w'll only throw the actual
	          // rejection error (err) inside this generator
	          try {
	            cb.cancel(new _SagaCancellationException2.default(PARALLEL_AUTO_CANCEL, name, name));
	          } catch (err) {
	            void 0;
	          }

	          cb(err);
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
	        } else {
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

	  function newTask(id, name, iterator, done, forked) {
	    var _ref5;

	    return _ref5 = {}, _defineProperty(_ref5, _utils.TASK, true), _defineProperty(_ref5, 'id', id), _defineProperty(_ref5, 'name', name), _defineProperty(_ref5, 'done', done), _defineProperty(_ref5, 'forked', forked), _defineProperty(_ref5, 'cancel', function cancel(error) {
	      if (!(error instanceof _SagaCancellationException2.default)) {
	        error = new _SagaCancellationException2.default(MANUAL_CANCEL, name, error);
	      }
	      done[CANCEL](error);
	    }), _defineProperty(_ref5, 'isRunning', function isRunning() {
	      return iterator._isRunning;
	    }), _defineProperty(_ref5, 'getResult', function getResult() {
	      return iterator._result;
	    }), _defineProperty(_ref5, 'getError', function getError() {
	      return iterator._error;
	    }), _ref5;
	  }
	}

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = emitter;

	var _utils = __webpack_require__(1);

	function emitter() {

	  var cbs = [];

	  function subscribe(cb) {
	    cbs.push(cb);
	    return function () {
	      return (0, _utils.remove)(cbs, cb);
	    };
	  }

	  function emit(item) {
	    cbs.slice().forEach(function (cb) {
	      return cb(item);
	    });
	  }

	  return {
	    subscribe: subscribe,
	    emit: emit
	  };
	}

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _io = __webpack_require__(3);

	module.exports = { take: _io.take, put: _io.put, race: _io.race, call: _io.call, apply: _io.apply, cps: _io.cps, fork: _io.fork, join: _io.join, cancel: _io.cancel };

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.RUN_SAGA_DYNAMIC_ERROR = undefined;
	exports.default = sagaMiddlewareFactory;

	var _utils = __webpack_require__(1);

	var _proc = __webpack_require__(5);

	var _proc2 = _interopRequireDefault(_proc);

	var _emitter = __webpack_require__(6);

	var _emitter2 = _interopRequireDefault(_emitter);

	var _monitorActions = __webpack_require__(4);

	var _SagaCancellationException = __webpack_require__(2);

	var _SagaCancellationException2 = _interopRequireDefault(_SagaCancellationException);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var RUN_SAGA_DYNAMIC_ERROR = exports.RUN_SAGA_DYNAMIC_ERROR = 'Before running a Saga dynamically using middleware.run, you must mount the Saga middleware on the Store using applyMiddleware';

	function sagaMiddlewareFactory() {
	  for (var _len = arguments.length, sagas = Array(_len), _key = 0; _key < _len; _key++) {
	    sagas[_key] = arguments[_key];
	  }

	  var runSagaDynamically = undefined;

	  function sagaMiddleware(_ref) {
	    var getState = _ref.getState;
	    var dispatch = _ref.dispatch;

	    var sagaEmitter = (0, _emitter2.default)();
	    var monitor = _utils.isDev ? function (action) {
	      return (0, _utils.asap)(function () {
	        return dispatch(action);
	      });
	    } : undefined;

	    function runSaga(saga) {
	      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
	        args[_key2 - 1] = arguments[_key2];
	      }

	      return (0, _proc2.default)(saga.apply(undefined, [getState].concat(args)), sagaEmitter.subscribe, dispatch, monitor, 0, saga.name);
	    }

	    runSagaDynamically = runSaga;

	    sagas.forEach(runSaga);

	    return function (next) {
	      return function (action) {
	        var result = next(action); // hit reducers
	        // filter out monitor actions to avoid endless loop
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
	      throw new Error(RUN_SAGA_DYNAMIC_ERROR);
	    }
	    var task = runSagaDynamically.apply(undefined, [saga].concat(args));
	    task.done.catch(function (err) {
	      if (!(err instanceof _SagaCancellationException2.default)) throw err;
	    });
	    return task;
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
	exports.NOT_ITERATOR_ERROR = undefined;
	exports.storeIO = storeIO;
	exports.runSaga = runSaga;

	var _utils = __webpack_require__(1);

	var _proc = __webpack_require__(5);

	var _proc2 = _interopRequireDefault(_proc);

	var _emitter = __webpack_require__(6);

	var _emitter2 = _interopRequireDefault(_emitter);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var NOT_ITERATOR_ERROR = exports.NOT_ITERATOR_ERROR = "runSaga must be called on an iterator";

	/**
	  @deprecated
	  ATTENTION! this method can have some potential issues
	  For more infos, see issue https://github.com/yelouafi/redux-saga/issues/48

	  memoize the result of storeChannel. It avoids monkey patching the same store
	  multiple times unnecessarly. We need only one channel per store
	**/
	var IO = Symbol('IO');
	function storeIO(store) {

	  if (_utils.isDev) {
	    /* eslint-disable no-console */
	    console.warn('storeIO is deprecated, to run Saga dynamically, use \'run\' method of the middleware');
	  }

	  if (store[IO]) return store[IO];

	  var storeEmitter = (0, _emitter2.default)();
	  var _dispatch = store.dispatch;
	  store.dispatch = function (action) {
	    var result = _dispatch(action);
	    storeEmitter.emit(action);
	    return result;
	  };

	  store[IO] = {
	    subscribe: storeEmitter.subscribe,
	    dispatch: store.dispatch
	  };

	  return store[IO];
	}

	function runSaga(iterator, _ref) {
	  var subscribe = _ref.subscribe;
	  var dispatch = _ref.dispatch;
	  var monitor = arguments.length <= 2 || arguments[2] === undefined ? _utils.noop : arguments[2];

	  (0, _utils.check)(iterator, _utils.is.iterator, NOT_ITERATOR_ERROR);

	  return (0, _proc2.default)(iterator, subscribe, dispatch, monitor);
	}

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.takeEvery = takeEvery;
	exports.takeLatest = takeLatest;

	var _utils = __webpack_require__(1);

	var _io = __webpack_require__(3);

	var _SagaCancellationException = __webpack_require__(2);

	var _SagaCancellationException2 = _interopRequireDefault(_SagaCancellationException);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	var resume = function resume(fnOrValue, arg) {
	  return _utils.is.func(fnOrValue) ? fnOrValue(arg) : fnOrValue;
	};
	var done = { done: true };

	function fsmIterator(fsm, nextState) {
	  var _iterator;

	  var aborted = undefined,
	      updateState = undefined;

	  function next(arg, error) {
	    if (aborted) return done;

	    if (error) {
	      aborted = true;
	      if (!(error instanceof _SagaCancellationException2.default)) throw error;
	      return done;
	    } else {
	      if (updateState) updateState(arg);

	      var _fsm$nextState = _slicedToArray(fsm[nextState], 3);

	      var output = _fsm$nextState[0];
	      var transition = _fsm$nextState[1];
	      var _updateState = _fsm$nextState[2];

	      updateState = _updateState;
	      nextState = resume(transition, arg);
	      return resume(output, arg);
	    }
	  }

	  var iterator = (_iterator = {}, _defineProperty(_iterator, Symbol.iterator, function () {
	    return iterator;
	  }), _defineProperty(_iterator, 'next', next), _defineProperty(_iterator, 'throw', function _throw(error) {
	    return next(null, error);
	  }), _iterator);
	  return iterator;
	}

	function takeEvery(pattern, worker) {
	  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
	    args[_key - 2] = arguments[_key];
	  }

	  var yieldTake = { done: false, value: (0, _io.take)(pattern) };
	  var yieldFork = function yieldFork(action) {
	    return { done: false, value: _io.fork.apply(undefined, [worker].concat(args, [action])) };
	  };

	  return fsmIterator({
	    'take': [yieldTake, 'fork'],
	    'fork': [yieldFork, 'take']
	  }, 'take');
	}

	function takeLatest(pattern, worker) {
	  for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
	    args[_key2 - 2] = arguments[_key2];
	  }

	  var yieldTake = { done: false, value: (0, _io.take)(pattern) };
	  var yieldFork = function yieldFork() {
	    return { done: false, value: _io.fork.apply(undefined, [worker].concat(args, [currentAction])) };
	  };
	  var yieldCancel = function yieldCancel() {
	    return { done: false, value: (0, _io.cancel)(currentTask) };
	  };
	  var forkOrCancel = function forkOrCancel() {
	    return currentTask ? 'cancel' : 'fork';
	  };

	  var currentTask = undefined,
	      currentAction = undefined;
	  return fsmIterator({
	    'take': [yieldTake, forkOrCancel, function (action) {
	      return currentAction = action;
	    }],
	    'cancel': [yieldCancel, 'fork'],
	    'fork': [yieldFork, 'take', function (task) {
	      return currentTask = task;
	    }]
	  }, 'take');
	}

/***/ },
/* 11 */
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
	  var result = undefined,
	      error = undefined;

	  return _ref = {}, _defineProperty(_ref, _utils.TASK, true), _defineProperty(_ref, 'isRunning', function isRunning() {
	    return running;
	  }), _defineProperty(_ref, 'getResult', function getResult() {
	    return result;
	  }), _defineProperty(_ref, 'getError', function getError() {
	    return error;
	  }), _defineProperty(_ref, 'setRunning', function setRunning(b) {
	    return running = b;
	  }), _defineProperty(_ref, 'setResult', function setResult(r) {
	    return result = r;
	  }), _defineProperty(_ref, 'setError', function setError(e) {
	    return error = e;
	  }), _ref;
	}

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _utils = __webpack_require__(1);

	var _io = __webpack_require__(3);

	var _proc = __webpack_require__(5);

	var _testUtils = __webpack_require__(11);

	var _monitorActions = __webpack_require__(4);

	var monitorActions = _interopRequireWildcard(_monitorActions);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	module.exports = {
	  TASK: _utils.TASK,
	  noop: _utils.noop,
	  is: _utils.is, asEffect: _io.asEffect,
	  deferred: _utils.deferred,
	  arrayOfDeffered: _utils.arrayOfDeffered,
	  asap: _utils.asap,

	  CANCEL: _proc.CANCEL,
	  RACE_AUTO_CANCEL: _proc.RACE_AUTO_CANCEL,
	  PARALLEL_AUTO_CANCEL: _proc.PARALLEL_AUTO_CANCEL,
	  MANUAL_CANCEL: _proc.MANUAL_CANCEL,

	  createMockTask: _testUtils.createMockTask,

	  monitorActions: monitorActions
	};

/***/ },
/* 13 */
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