import { BaseTask } from "@xmcl/task";
import { Entry, ZipFile } from "yauzl";
export interface EntryResolver {
    (entry: Entry): Promise<string> | string;
}
export declare function getDefaultEntryResolver(): EntryResolver;
export declare class UnzipTask extends BaseTask<void> {
    readonly zipFile: ZipFile;
    readonly entries: Entry[];
    readonly resolver: EntryResolver;
    private streams;
    private _onCancelled;
    constructor(zipFile: ZipFile, entries: Entry[], destination: string, resolver?: EntryResolver);
    protected handleEntry(entry: Entry, relativePath: string): Promise<void>;
    protected runTask(): Promise<void>;
    protected cancelTask(): Promise<void>;
    protected pauseTask(): Promise<void>;
    protected resumeTask(): Promise<void>;
}
//# sourceMappingURL=unzip.d.ts.map