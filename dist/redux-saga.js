(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.ReduxSaga = {})));
}(this, (function (exports) { 'use strict';

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

var sym = function sym(id) {
  id = "@@redux-saga/" + id;
  return typeof Symbol === 'function' ? Symbol(id) : id;
};

var CANCEL =
/*#__PURE__*/
sym('CANCEL_PROMISE');
var CHANNEL_END =
/*#__PURE__*/
sym('CHANNEL_END');
var CHANNEL_END_TYPE =
/*#__PURE__*/
sym('CHANNEL_END');
var IO =
/*#__PURE__*/
sym('IO');
var MATCH =
/*#__PURE__*/
sym('MATCH');
var MULTICAST =
/*#__PURE__*/
sym('MULTICAST');
var SAGA_ACTION =
/*#__PURE__*/
sym('SAGA_ACTION');
var SELF_CANCELLATION =
/*#__PURE__*/
sym('SELF_CANCELLATION');
var TASK =
/*#__PURE__*/
sym('TASK');
var TASK_CANCEL =
/*#__PURE__*/
sym('TASK_CANCEL');

var konst = function konst(v) {
  return function () {
    return v;
  };
};
var kTrue =
/*#__PURE__*/
konst(true);
var kFalse =
/*#__PURE__*/
konst(false);
var noop = function noop() {};
var identity = function identity(v) {
  return v;
};
function check(value, predicate, error) {
  if (!predicate(value)) {
    throw new Error(error);
  }
}
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn(object, property) {
  return is.notUndef(object) && hasOwnProperty.call(object, property);
}
var is = {
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
  string: function string(s) {
    return typeof s === 'string';
  },
  array: Array.isArray,
  object: function object(obj) {
    return obj && !is.array(obj) && _typeof(obj) === 'object';
  },
  promise: function promise(p) {
    return p && is.func(p.then);
  },
  iterator: function iterator(it) {
    return it && is.func(it.next) && is.func(it.throw);
  },
  iterable: function iterable(it) {
    return it && is.func(Symbol) ? is.func(it[Symbol.iterator]) : is.array(it);
  },
  task: function task(t) {
    return t && t[TASK];
  },
  observable: function observable(ob) {
    return ob && is.func(ob.subscribe);
  },
  buffer: function buffer(buf) {
    return buf && is.func(buf.isEmpty) && is.func(buf.take) && is.func(buf.put);
  },
  pattern: function pattern(pat) {
    return pat && (is.string(pat) || is.symbol(pat) || is.func(pat) || is.array(pat));
  },
  channel: function channel(ch) {
    return ch && is.func(ch.take) && is.func(ch.close);
  },
  stringableFunc: function stringableFunc(f) {
    return is.func(f) && hasOwn(f, 'toString');
  },
  symbol: function symbol(sym) {
    return _typeof(sym) === 'symbol';
  },
  multicast: function multicast(ch) {
    return is.channel(ch) && ch[MULTICAST];
  }
};
var object = {
  assign: function assign(target, source) {
    for (var i in source) {
      if (hasOwn(source, i)) {
        target[i] = source[i];
      }
    }
  }
};
function remove(array, item) {
  var index = array.indexOf(item);

  if (index >= 0) {
    array.splice(index, 1);
  }
}
var array = {
  from: function from(obj) {
    var arr = Array(obj.length);

    for (var i in obj) {
      if (hasOwn(obj, i)) {
        arr[i] = obj[i];
      }
    }

    return arr;
  }
};
function once(fn) {
  var called = false;
  return function () {
    if (called) {
      return;
    }

    called = true;
    fn();
  };
}
function deferred(props) {
  if (props === void 0) {
    props = {};
  }

  var def = _extends({}, props);
  var promise = new Promise(function (resolve, reject) {
    def.resolve = resolve;
    def.reject = reject;
  });
  def.promise = promise;
  return def;
}
function arrayOfDeferred(length) {
  var arr = [];

  for (var i = 0; i < length; i++) {
    arr.push(deferred());
  }

  return arr;
}
function delay(ms, val) {
  if (val === void 0) {
    val = true;
  }

  var timeoutId;
  var promise = new Promise(function (resolve) {
    timeoutId = setTimeout(function () {
      return resolve(val);
    }, ms);
  });

  promise[CANCEL] = function () {
    return clearTimeout(timeoutId);
  };

  return promise;
}
function createMockTask() {
  var _ref;

  var running = true;

  var _result, _error;

  return _ref = {}, _ref[TASK] = true, _ref.isRunning = function isRunning() {
    return running;
  }, _ref.result = function result() {
    return _result;
  }, _ref.error = function error() {
    return _error;
  }, _ref.setRunning = function setRunning(b) {
    return running = b;
  }, _ref.setResult = function setResult(r) {
    return _result = r;
  }, _ref.setError = function setError(e) {
    return _error = e;
  }, _ref;
}
function autoInc(seed) {
  if (seed === void 0) {
    seed = 0;
  }

  return function () {
    return ++seed;
  };
}
var uid =
/*#__PURE__*/
autoInc();

var kThrow = function kThrow(err) {
  throw err;
};

var kReturn = function kReturn(value) {
  return {
    value: value,
    done: true
  };
};

function makeIterator(next, thro, name) {
  if (thro === void 0) {
    thro = kThrow;
  }

  if (name === void 0) {
    name = 'iterator';
  }

  var iterator = {
    name: name,
    next: next,
    throw: thro,
    return: kReturn
  };

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
  if (error === void 0) {
    error = '';
  }

  /*eslint-disable no-console*/
  if (typeof window === 'undefined') {
    console.log("redux-saga " + level + ": " + message + "\n" + (error && error.stack || error));
  } else {
    console[level](message, error);
  }
}


var internalErr = function internalErr(err) {
  return new Error("\n  redux-saga: Error checking hooks detected an inconsistent state. This is likely a bug\n  in redux-saga code and not yours. Thanks for reporting this in the project's github repo.\n  Error: " + err + "\n");
};
var createSetContextWarning = function createSetContextWarning(ctx, props) {
  return (ctx ? ctx + '.' : '') + "setContext(props): argument " + props + " is not a plain object";
};
var wrapSagaDispatch = function wrapSagaDispatch(dispatch) {
  return function (action) {
    return dispatch(Object.defineProperty(action, SAGA_ACTION, {
      value: true
    }));
  };
};

var cloneableGenerator = function cloneableGenerator(generatorFunc) {
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var history = [];
    var gen = generatorFunc.apply(void 0, args);
    return {
      next: function next(arg) {
        history.push(arg);
        return gen.next(arg);
      },
      clone: function clone() {
        var clonedGen = cloneableGenerator(generatorFunc).apply(void 0, args);
        history.forEach(function (arg) {
          return clonedGen.next(arg);
        });
        return clonedGen;
      },
      return: function _return(value) {
        return gen.return(value);
      },
      throw: function _throw(exception) {
        return gen.throw(exception);
      }
    };
  };
};

var BUFFER_OVERFLOW = "Channel's Buffer overflow!";
var ON_OVERFLOW_THROW = 1;
var ON_OVERFLOW_DROP = 2;
var ON_OVERFLOW_SLIDE = 3;
var ON_OVERFLOW_EXPAND = 4;
var zeroBuffer = {
  isEmpty: kTrue,
  put: noop,
  take: noop
};

function ringBuffer(limit, overflowAction) {
  if (limit === void 0) {
    limit = 10;
  }

  var arr = new Array(limit);
  var length = 0;
  var pushIndex = 0;
  var popIndex = 0;

  var push = function push(it) {
    arr[pushIndex] = it;
    pushIndex = (pushIndex + 1) % limit;
    length++;
  };

  var take = function take() {
    if (length != 0) {
      var it = arr[popIndex];
      arr[popIndex] = null;
      length--;
      popIndex = (popIndex + 1) % limit;
      return it;
    }
  };

  var flush = function flush() {
    var items = [];

    while (length) {
      items.push(take());
    }

    return items;
  };

  return {
    isEmpty: function isEmpty() {
      return length == 0;
    },
    put: function put(it) {
      if (length < limit) {
        push(it);
      } else {
        var doubledLimit;

        switch (overflowAction) {
          case ON_OVERFLOW_THROW:
            throw new Error(BUFFER_OVERFLOW);

          case ON_OVERFLOW_SLIDE:
            arr[pushIndex] = it;
            pushIndex = (pushIndex + 1) % limit;
            popIndex = pushIndex;
            break;

          case ON_OVERFLOW_EXPAND:
            doubledLimit = 2 * limit;
            arr = flush();
            length = arr.length;
            pushIndex = arr.length;
            popIndex = 0;
            arr.length = doubledLimit;
            limit = doubledLimit;
            push(it);
            break;

          default: // DROP

        }
      }
    },
    take: take,
    flush: flush
  };
}

var none = function none() {
  return zeroBuffer;
};
var fixed = function fixed(limit) {
  return ringBuffer(limit, ON_OVERFLOW_THROW);
};
var dropping = function dropping(limit) {
  return ringBuffer(limit, ON_OVERFLOW_DROP);
};
var sliding = function sliding(limit) {
  return ringBuffer(limit, ON_OVERFLOW_SLIDE);
};
var expanding = function expanding(initialSize) {
  return ringBuffer(initialSize, ON_OVERFLOW_EXPAND);
};



var buffers = Object.freeze({
	none: none,
	fixed: fixed,
	dropping: dropping,
	sliding: sliding,
	expanding: expanding
});

var queue = [];
/**
  Variable to hold a counting semaphore
  - Incrementing adds a lock and puts the scheduler in a `suspended` state (if it's not
    already suspended)
  - Decrementing releases a lock. Zero locks puts the scheduler in a `released` state. This
    triggers flushing the queued tasks.
**/

var semaphore = 0;
/**
  Executes a task 'atomically'. Tasks scheduled during this execution will be queued
  and flushed after this task has finished (assuming the scheduler endup in a released
  state).
**/

function exec(task) {
  try {
    suspend();
    task();
  } finally {
    release();
  }
}
/**
  Executes or queues a task depending on the state of the scheduler (`suspended` or `released`)
**/


function asap(task) {
  queue.push(task);

  if (!semaphore) {
    suspend();
    flush();
  }
}
/**
  Puts the scheduler in a `suspended` state. Scheduled tasks will be queued until the
  scheduler is released.
**/

function suspend() {
  semaphore++;
}
/**
  Puts the scheduler in a `released` state.
**/

function release() {
  semaphore--;
}
/**
  Releases the current lock. Executes all queued tasks if the scheduler is in the released state.
**/


function flush() {
  release();
  var task;

  while (!semaphore && (task = queue.shift()) !== undefined) {
    exec(task);
  }
}

var array$1 = function array$$1(patterns) {
  return function (input) {
    return patterns.some(function (p) {
      return matcher(p)(input);
    });
  };
};
var predicate = function predicate(_predicate) {
  return function (input) {
    return _predicate(input);
  };
};
var string = function string(pattern) {
  return function (input) {
    return input.type === String(pattern);
  };
};
var symbol = function symbol(pattern) {
  return function (input) {
    return input.type === pattern;
  };
};
var wildcard = function wildcard() {
  return kTrue;
};
function matcher(pattern) {
  // prettier-ignore
  var matcherCreator = pattern === '*' ? wildcard : is.string(pattern) ? string : is.array(pattern) ? array$1 : is.stringableFunc(pattern) ? string : is.func(pattern) ? predicate : is.symbol(pattern) ? symbol : null;

  if (matcherCreator === null) {
    throw new Error("invalid pattern: " + pattern);
  }

  return matcherCreator(pattern);
}

var END = {
  type: CHANNEL_END_TYPE
};
var isEnd = function isEnd(a) {
  return a && a.type === CHANNEL_END_TYPE;
};
var INVALID_BUFFER = 'invalid buffer passed to channel factory function';
var UNDEFINED_INPUT_ERROR = "Saga or channel was provided with an undefined action\nHints:\n  - check that your Action Creator returns a non-undefined value\n  - if the Saga was started using runSaga, check that your subscribe source provides the action to its listeners";
function channel(buffer) {
  if (buffer === void 0) {
    buffer = expanding();
  }

  var closed = false;
  var takers = [];

  {
    check(buffer, is.buffer, INVALID_BUFFER);
  }

  function checkForbiddenStates() {
    if (closed && takers.length) {
      throw internalErr('Cannot have a closed channel with pending takers');
    }

    if (takers.length && !buffer.isEmpty()) {
      throw internalErr('Cannot have pending takers with non empty buffer');
    }
  }

  function put(input) {
    checkForbiddenStates();

    {
      check(input, is.notUndef, UNDEFINED_INPUT_ERROR);
    }

    if (closed) {
      return;
    }

    if (!takers.length) {
      return buffer.put(input);
    }

    var cb = takers[0];
    takers.splice(0, 1);
    cb(input);
  }

  function take(cb) {
    checkForbiddenStates();

    {
      check(cb, is.func, "channel.take's callback must be a function");
    }

    if (closed && buffer.isEmpty()) {
      cb(END);
    } else if (!buffer.isEmpty()) {
      cb(buffer.take());
    } else {
      takers.push(cb);

      cb.cancel = function () {
        return remove(takers, cb);
      };
    }
  }

  function flush$$1(cb) {
    checkForbiddenStates(); // TODO: check if some new state should be forbidden now

    {
      check(cb, is.func, "channel.flush' callback must be a function");
    }

    if (closed && buffer.isEmpty()) {
      cb(END);
      return;
    }

    cb(buffer.flush());
  }

  function close() {
    checkForbiddenStates();

    if (!closed) {
      closed = true;

      if (takers.length) {
        var arr = takers;
        takers = [];

        for (var i = 0, len = arr.length; i < len; i++) {
          var taker = arr[i];
          taker(END);
        }
      }
    }
  }

  return {
    take: take,
    put: put,
    flush: flush$$1,
    close: close
  };
}
function eventChannel(subscribe, buffer) {
  if (buffer === void 0) {
    buffer = none();
  }

  var closed = false;
  var unsubscribe;
  var chan = channel(buffer);

  var close = function close() {
    if (is.func(unsubscribe)) {
      unsubscribe();
    }

    chan.close();
  };

  unsubscribe = subscribe(function (input) {
    if (isEnd(input)) {
      close();
      closed = true;
      return;
    }

    chan.put(input);
  });

  if (!is.func(unsubscribe)) {
    throw new Error('in eventChannel: subscribe should return a function to unsubscribe');
  }

  unsubscribe = once(unsubscribe);

  if (closed) {
    unsubscribe();
  }

  return {
    take: chan.take,
    flush: chan.flush,
    close: close
  };
}
function multicastChannel() {
  var _ref;

  var closed = false;
  var currentTakers = [];
  var nextTakers = currentTakers;

  var ensureCanMutateNextTakers = function ensureCanMutateNextTakers() {
    if (nextTakers !== currentTakers) {
      return;
    }

    nextTakers = currentTakers.slice();
  }; // TODO: check if its possible to extract closing function and reuse it in both unicasts and multicasts


  var close = function close() {
    closed = true;
    var takers = currentTakers = nextTakers;

    for (var i = 0; i < takers.length; i++) {
      var taker = takers[i];
      taker(END);
    }

    nextTakers = [];
  };

  return _ref = {}, _ref[MULTICAST] = true, _ref.put = function put(input) {
    // TODO: should I check forbidden state here? 1 of them is even impossible
    // as we do not possibility of buffer here
    {
      check(input, is.notUndef, UNDEFINED_INPUT_ERROR);
    }

    if (closed) {
      return;
    }

    if (isEnd(input)) {
      close();
      return;
    }

    var takers = currentTakers = nextTakers;

    for (var i = 0; i < takers.length; i++) {
      var taker = takers[i];

      if (taker[MATCH](input)) {
        taker.cancel();
        taker(input);
      }
    }
  }, _ref.take = function take(cb, matcher$$1) {
    if (matcher$$1 === void 0) {
      matcher$$1 = wildcard;
    }

    if (closed) {
      cb(END);
      return;
    }

    cb[MATCH] = matcher$$1;
    ensureCanMutateNextTakers();
    nextTakers.push(cb);
    cb.cancel = once(function () {
      ensureCanMutateNextTakers();
      remove(nextTakers, cb);
    });
  }, _ref.close = close, _ref;
}
function stdChannel() {
  var chan = multicastChannel();
  var put = chan.put;

  chan.put = function (input) {
    if (input[SAGA_ACTION]) {
      put(input);
      return;
    }

    asap(function () {
      return put(input);
    });
  };

  return chan;
}

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Used for built-in method references. */

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */

/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

function symbolObservablePonyfill(root) {
	var result;
	var Symbol = root.Symbol;

	if (typeof Symbol === 'function') {
		if (Symbol.observable) {
			result = Symbol.observable;
		} else {
			result = Symbol('observable');
			Symbol.observable = result;
		}
	} else {
		result = '@@observable';
	}

	return result;
}

/* global window */
var root$2;

if (typeof self !== 'undefined') {
  root$2 = self;
} else if (typeof window !== 'undefined') {
  root$2 = window;
} else if (typeof global !== 'undefined') {
  root$2 = global;
} else if (typeof module !== 'undefined') {
  root$2 = module;
} else {
  root$2 = Function('return this')();
}

var result = symbolObservablePonyfill(root$2);

/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */

/**
 * Prints a warning in the console if it exists.
 *
 * @param {String} message The warning message.
 * @returns {void}
 */
function warning(message) {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message);
  }
  /* eslint-enable no-console */
  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw new Error(message);
    /* eslint-disable no-empty */
  } catch (e) {}
  /* eslint-enable no-empty */
}

