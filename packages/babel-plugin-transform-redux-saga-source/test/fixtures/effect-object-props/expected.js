function* withEffectObjectProps() {
    yield function reduxSagaSource() {
        var res = race({
            timeout: delay(3000),
            cannelled: take('CANCELLED')
        });
        res.__source = {
            fileName: '{{filename}}',
            lineNumber: 2,
            code: 'race({\n        timeout: delay(3000),\n        cannelled: take(\'CANCELLED\')\n    })'
        };
        return res;
    }();
}
withEffectObjectProps.__source = {
    fileName: '{{filename}}',
    lineNumber: 1
};
