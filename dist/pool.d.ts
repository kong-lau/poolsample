interface DisposeObject {
    dispose(): void;
}
declare class Pool {
    alloc<T>(cls: new () => T): T;
    release(item: any): null;
    releaseList(list: any[]): void;
}
interface PoolObject {
    onAlloc?(): void;
    onRelease?(): void;
    dispose?(): void;
}
export { DisposeObject, Pool, PoolObject };
