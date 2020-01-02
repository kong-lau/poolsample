this.game = this.game || {};
var _kong_au_poolsample = (function (exports) {
    'use strict';

    function createObj() {
        return Object.create(null);
    }
    var initTick = Date.now();
    function now() {
        return Date.now() - initTick;
    }

    var PoolImpl = /** @class */ (function () {
        function PoolImpl(cls) {
            this._list = [];
            this._wait = [];
            this._cls = cls;
            this.time = this._rTime = now();
            this._aNum = 0;
        }
        /** @internal */ PoolImpl.prototype.alloc = function () {
            var self = this;
            self._aNum++;
            self.time = now();
            var item = self._list.length ? self._list.pop() : new self._cls();
            if (typeof item.onAlloc === "function") {
                item.onAlloc();
            }
            return item;
        };
        /** @internal */ PoolImpl.prototype.release = function (item) {
            if (!item) {
                return;
            }
            if (this._wait.indexOf(item) < 0) {
                if (typeof item.onRelease === "function") {
                    item.onRelease();
                }
                this._wait[this._wait.length] = item;
            }
        };
        /** @internal */ PoolImpl.prototype.resize = function (time) {
            var self = this;
            var item;
            var list = self._list;
            while (self._wait.length) {
                item = self._wait.pop();
                if (list.indexOf(item) < 0) {
                    list[list.length] = item;
                }
            }
            if (time - self._rTime >= 3000) {
                var size = self._aNum > 30 ? self._aNum : 30;
                self._aNum = 0;
                self._rTime = time;
                while (list.length > size) {
                    item = list.pop();
                    disposeItem(item);
                }
            }
        };
        /** @internal */ PoolImpl.prototype.dispose = function () {
            var self = this;
            self._list.forEach(disposeItem);
            self._list.length = 0;
            self._wait.forEach(disposeItem);
            self._wait.length = 0;
        };
        return PoolImpl;
    }());
    function disposeItem(item) {
        if (typeof item.dispose === "function") {
            item.dispose();
        }
    }
    var PoolId = 1000;
    var Pools = createObj();
    function getPool(ctor) {
        var prototype = ctor.prototype ? ctor.prototype : Object.getPrototypeOf(ctor);
        var poolId;
        if (!prototype.hasOwnProperty("__poolId__")) {
            poolId = "pool" + (PoolId++);
            Object.defineProperty(prototype, "__poolId__", {
                configurable: false,
                enumerable: false,
                writable: false,
                value: poolId
            });
        }
        else {
            poolId = prototype["__poolId__"];
        }
        var pool = Pools[poolId];
        if (!pool) {
            pool = new PoolImpl(ctor);
            Pools[poolId] = pool;
        }
        return pool;
    }
    function retrievePool(ctor) {
        var prototype = ctor.prototype ? ctor.prototype : Object.getPrototypeOf(ctor);
        if (!prototype.hasOwnProperty("__poolId__")) {
            return null;
        }
        return Pools[prototype["__poolId__"]];
    }
    var Pool = /** @class */ (function () {
        function Pool() {
        }
        Pool.alloc = function (cls) {
            if (typeof cls === "function") {
                return getPool(cls).alloc();
            }
            return null;
        };
        Pool.release = function (item) {
            if (typeof item === "object") {
                var pool = retrievePool(item.constructor);
                if (pool) {
                    pool.release(item);
                }
                else {
                    if (typeof item.onRelease === "function") {
                        item.onRelease();
                    }
                    disposeItem(item);
                }
            }
            return null;
        };
        Pool.releaseList = function (list) {
            if (!list || !Array.isArray(list) || !list.length) {
                return;
            }
            for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
                var item = list_1[_i];
                this.release(item);
            }
            list.length = 0;
        };
        /** @internal */ Pool.checkUnused = function () {
            var time = now();
            for (var id in Pools) {
                var pool = Pools[id];
                if (pool) {
                    if (time - pool.time > 51000) {
                        Pools[id] = null;
                        pool.dispose();
                    }
                    else {
                        pool.resize(time);
                    }
                }
            }
        };
        return Pool;
    }());

    exports.Pool = Pool;

    return exports;

}({}));
Object.assign(this.game, _kong_au_poolsample);
//# sourceMappingURL=pool.js.map