/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */

function compose() {
  for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  if (funcs.length === 0) {
    return function (arg) {
      return arg;
    };
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce(function (a, b) {
    return function () {
      return a(b.apply(undefined, arguments));
    };
  });
}

/*
* This is a dummy function to check if the function name has been altered by minification.
* If the function has been minified and NODE_ENV !== 'production', warn the user.
*/
function isCrushed() {}

if ("development" !== 'production' && typeof isCrushed.name === 'string' && isCrushed.name !== 'isCrushed') {
  warning('You are currently using minified code outside of NODE_ENV === \'production\'. ' + 'This means that you are running a slower development build of Redux. ' + 'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' + 'or DefinePlugin for webpack (http://stackoverflow.com/questions/30030031) ' + 'to ensure you have the correct code for your production build.');
}

var done = {
  done: true,
  value: undefined
};
var qEnd = {};
function safeName(patternOrChannel) {
  if (is.channel(patternOrChannel)) {
    return 'channel';
  }

  if (is.stringableFunc(patternOrChannel)) {
    return String(patternOrChannel);
  }

  if (is.func(patternOrChannel)) {
    return patternOrChannel.name;
  }

  return String(patternOrChannel);
}
function fsmIterator(fsm, q0, name) {
  var updateState,
      qNext = q0;

  function next(arg, error) {
    if (qNext === qEnd) {
      return done;
    }

    if (error) {
      qNext = qEnd;
      throw error;
    } else {
      updateState && updateState(arg);

      var _fsm$qNext = fsm[qNext](),
          q = _fsm$qNext[0],
          output = _fsm$qNext[1],
          _updateState = _fsm$qNext[2];

      qNext = q;
      updateState = _updateState;
      return qNext === qEnd ? done : output;
    }
  }

  return makeIterator(next, function (error) {
    return next(null, error);
  }, name);
}

function takeEvery$1(patternOrChannel, worker) {
  for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  var yTake = {
    done: false,
    value: take(patternOrChannel)
  };

  var yFork = function yFork(ac) {
    return {
      done: false,
      value: fork.apply(void 0, [worker].concat(args, [ac]))
    };
  };

  var action,
      setAction = function setAction(ac) {
    return action = ac;
  };

  return fsmIterator({
    q1: function q1() {
      return ['q2', yTake, setAction];
    },
    q2: function q2() {
      return action === END ? [qEnd] : ['q1', yFork(action)];
    }
  }, 'q1', "takeEvery(" + safeName(patternOrChannel) + ", " + worker.name + ")");
}

function takeLatest$1(patternOrChannel, worker) {
  for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  var yTake = {
    done: false,
    value: take(patternOrChannel)
  };

  var yFork = function yFork(ac) {
    return {
      done: false,
      value: fork.apply(void 0, [worker].concat(args, [ac]))
    };
  };

  var yCancel = function yCancel(task) {
    return {
      done: false,
      value: cancel(task)
    };
  };

  var task, action;

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
      return action === END ? [qEnd] : task ? ['q3', yCancel(task)] : ['q1', yFork(action), setTask];
    },
    q3: function q3() {
      return ['q1', yFork(action), setTask];
    }
  }, 'q1', "takeLatest(" + safeName(patternOrChannel) + ", " + worker.name + ")");
}

