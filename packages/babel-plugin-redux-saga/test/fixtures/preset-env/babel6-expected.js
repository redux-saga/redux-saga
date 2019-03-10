"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var _marked =
/*#__PURE__*/
regeneratorRuntime.mark(test1),
    _marked2 =
/*#__PURE__*/
regeneratorRuntime.mark(test2);

function test1() {
  return regeneratorRuntime.wrap(function test1$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return Object.defineProperty(foo(1, 2, 3), "@@redux-saga/LOCATION", {
            value: {
              fileName: "test/fixtures/preset-env/source.js",
              lineNumber: 2,
              code: "foo(1, 2, 3)"
            }
          });

        case 2:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}

Object.defineProperty(test1, "@@redux-saga/LOCATION", {
  value: {
    fileName: "test/fixtures/preset-env/source.js",
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
  }, _marked2);
}

Object.defineProperty(test2, "@@redux-saga/LOCATION", {
  value: {
    fileName: "test/fixtures/preset-env/source.js",
    lineNumber: 5,
    code: null
  }
})

var Component =
/*#__PURE__*/
function (_React$PureComponent) {
  _inherits(Component, _React$PureComponent);

  function Component() {
    _classCallCheck(this, Component);

    return _possibleConstructorReturn(this, _getPrototypeOf(Component).apply(this, arguments));
  }

  _createClass(Component, [{
    key: "getData",
    value:
    /*#__PURE__*/
    regeneratorRuntime.mark(function getData() {
      return regeneratorRuntime.wrap(function getData$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return 1;

            case 2:
            case "end":
              return _context3.stop();
          }
        }
      }, getData);
    })
  }, {
    key: "render",
    value: function render() {
      var data = _toConsumableArray(this.getData());

      return data;
    }
  }]);

  return Component;
}(React.PureComponent);