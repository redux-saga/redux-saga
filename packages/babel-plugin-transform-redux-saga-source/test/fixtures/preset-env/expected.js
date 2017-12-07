"use strict";

var _marked = /*#__PURE__*/regeneratorRuntime.mark(test1),
    _marked2 = /*#__PURE__*/regeneratorRuntime.mark(test2);

function test1() {
    return regeneratorRuntime.wrap(function test1$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    _context.next = 2;
                    return function reduxSagaSource() {
                        var res = foo(1, 2, 3);
                        res.__source = {
                            fileName: "{{filename}}",
                            lineNumber: 2,
                            code: "foo(1, 2, 3)"
                        };
                        return res;
                    }();

                case 2:
                case "end":
                    return _context.stop();
            }
        }
    }, _marked, this);
}

test1.__source = {
    fileName: "{{filename}}",
    lineNumber: 1
};
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
test2.__source = {
    fileName: "{{filename}}",
    lineNumber: 5
};