function throttle$1(delayLength, pattern, worker) {
  for (var _len = arguments.length, args = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
    args[_key - 3] = arguments[_key];
  }

  var action, channel$$1;
  var yActionChannel = {
    done: false,
    value: actionChannel(pattern, sliding(1))
  };

  var yTake = function yTake() {
    return {
      done: false,
      value: take(channel$$1)
    };
  };

  var yFork = function yFork(ac) {
    return {
      done: false,
      value: fork.apply(void 0, [worker].concat(args, [ac]))
    };
  };

  var yDelay = {
    done: false,
    value: call(delay, delayLength)
  };

  var setAction = function setAction(ac) {
    return action = ac;
  };

  var setChannel = function setChannel(ch) {
    return channel$$1 = ch;
  };

  return fsmIterator({
    q1: function q1() {
      return ['q2', yActionChannel, setChannel];
    },
    q2: function q2() {
      return ['q3', yTake(), setAction];
    },
    q3: function q3() {
      return action === END ? [qEnd] : ['q4', yFork(action)];
    },
    q4: function q4() {
      return ['q2', yDelay];
    }
  }, 'q1', "throttle(" + safeName(pattern) + ", " + worker.name + ")");
}

var TAKE = 'TAKE';
var PUT = 'PUT';
var ALL = 'ALL';
var RACE = 'RACE';
var CALL = 'CALL';
var CPS = 'CPS';
var FORK = 'FORK';
var JOIN = 'JOIN';
var CANCEL$1 = 'CANCEL';
var SELECT = 'SELECT';
var ACTION_CHANNEL = 'ACTION_CHANNEL';
var CANCELLED = 'CANCELLED';
var FLUSH = 'FLUSH';
var GET_CONTEXT = 'GET_CONTEXT';
var SET_CONTEXT = 'SET_CONTEXT';
var TEST_HINT = '\n(HINT: if you are getting this errors in tests, consider using createMockTask from redux-saga/utils)';

