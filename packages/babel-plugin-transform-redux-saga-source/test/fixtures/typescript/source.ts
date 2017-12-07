const sum = (a: number, b: number): number =>
    a + b;

function* tstest1(): IterableIterator<number> {
    const result = yield sum(1, 2);
    return result;
}
