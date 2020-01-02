export function createObj() {
    return Object.create(null);
}
var initTick = Date.now();
export function now() {
    return Date.now() - initTick;
}
//# sourceMappingURL=Util.js.map