var effect = function effect(type, payload) {
  var _ref;

  return _ref = {}, _ref[IO] = true, _ref[type] = payload, _ref;
};

var detach = function detach(eff) {
  {
    check(asEffect.fork(eff), is.object, 'detach(eff): argument must be a fork effect');
  }

  eff[FORK].detached = true;
  return eff;
};
function take(patternOrChannel, multicastPattern) {
  if (patternOrChannel === void 0) {
    patternOrChannel = '*';
  }

  if ("development" === 'development' && arguments.length) {
    check(arguments[0], is.notUndef, 'take(patternOrChannel): patternOrChannel is undefined');
  }

  if (is.pattern(patternOrChannel)) {
    return effect(TAKE, {
      pattern: patternOrChannel
    });
  }

  if (is.multicast(patternOrChannel) && is.notUndef(multicastPattern) && is.pattern(multicastPattern)) {
    return effect(TAKE, {
      channel: patternOrChannel,
      pattern: multicastPattern
    });
  }

  if (is.channel(patternOrChannel)) {
    return effect(TAKE, {
      channel: patternOrChannel
    });
  }

  throw new Error("take(patternOrChannel): argument " + patternOrChannel + " is not valid channel or a valid pattern");
}

var takeMaybe = function takeMaybe() {
  var eff = take.apply(void 0, arguments);
  eff[TAKE].maybe = true;
  return eff;
};

function put(channel, action) {
  {
    if (arguments.length > 1) {
      check(channel, is.notUndef, 'put(channel, action): argument channel is undefined');
      check(channel, is.channel, "put(channel, action): argument " + channel + " is not a valid channel");
      check(action, is.notUndef, 'put(channel, action): argument action is undefined');
    } else {
      check(channel, is.notUndef, 'put(action): argument action is undefined');
    }
  }

  if (is.undef(action)) {
    action = channel;
    channel = null;
  }

  return effect(PUT, {
    channel: channel,
    action: action
  });
}

var putResolve = function putResolve() {
  var eff = put.apply(void 0, arguments);
  eff[PUT].resolve = true;
  return eff;
};

function all(effects) {
  return effect(ALL, effects);
}
function race(effects) {
  return effect(RACE, effects);
}

function getFnCallDesc(meth, fn, args) {
  {
    check(fn, is.notUndef, meth + ": argument fn is undefined");
  }

  var context = null;

  if (is.array(fn)) {
    var _fn = fn;
    context = _fn[0];
    fn = _fn[1];
  } else if (fn.fn) {
    var _fn2 = fn;
    context = _fn2.context;
    fn = _fn2.fn;
  }

  if (context && is.string(fn) && is.func(context[fn])) {
    fn = context[fn];
  }

  {
    check(fn, is.func, meth + ": argument " + fn + " is not a function");
  }

  return {
    context: context,
    fn: fn,
    args: args
  };
}

function call(fn) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  return effect(CALL, getFnCallDesc('call', fn, args));
}
function apply(context, fn, args) {
  if (args === void 0) {
    args = [];
  }

  return effect(CALL, getFnCallDesc('apply', {
    context: context,
    fn: fn
  }, args));
}
function cps(fn) {
  for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }

  return effect(CPS, getFnCallDesc('cps', fn, args));
}
function fork(fn) {
  for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
    args[_key3 - 1] = arguments[_key3];
  }

  return effect(FORK, getFnCallDesc('fork', fn, args));
}
function spawn(fn) {
  for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
    args[_key4 - 1] = arguments[_key4];
  }

  return detach(fork.apply(void 0, [fn].concat(args)));
}
function join() {
  for (var _len5 = arguments.length, tasks = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
    tasks[_key5] = arguments[_key5];
  }

  if (tasks.length > 1) {
    return all(tasks.map(function (t) {
      return join(t);
    }));
  }

  var task = tasks[0];

  {
    check(task, is.notUndef, 'join(task): argument task is undefined');
    check(task, is.task, "join(task): argument " + task + " is not a valid Task object " + TEST_HINT);
  }

  return effect(JOIN, task);
}
function cancel() {
  for (var _len6 = arguments.length, tasks = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
    tasks[_key6] = arguments[_key6];
  }

  if (tasks.length > 1) {
    return all(tasks.map(function (t) {
      return cancel(t);
    }));
  }

  var task = tasks[0];

  if ("development" === 'development' && tasks.length === 1) {
    check(task, is.notUndef, 'cancel(task): argument task is undefined');
    check(task, is.task, "cancel(task): argument " + task + " is not a valid Task object " + TEST_HINT);
  }

  return effect(CANCEL$1, task || SELF_CANCELLATION);
}
function select(selector) {
  if (selector === void 0) {
    selector = identity;
  }

  for (var _len7 = arguments.length, args = new Array(_len7 > 1 ? _len7 - 1 : 0), _key7 = 1; _key7 < _len7; _key7++) {
    args[_key7 - 1] = arguments[_key7];
  }

  if ("development" === 'development' && arguments.length) {
    check(arguments[0], is.notUndef, 'select(selector, [...]): argument selector is undefined');
    check(selector, is.func, "select(selector, [...]): argument " + selector + " is not a function");
  }

  return effect(SELECT, {
    selector: selector,
    args: args
  });
}
/**
  channel(pattern, [buffer])    => creates a proxy channel for store actions
**/

