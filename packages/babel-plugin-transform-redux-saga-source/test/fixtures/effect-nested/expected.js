function* hasNested() {
    yield function reduxSagaSource() {
        var res = call(function* test2() {
            yield function reduxSagaSource() {
                var res = call(foo);
                res.__source = {
                    fileName: "{{filename}}",
                    lineNumber: 3,
                    code: "call(foo)"
                };
                return res;
            }();
        });
        res.__source = {
            fileName: "{{filename}}",
            lineNumber: 2,
            code: "call(function* test2(){\n        yield call(foo);\n    })"
        };
        return res;
    }();
}
hasNested.__source = {
    fileName: "{{filename}}",
    lineNumber: 1
};
