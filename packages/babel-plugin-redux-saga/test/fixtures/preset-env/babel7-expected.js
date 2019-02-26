"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _marked = /*#__PURE__*/regeneratorRuntime.mark(test1),
    _marked2 = /*#__PURE__*/regeneratorRuntime.mark(test2);

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
  }, _marked, this);
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
  }, _marked2, this);
}

Object.defineProperty(test2, "@@redux-saga/LOCATION", {
  value: {
    fileName: "test/fixtures/preset-env/source.js",
    lineNumber: 5,
    code: null
  }
})

var Component = function (_React$PureComponent) {
  _inherits(Component, _React$PureComponent);

  function Component() {
    _classCallCheck(this, Component);

    return _possibleConstructorReturn(this, (Component.__proto__ || Object.getPrototypeOf(Component)).apply(this, arguments));
  }

  _createClass(Component, [{
    key: "getData",
    value: /*#__PURE__*/regeneratorRuntime.mark(function getData() {
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
      }, getData, this);
    })
  }, {
    key: "render",
    value: function render() {
      var data = [].concat(_toConsumableArray(this.getData()));
      return data;
    }
  }]);

  return Component;
}(React.PureComponent);