function actionChannel(pattern, buffer) {
  {
    check(pattern, is.notUndef, 'actionChannel(pattern,...): argument pattern is undefined');

    if (arguments.length > 1) {
      check(buffer, is.notUndef, 'actionChannel(pattern, buffer): argument buffer is undefined');
      check(buffer, is.buffer, "actionChannel(pattern, buffer): argument " + buffer + " is not a valid buffer");
    }
  }

  return effect(ACTION_CHANNEL, {
    pattern: pattern,
    buffer: buffer
  });
}
function cancelled() {
  return effect(CANCELLED, {});
}
function flush$1(channel) {
  {
    check(channel, is.channel, "flush(channel): argument " + channel + " is not valid channel");
  }

  return effect(FLUSH, channel);
}
function getContext(prop) {
  {
    check(prop, is.string, "getContext(prop): argument " + prop + " is not a string");
  }

  return effect(GET_CONTEXT, prop);
}
function setContext(props) {
  {
    check(props, is.object, createSetContextWarning(null, props));
  }

  return effect(SET_CONTEXT, props);
}
function takeEvery(patternOrChannel, worker) {
  for (var _len8 = arguments.length, args = new Array(_len8 > 2 ? _len8 - 2 : 0), _key8 = 2; _key8 < _len8; _key8++) {
    args[_key8 - 2] = arguments[_key8];
  }

  return fork.apply(void 0, [takeEvery$1, patternOrChannel, worker].concat(args));
}
function takeLatest(patternOrChannel, worker) {
  for (var _len9 = arguments.length, args = new Array(_len9 > 2 ? _len9 - 2 : 0), _key9 = 2; _key9 < _len9; _key9++) {
    args[_key9 - 2] = arguments[_key9];
  }

  return fork.apply(void 0, [takeLatest$1, patternOrChannel, worker].concat(args));
}
function throttle(ms, pattern, worker) {
  for (var _len10 = arguments.length, args = new Array(_len10 > 3 ? _len10 - 3 : 0), _key10 = 3; _key10 < _len10; _key10++) {
    args[_key10 - 3] = arguments[_key10];
  }

  return fork.apply(void 0, [throttle$1, ms, pattern, worker].concat(args));
}

var createAsEffectType = function createAsEffectType(type) {
  return function (effect) {
    return effect && effect[IO] && effect[type];
  };
};

var asEffect = {
  take:
  /*#__PURE__*/
  createAsEffectType(TAKE),
  put:
  /*#__PURE__*/
  createAsEffectType(PUT),
  all:
  /*#__PURE__*/
  createAsEffectType(ALL),
  race:
  /*#__PURE__*/
  createAsEffectType(RACE),
  call:
  /*#__PURE__*/
  createAsEffectType(CALL),
  cps:
  /*#__PURE__*/
  createAsEffectType(CPS),
  fork:
  /*#__PURE__*/
  createAsEffectType(FORK),
  join:
  /*#__PURE__*/
  createAsEffectType(JOIN),
  cancel:
  /*#__PURE__*/
  createAsEffectType(CANCEL$1),
  select:
  /*#__PURE__*/
  createAsEffectType(SELECT),
  actionChannel:
  /*#__PURE__*/
  createAsEffectType(ACTION_CHANNEL),
  cancelled:
  /*#__PURE__*/
  createAsEffectType(CANCELLED),
  flush:
  /*#__PURE__*/
  createAsEffectType(FLUSH),
  getContext:
  /*#__PURE__*/
  createAsEffectType(GET_CONTEXT),
  setContext:
  /*#__PURE__*/
  createAsEffectType(SET_CONTEXT)
};

// also check again whats the difference between CHANNEL_END and CHANNEL_END_TYPE
// maybe this could become MAYBE_END
// I guess this gets exported so takeMaybe result can be checked

var CHANNEL_END$1 = {
  toString: function toString() {
    return CHANNEL_END;
  }
};
var TASK_CANCEL$1 = {
  toString: function toString() {
    return TASK_CANCEL;
  }
};
/**
  Used to track a parent task and its forks
  In the new fork model, forked tasks are attached by default to their parent
  We model this using the concept of Parent task && main Task
  main task is the main flow of the current Generator, the parent tasks is the
  aggregation of the main tasks + all its forked tasks.
  Thus the whole model represents an execution tree with multiple branches (vs the
  linear execution tree in sequential (non parallel) programming)

  A parent tasks has the following semantics
  - It completes if all its forks either complete or all cancelled
  - If it's cancelled, all forks are cancelled as well
  - It aborts if any uncaught error bubbles up from forks
  - If it completes, the return value is the one returned by the main task
**/

