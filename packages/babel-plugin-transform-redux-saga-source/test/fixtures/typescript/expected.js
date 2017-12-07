const sum = (a, b) => a + b;
function* tstest1() {
    const result = yield function reduxSagaSource() {
        var res = sum(1, 2);
        res.__source = {
            fileName: "{{filename}} (source.ts)",
            lineNumber: 5,
            code: "sum(1, 2)"
        };
        return res;
    }();
    return result;
}

tstest1.__source = {
    fileName: "{{filename}} (source.ts)",
    lineNumber: 4
};
//# sourceMappingURL=source.js.map
