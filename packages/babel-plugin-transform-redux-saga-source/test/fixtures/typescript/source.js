const sum = (a, b) => a + b;
function* tstest1() {
    const result = yield sum(1, 2);
    return result;
}
//# sourceMappingURL=source.js.map