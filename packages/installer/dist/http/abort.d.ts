export interface AbortSignal {
    readonly aborted: boolean;
    addEventListener(event: string, handler: () => void): this;
    removeEventListener(event: string, handler: () => void): this;
}
export declare function resolveAbortSignal(signal?: AbortSignal): AbortSignal;
//# sourceMappingURL=abort.d.ts.map