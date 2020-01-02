import {PoolObject} from "./PoolObject";
import {createObj, now} from "./Util";

class PoolImpl<T extends PoolObject> {
    public time: number;

    /** @internal */ private _aNum: number;
    /** @internal */ private _rTime: number;

    /** @internal */ private readonly _list: T[];
    /** @internal */ private readonly _wait: T[];
    /** @internal */ private readonly _cls: new() => T;

    constructor(cls: new() => T) {
        this._list = [];
        this._wait = [];
        this._cls = cls;
        this.time = this._rTime = now();
        this._aNum = 0;
    }

    /** @internal */ public alloc(): T {
        let self = this;
        self._aNum++;
        self.time = now();
        let item: T = self._list.length ? self._list.pop() : new self._cls();
        if (typeof item.onAlloc === "function") {
            item.onAlloc();
        }
        return item;
    }

    /** @internal */ public release(item: T): void {
        if (!item) {
            return;
        }
        if (this._wait.indexOf(item) < 0) {
            if (typeof item.onRelease === "function") {
                item.onRelease();
            }
            this._wait[this._wait.length] = item;
        }
    }

    /** @internal */ public resize(time: number): void {
        let self = this;
        let item: T;
        let list = self._list;
        while (self._wait.length) {
            item = self._wait.pop();
            if (list.indexOf(item) < 0) {
                list[list.length] = item;
            }
        }
        if (time - self._rTime >= 3000) {
            let size = self._aNum > 30 ? self._aNum : 30;
            self._aNum = 0;
            self._rTime = time;
            while (list.length > size) {
                item = list.pop();
                disposeItem(item);
            }
        }
    }

    /** @internal */ public dispose(): void {
        let self = this;
        self._list.forEach(disposeItem);
        self._list.length = 0;
        self._wait.forEach(disposeItem);
        self._wait.length = 0;
    }

}

function disposeItem(item: PoolObject): void {
    if (typeof item.dispose === "function") {
        item.dispose();
    }
}

let PoolId: number = 1000;
const Pools: { [key: string]: PoolImpl<any> } = createObj();

function getPool<T extends PoolObject>(ctor: new () => T): PoolImpl<T> {
    let prototype: any = ctor.prototype ? ctor.prototype : Object.getPrototypeOf(ctor);
    let poolId: string;
    if (!prototype.hasOwnProperty("__poolId__")) {
        poolId = "pool" + (PoolId++);
        Object.defineProperty(prototype, "__poolId__", {
            configurable: false,
            enumerable: false,
            writable: false,
            value: poolId
        });
    } else {
        poolId = prototype["__poolId__"];
    }
    let pool: PoolImpl<T> = Pools[poolId];
    if (!pool) {
        pool = new PoolImpl<T>(ctor);
        Pools[poolId] = pool;
    }
    return pool;
}

function retrievePool<T extends PoolObject>(ctor: new () => T): PoolImpl<T> | null {
    let prototype: any = ctor.prototype ? ctor.prototype : Object.getPrototypeOf(ctor);
    if (!prototype.hasOwnProperty("__poolId__")) {
        return null;
    }
    return Pools[prototype["__poolId__"]];
}

export class Pool {
    public static alloc<T>(cls: new () => T): T {
        if (typeof cls === "function") {
            return getPool(cls).alloc();
        }
        return null;
    }

    public static release(item: any): null {
        if (typeof item === "object") {
            let pool: PoolImpl<any> = retrievePool(item.constructor);
            if (pool) {
                pool.release(item);
            } else {
                if (typeof item.onRelease === "function") {
                    item.onRelease();
                }
                disposeItem(item);
            }
        }
        return null;
    }

    public static releaseList(list: any[]): void {
        if (!list || !Array.isArray(list) || !list.length) {
            return;
        }
        for (let item of list) {
            this.release(item);
        }
        list.length = 0;
    }

    /** @internal */ public static checkUnused(): void {
        let time: number = now();
        for (let id in Pools) {
            let pool: PoolImpl<any> = Pools[id];
            if (pool) {
                if (time - pool.time > 51000) {
                    Pools[id] = null;
                    pool.dispose();
                } else {
                    pool.resize(time);
                }
            }
        }
    }

}