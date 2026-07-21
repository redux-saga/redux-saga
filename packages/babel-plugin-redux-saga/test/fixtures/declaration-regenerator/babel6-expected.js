"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _extendSagaSourceLocation(value, location) {
  if (value !== null && ((typeof value === "undefined" ? "undefined" : _typeof(value)) === 'object' || typeof value === 'function')) {
    Object.defineProperty(value, "@@redux-saga/LOCATION", {
      value: location
    });
  }

  return value;
}

var _marked = /*#__PURE__*/regeneratorRuntime.mark(test1),
    _marked2 = /*#__PURE__*/regeneratorRuntime.mark(test2);

function test1() {
  return regeneratorRuntime.wrap(function test1$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return _extendSagaSourceLocation(foo(1, 2, 3), {
            fileName: "test/fixtures/declaration-regenerator/source.js",
            lineNumber: 2,
            code: "foo(1, 2, 3)"
          });

        case 2:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, this);
}

Object.defineProperty(test1, "@@redux-saga/LOCATION", {
  value: {
    fileName: "test/fixtures/declaration-regenerator/source.js",
    lineNumber: 1,
    code: null
  }
})
function test2() {
  return regeneratorRuntime.wrap(function test2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return 2;

        case 2:
        case "end":
          return _context2.stop();
      }
    }
  }, _marked2, this);
}
Object.defineProperty(test2, "@@redux-saga/LOCATION", {
  value: {
    fileName: "test/fixtures/declaration-regenerator/source.js",
    lineNumber: 5,
    code: null
  }
})