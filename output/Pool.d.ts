export declare class Pool {
    static alloc<T>(cls: new () => T): T;
    static release(item: any): null;
    static releaseList(list: any[]): void;
}