function forkQueue(name, mainTask, cb) {
  var tasks = [],
      result,
      completed = false;
  addTask(mainTask);

  function abort(err) {
    cancelAll();
    cb(err, true);
  }

  function addTask(task) {
    tasks.push(task);

    task.cont = function (res, isErr) {
      if (completed) {
        return;
      }

      remove(tasks, task);
      task.cont = noop;

      if (isErr) {
        abort(res);
      } else {
        if (task === mainTask) {
          result = res;
        }

        if (!tasks.length) {
          completed = true;
          cb(result);
        }
      }
    }; // task.cont.cancel = task.cancel

  }

  function cancelAll() {
    if (completed) {
      return;
    }

    completed = true;
    tasks.forEach(function (t) {
      t.cont = noop;
      t.cancel();
    });
    tasks = [];
  }

  return {
    addTask: addTask,
    cancelAll: cancelAll,
    abort: abort,
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

function createTaskIterator(_ref) {
  var context = _ref.context,
      fn = _ref.fn,
      args = _ref.args;

  if (is.iterator(fn)) {
    return fn;
  } // catch synchronous failures; see #152 and #441


  var result, error;

  try {
    result = fn.apply(context, args);
  } catch (err) {
    error = err;
  } // i.e. a generator function returns an iterator


  if (is.iterator(result)) {
    return result;
  } // do not bubble up synchronous failures for detached forks
  // instead create a failed task. See #152 and #441


  return error ? makeIterator(function () {
    throw error;
  }) : makeIterator(function () {
    var pc;
    var eff = {
      done: false,
      value: result
    };

    var ret = function ret(value) {
      return {
        done: true,
        value: value
      };
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

function proc(iterator, stdChannel$$1, dispatch, getState, parentContext, options, parentEffectId, name, cont) {
  if (dispatch === void 0) {
    dispatch = noop;
  }

  if (getState === void 0) {
    getState = noop;
  }

  if (parentContext === void 0) {
    parentContext = {};
  }

  if (options === void 0) {
    options = {};
  }

  if (parentEffectId === void 0) {
    parentEffectId = 0;
  }

  if (name === void 0) {
    name = 'anonymous';
  }

  var _options = options,
      sagaMonitor = _options.sagaMonitor,
      logger = _options.logger,
      onError = _options.onError,
      middleware = _options.middleware;
  var log$$1 = logger || log;

  var logError = function logError(err) {
    var message = err.sagaStack;

    if (!message && err.stack) {
      message = err.stack.split('\n')[0].indexOf(err.message) !== -1 ? err.stack : "Error: " + err.message + "\n" + err.stack;
    }

    log$$1('error', "uncaught at " + name, message || err.message || err);
  };

  var taskContext = Object.create(parentContext);
  /**
    Tracks the current effect cancellation
    Each time the generator progresses. calling runEffect will set a new value
    on it. It allows propagating cancellation to child effects
  **/

  next.cancel = noop;
  /**
    Creates a new task descriptor for this generator, We'll also create a main task
    to track the main flow (besides other forked tasks)
  **/

  var task = newTask(parentEffectId, name, iterator, cont);
  var mainTask = {
    name: name,
    cancel: cancelMain,
    isRunning: true
  };
  var taskQueue = forkQueue(name, mainTask, end);
  /**
    cancellation of the main task. We'll simply resume the Generator with a Cancel
  **/

  function cancelMain() {
    if (mainTask.isRunning && !mainTask.isCancelled) {
      mainTask.isCancelled = true;
      next(TASK_CANCEL$1);
    }
  }
  /**
    This may be called by a parent generator to trigger/propagate cancellation
    cancel all pending tasks (including the main task), then end the current task.
     Cancellation propagates down to the whole execution tree holded by this Parent task
    It's also propagated to all joiners of this task and their execution tree/joiners
     Cancellation is noop for terminated/Cancelled tasks tasks
  **/


  function cancel$$1() {
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

      end(TASK_CANCEL$1);
    }
  }
  /**
    attaches cancellation logic to this task's continuation
    this will permit cancellation to propagate down the call chain
  **/


  cont && (cont.cancel = cancel$$1); // tracks the running status

  iterator._isRunning = true; // kicks up the generator

  next(); // then return the task descriptor to the caller

  return task;
  /**
    This is the generator driver
    It's a recursive async/continuation function which calls itself
    until the generator terminates or throws
  **/

  function next(arg, isErr) {
    // Preventive measure. If we end up here, then there is really something wrong
    if (!mainTask.isRunning) {
      throw new Error('Trying to resume an already finished generator');
    }

    try {
      var result;

      if (isErr) {
        result = iterator.throw(arg);
      } else if (arg === TASK_CANCEL$1) {
        /**
          getting TASK_CANCEL automatically cancels the main task
          We can get this value here
           - By cancelling the parent task manually
          - By joining a Cancelled task
        **/
        mainTask.isCancelled = true;
        /**
          Cancels the current effect; this will propagate the cancellation down to any called tasks
        **/

        next.cancel();
        /**
          If this Generator has a `return` method then invokes it
          This will jump to the finally block
        **/

        result = is.func(iterator.return) ? iterator.return(TASK_CANCEL$1) : {
          done: true,
          value: TASK_CANCEL$1
        };
      } else if (arg === CHANNEL_END$1) {
        // We get CHANNEL_END by taking from a channel that ended using `take` (and not `takem` used to trap End of channels)
        result = is.func(iterator.return) ? iterator.return() : {
          done: true
        };
      } else {
        result = iterator.next(arg);
      }

      if (!result.done) {
        digestEffect(result.value, parentEffectId, '', next);
      } else {
        /**
          This Generator has ended, terminate the main task and notify the fork queue
        **/
        mainTask.isMainRunning = false;
        mainTask.cont && mainTask.cont(result.value);
      }
    } catch (error) {
      if (mainTask.isCancelled) {
        logError(error);
      }

      mainTask.isMainRunning = false;
      mainTask.cont(error, true);
    }
  }

  function end(result, isErr) {
    iterator._isRunning = false; // stdChannel.close()

    if (!isErr) {
      iterator._result = result;
      iterator._deferredEnd && iterator._deferredEnd.resolve(result);
    } else {
      if (result instanceof Error) {
        Object.defineProperty(result, 'sagaStack', {
          value: "at " + name + " \n " + (result.sagaStack || result.stack),
          configurable: true
        });
      }

      if (!task.cont) {
        if (result instanceof Error && onError) {
          onError(result);
        } else {
          // TODO: could we skip this when _deferredEnd is attached?
          logError(result);
        }
      }

      iterator._error = result;
      iterator._isAborted = true;
      iterator._deferredEnd && iterator._deferredEnd.reject(result);
    }

    task.cont && task.cont(result, isErr);
    task.joiners.forEach(function (j) {
      return j.cb(result, isErr);
    });
    task.joiners = null;
  }

  function runEffect(effect, effectId, label, currCb) {
    if (label === void 0) {
      label = '';
    }

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
    var data; // prettier-ignore

    return (// Non declarative effect
      is.promise(effect) ? resolvePromise(effect, currCb) : is.iterator(effect) ? resolveIterator(effect, effectId, name, currCb) // declarative effects
      : (data = asEffect.take(effect)) ? runTakeEffect(data, currCb) : (data = asEffect.put(effect)) ? runPutEffect(data, currCb) : (data = asEffect.all(effect)) ? runAllEffect(data, effectId, currCb) : (data = asEffect.race(effect)) ? runRaceEffect(data, effectId, currCb) : (data = asEffect.call(effect)) ? runCallEffect(data, effectId, currCb) : (data = asEffect.cps(effect)) ? runCPSEffect(data, currCb) : (data = asEffect.fork(effect)) ? runForkEffect(data, effectId, currCb) : (data = asEffect.join(effect)) ? runJoinEffect(data, currCb) : (data = asEffect.cancel(effect)) ? runCancelEffect(data, currCb) : (data = asEffect.select(effect)) ? runSelectEffect(data, currCb) : (data = asEffect.actionChannel(effect)) ? runChannelEffect(data, currCb) : (data = asEffect.flush(effect)) ? runFlushEffect(data, currCb) : (data = asEffect.cancelled(effect)) ? runCancelledEffect(data, currCb) : (data = asEffect.getContext(effect)) ? runGetContextEffect(data, currCb) : (data = asEffect.setContext(effect)) ? runSetContextEffect(data, currCb) :
      /* anything else returned as is */
      currCb(effect)
    );
  }

  function digestEffect(effect, parentEffectId, label, cb) {
    if (label === void 0) {
      label = '';
    }

    var effectId = uid();
    sagaMonitor && sagaMonitor.effectTriggered({
      effectId: effectId,
      parentEffectId: parentEffectId,
      label: label,
      effect: effect
    });
    /**
      completion callback and cancel callback are mutually exclusive
      We can't cancel an already completed effect
      And We can't complete an already cancelled effectId
    **/

    var effectSettled; // Completion callback passed to the appropriate effect runner

    function currCb(res, isErr) {
      if (effectSettled) {
        return;
      }

      effectSettled = true;
      cb.cancel = noop; // defensive measure

      if (sagaMonitor) {
        isErr ? sagaMonitor.effectRejected(effectId, res) : sagaMonitor.effectResolved(effectId, res);
      }

      cb(res, isErr);
    } // tracks down the current cancel


    currCb.cancel = noop; // setup cancellation logic on the parent cb

    cb.cancel = function () {
      // prevents cancelling an already completed effect
      if (effectSettled) {
        return;
      }

      effectSettled = true;
      /**
        propagates cancel downward
        catch uncaught cancellations errors; since we can no longer call the completion
        callback, log errors raised during cancellations into the console
      **/

      try {
        currCb.cancel();
      } catch (err) {
        logError(err);
      }

      currCb.cancel = noop; // defensive measure

      sagaMonitor && sagaMonitor.effectCancelled(effectId);
    }; // if one can find a way to decouple runEffect from closure variables
    // so it could be the call to it could be referentially transparent
    // this potentially could be simplified, finalRunEffect created beforehand
    // and this part of the code wouldnt have to know about middleware stuff


    if (is.func(middleware)) {
      middleware(function (eff) {
        return runEffect(eff, effectId, label, currCb);
      })(effect);
      return;
    }

    runEffect(effect, effectId, label, currCb);
  }

  function resolvePromise(promise, cb) {
    var cancelPromise = promise[CANCEL];

    if (is.func(cancelPromise)) {
      cb.cancel = cancelPromise;
    } else if (is.func(promise.abort)) {
      cb.cancel = function () {
        return promise.abort();
      };
    }

    promise.then(cb, function (error) {
      return cb(error, true);
    });
  }

  function resolveIterator(iterator, effectId, name, cb) {
    proc(iterator, stdChannel$$1, dispatch, getState, taskContext, options, effectId, name, cb);
  }

  function runTakeEffect(_ref2, cb) {
    var _ref2$channel = _ref2.channel,
        channel$$1 = _ref2$channel === void 0 ? stdChannel$$1 : _ref2$channel,
        pattern = _ref2.pattern,
        maybe = _ref2.maybe;

    var takeCb = function takeCb(input) {
      if (input instanceof Error) {
        cb(input, true);
        return;
      }

      if (isEnd(input) && !maybe) {
        cb(CHANNEL_END$1);
        return;
      }

      cb(input);
    };

    try {
      channel$$1.take(takeCb, is.notUndef(pattern) ? matcher(pattern) : null);
    } catch (err) {
      cb(err, true);
      return;
    }

    cb.cancel = takeCb.cancel;
  }

  function runPutEffect(_ref3, cb) {
    var channel$$1 = _ref3.channel,
        action = _ref3.action,
        resolve = _ref3.resolve;

    /**
      Schedule the put in case another saga is holding a lock.
      The put will be executed atomically. ie nested puts will execute after
      this put has terminated.
    **/
    asap(function () {
      var result;

      try {
        result = (channel$$1 ? channel$$1.put : dispatch)(action);
      } catch (error) {
        logError(error); // TODO: should such error here be passed to `onError`?
        // or is it already if we dropped error swallowing

        cb(error, true);
        return;
      }

      if (resolve && is.promise(result)) {
        resolvePromise(result, cb);
      } else {
        cb(result);
        return;
      }
    }); // Put effects are non cancellables
  }

  function runCallEffect(_ref4, effectId, cb) {
    var context = _ref4.context,
        fn = _ref4.fn,
        args = _ref4.args;
    var result; // catch synchronous failures; see #152

    try {
      result = fn.apply(context, args);
    } catch (error) {
      cb(error, true);
      return;
    }

    return is.promise(result) ? resolvePromise(result, cb) : is.iterator(result) ? resolveIterator(result, effectId, fn.name, cb) : cb(result);
  }

  function runCPSEffect(_ref5, cb) {
    var context = _ref5.context,
        fn = _ref5.fn,
        args = _ref5.args;

    // CPS (ie node style functions) can define their own cancellation logic
    // by setting cancel field on the cb
    // catch synchronous failures; see #152
    try {
      var cpsCb = function cpsCb(err, res) {
        return is.undef(err) ? cb(res) : cb(err, true);
      };

      fn.apply(context, args.concat(cpsCb));

      if (cpsCb.cancel) {
        cb.cancel = function () {
          return cpsCb.cancel();
        };
      }
    } catch (error) {
      cb(error, true);
      return;
    }
  }

  function runForkEffect(_ref6, effectId, cb) {
    var context = _ref6.context,
        fn = _ref6.fn,
        args = _ref6.args,
        detached = _ref6.detached;
    var taskIterator = createTaskIterator({
      context: context,
      fn: fn,
      args: args
    });

    try {
      suspend();

      var _task = proc(taskIterator, stdChannel$$1, dispatch, getState, taskContext, options, effectId, fn.name, detached ? null : noop);

      if (detached) {
        cb(_task);
      } else {
        if (taskIterator._isRunning) {
          taskQueue.addTask(_task);
          cb(_task);
        } else if (taskIterator._error) {
          taskQueue.abort(taskIterator._error);
        } else {
          cb(_task);
        }
      }
    } finally {
      flush();
    } // Fork effects are non cancellables

  }

  function runJoinEffect(t, cb) {
    if (t.isRunning()) {
      var joiner = {
        task: task,
        cb: cb
      };

      cb.cancel = function () {
        return remove(t.joiners, joiner);
      };

      t.joiners.push(joiner);
    } else {
      t.isAborted() ? cb(t.error(), true) : cb(t.result());
    }
  }

  function runCancelEffect(taskToCancel, cb) {
    if (taskToCancel === SELF_CANCELLATION) {
      taskToCancel = task;
    }

    if (taskToCancel.isRunning()) {
      taskToCancel.cancel();
    }

    cb(); // cancel effects are non cancellables
  }

  function runAllEffect(effects, effectId, cb) {
    var keys = Object.keys(effects);

    if (!keys.length) {
      cb(is.array(effects) ? [] : {});
      return;
    }

    var completedCount = 0;
    var completed;
    var results = {};
    var childCbs = {};

    function checkEffectEnd() {
      if (completedCount === keys.length) {
        completed = true;
        cb(is.array(effects) ? array.from(_extends({}, results, {
          length: keys.length
        })) : results);
      }
    }

    keys.forEach(function (key) {
      var chCbAtKey = function chCbAtKey(res, isErr) {
        if (completed) {
          return;
        }

        if (isErr || isEnd(res) || res === CHANNEL_END$1 || res === TASK_CANCEL$1) {
          cb.cancel();
          cb(res, isErr);
        } else {
          results[key] = res;
          completedCount++;
          checkEffectEnd();
        }
      };

      chCbAtKey.cancel = noop;
      childCbs[key] = chCbAtKey;
    });

    cb.cancel = function () {
      if (!completed) {
        completed = true;
        keys.forEach(function (key) {
          return childCbs[key].cancel();
        });
      }
    };

    keys.forEach(function (key) {
      return digestEffect(effects[key], effectId, key, childCbs[key]);
    });
  }

  function runRaceEffect(effects, effectId, cb) {
    var completed;
    var keys = Object.keys(effects);
    var childCbs = {};
    keys.forEach(function (key) {
      var chCbAtKey = function chCbAtKey(res, isErr) {
        if (completed) {
          return;
        }

        if (isErr) {
          // Race Auto cancellation
          cb.cancel();
          cb(res, true);
        } else if (!isEnd(res) && res !== CHANNEL_END$1 && res !== TASK_CANCEL$1) {
          var _response;

          cb.cancel();
          completed = true;
          var response = (_response = {}, _response[key] = res, _response);
          cb(is.array(effects) ? [].slice.call(_extends({}, response, {
            length: keys.length
          })) : response);
        }
      };

      chCbAtKey.cancel = noop;
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
      if (completed) {
        return;
      }

      digestEffect(effects[key], effectId, key, childCbs[key]);
    });
  }

  function runSelectEffect(_ref7, cb) {
    var selector = _ref7.selector,
        args = _ref7.args;

    try {
      var state = selector.apply(void 0, [getState()].concat(args));
      cb(state);
    } catch (error) {
      cb(error, true);
    }
  }

  function runChannelEffect(_ref8, cb) {
    var pattern = _ref8.pattern,
        buffer = _ref8.buffer;
    // TODO: rethink how END is handled
    var chan = channel(buffer);
    var match = matcher(pattern);

    var taker = function taker(action) {
      if (!isEnd(action)) {
        stdChannel$$1.take(taker, match);
      }

      chan.put(action);
    };

    stdChannel$$1.take(taker, match);
    cb(chan);
  }

  function runCancelledEffect(data, cb) {
    cb(!!mainTask.isCancelled);
  }

  function runFlushEffect(channel$$1, cb) {
    channel$$1.flush(cb);
  }

  function runGetContextEffect(prop, cb) {
    cb(taskContext[prop]);
  }

  function runSetContextEffect(props, cb) {
    object.assign(taskContext, props);
    cb();
  }

  function newTask(id, name, iterator, cont) {
    var _ref9;

    iterator._deferredEnd = null;
    return _ref9 = {}, _ref9[TASK] = true, _ref9.id = id, _ref9.name = name, _ref9.toPromise = function toPromise() {
      if (iterator._deferredEnd) {
        return iterator._deferredEnd.promise;
      }

      var def = deferred();
      iterator._deferredEnd = def;

      if (!iterator._isRunning) {
        if (iterator._isAborted) {
          def.reject(iterator._error);
        } else {
          def.resolve(iterator._result);
        }
      }

      return def.promise;
    }, _ref9.cont = cont, _ref9.joiners = [], _ref9.cancel = cancel$$1, _ref9.isRunning = function isRunning() {
      return iterator._isRunning;
    }, _ref9.isCancelled = function isCancelled() {
      return iterator._isCancelled;
    }, _ref9.isAborted = function isAborted() {
      return iterator._isAborted;
    }, _ref9.result = function result() {
      return iterator._result;
    }, _ref9.error = function error() {
      return iterator._error;
    }, _ref9.setContext = function setContext$$1(props) {
      {
        check(props, is.object, createSetContextWarning('task', props));
      }

      object.assign(taskContext, props);
    }, _ref9;
  }
}

var RUN_SAGA_SIGNATURE = 'runSaga(options, saga, ...args)';
var NON_GENERATOR_ERR = RUN_SAGA_SIGNATURE + ": saga argument must be a Generator function!";
function runSaga(options, saga) {
  for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  {
    check(saga, is.func, NON_GENERATOR_ERR);
  }

  var iterator = saga.apply(void 0, args);

  {
    check(iterator, is.iterator, NON_GENERATOR_ERR);
  }

  var _options$channel = options.channel,
      channel$$1 = _options$channel === void 0 ? stdChannel() : _options$channel,
      dispatch = options.dispatch,
      getState = options.getState,
      context = options.context,
      sagaMonitor = options.sagaMonitor,
      logger = options.logger,
      effectMiddlewares = options.effectMiddlewares,
      onError = options.onError;
  var effectId = uid();

  if (sagaMonitor) {
    // monitors are expected to have a certain interface, let's fill-in any missing ones
    sagaMonitor.effectTriggered = sagaMonitor.effectTriggered || noop;
    sagaMonitor.effectResolved = sagaMonitor.effectResolved || noop;
    sagaMonitor.effectRejected = sagaMonitor.effectRejected || noop;
    sagaMonitor.effectCancelled = sagaMonitor.effectCancelled || noop;
    sagaMonitor.actionDispatched = sagaMonitor.actionDispatched || noop;
    sagaMonitor.effectTriggered({
      effectId: effectId,
      root: true,
      parentEffectId: 0,
      effect: {
        root: true,
        saga: saga,
        args: args
      }
    });
  }

  if (("development" === 'development' || "development" === 'test') && is.notUndef(effectMiddlewares)) {
    var MIDDLEWARE_TYPE_ERROR = 'effectMiddlewares must be an array of functions';
    check(effectMiddlewares, is.array, MIDDLEWARE_TYPE_ERROR);
    effectMiddlewares.forEach(function (effectMiddleware) {
      return check(effectMiddleware, is.func, MIDDLEWARE_TYPE_ERROR);
    });
  }

  var middleware = effectMiddlewares && compose.apply(void 0, effectMiddlewares);
  var task = proc(iterator, channel$$1, wrapSagaDispatch(dispatch), getState, context, {
    sagaMonitor: sagaMonitor,
    logger: logger,
    onError: onError,
    middleware: middleware
  }, effectId, saga.name);

  if (sagaMonitor) {
    sagaMonitor.effectResolved(effectId, task);
  }

  return task;
}

function sagaMiddlewareFactory(_ref) {
  if (_ref === void 0) {
    _ref = {};
  }

  var _ref2 = _ref,
      _ref2$context = _ref2.context,
      context = _ref2$context === void 0 ? {} : _ref2$context,
      options = _objectWithoutProperties(_ref2, ["context"]);
  var sagaMonitor = options.sagaMonitor,
      logger = options.logger,
      onError = options.onError,
      effectMiddlewares = options.effectMiddlewares;

  {
    if (is.notUndef(logger)) {
      check(logger, is.func, 'options.logger passed to the Saga middleware is not a function!');
    }

    if (is.notUndef(onError)) {
      check(onError, is.func, 'options.onError passed to the Saga middleware is not a function!');
    }

    if (is.notUndef(options.emitter)) {
      check(options.emitter, is.func, 'options.emitter passed to the Saga middleware is not a function!');
    }
  }

  function sagaMiddleware(_ref3) {
    var getState = _ref3.getState,
        dispatch = _ref3.dispatch;
    var channel$$1 = stdChannel();
    channel$$1.put = (options.emitter || identity)(channel$$1.put);
    sagaMiddleware.run = runSaga.bind(null, {
      context: context,
      channel: channel$$1,
      dispatch: dispatch,
      getState: getState,
      sagaMonitor: sagaMonitor,
      logger: logger,
      onError: onError,
      effectMiddlewares: effectMiddlewares
    });
    return function (next) {
      return function (action) {
        if (sagaMonitor && sagaMonitor.actionDispatched) {
          sagaMonitor.actionDispatched(action);
        }

        var result = next(action); // hit reducers

        channel$$1.put(action);
        return result;
      };
    };
  }

  sagaMiddleware.run = function () {
    throw new Error('Before running a Saga, you must mount the Saga middleware on the Store using applyMiddleware');
  };

  sagaMiddleware.setContext = function (props) {
    {
      check(props, is.object, createSetContextWarning('sagaMiddleware', props));
    }

    object.assign(context, props);
  };

  return sagaMiddleware;
}



var effects = Object.freeze({
	take: take,
	takeMaybe: takeMaybe,
	put: put,
	putResolve: putResolve,
	all: all,
	race: race,
	call: call,
	apply: apply,
	cps: cps,
	fork: fork,
	spawn: spawn,
	join: join,
	cancel: cancel,
	select: select,
	actionChannel: actionChannel,
	cancelled: cancelled,
	flush: flush$1,
	getContext: getContext,
	setContext: setContext,
	takeEvery: takeEvery,
	takeLatest: takeLatest,
	throttle: throttle
});



var utils = Object.freeze({
	noop: noop,
	is: is,
	deferred: deferred,
	arrayOfDeferred: arrayOfDeferred,
	createMockTask: createMockTask,
	cloneableGenerator: cloneableGenerator,
	SAGA_ACTION: SAGA_ACTION,
	TASK: TASK,
	asEffect: asEffect,
	CHANNEL_END: CHANNEL_END$1
});

exports['default'] = sagaMiddlewareFactory;
exports.effects = effects;
exports.utils = utils;
exports.buffers = buffers;
exports.runSaga = runSaga;
exports.END = END;
exports.eventChannel = eventChannel;
exports.channel = channel;
exports.multicastChannel = multicastChannel;
exports.stdChannel = stdChannel;
exports.CANCEL = CANCEL;
exports.delay = delay;
exports.detach = detach;

Object.defineProperty(exports, '__esModule', { value: true });

})));
