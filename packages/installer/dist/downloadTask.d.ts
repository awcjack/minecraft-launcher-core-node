import { AbortableTask } from "@xmcl/task";
import { Download, DownloadOptions } from "./http/download";
import { StatusController } from "./http/status";
export declare class DownloadTask extends AbortableTask<void> implements StatusController {
    readonly download: Download;
    protected abort: (isCancelled: boolean) => void;
    constructor(options: DownloadOptions);
    reset(progress: number, total: number): void;
    onProgress(chunkSize: number, progress: number): void;
    protected process(): Promise<void>;
    protected isAbortedError(e: any): boolean;
}
//# sourceMappingURL=downloadTask.d.ts.map