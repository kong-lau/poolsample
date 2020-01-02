export interface PoolObject {
    onAlloc?(): void;

    onRelease?(): void;

    dispose?(): void;
}
