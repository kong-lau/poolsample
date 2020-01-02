export function createObj(): any {
    return Object.create(null);
}

let initTick = Date.now();

export function now(): number {
    return Date.now() - initTick;
}