/**
 * The controller that maintain the download status
 */
export interface StatusController {
    readonly total: number;
    readonly progress: number;
    reset(progress: number, total: number): void;
    onProgress(chunkSize: number, progress: number): void;
}
export declare function createStatusController(): StatusController;
export declare function resolveStatusController(controller?: StatusController): StatusController;
//# sourceMappingURL=status.d.ts.map