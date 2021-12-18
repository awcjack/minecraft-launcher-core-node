/// <reference types="node" />
import { _exists as exists, _mkdir as mkdir, _pipeline as pipeline, _readFile as readFile, _writeFile as writeFile } from "@xmcl/core";
import { ChildProcessWithoutNullStreams, ExecOptions } from "child_process";
import { close as fclose, copyFile as fcopyFile, ftruncate, link as fslink, open as fopen, stat as fstat, unlink as funlink } from "fs";
export declare const unlink: typeof funlink.__promisify__;
export declare const stat: typeof fstat.__promisify__;
export declare const link: typeof fslink.__promisify__;
export declare const open: typeof fopen.__promisify__;
export declare const close: typeof fclose.__promisify__;
export declare const copyFile: typeof fcopyFile.__promisify__;
export declare const truncate: typeof ftruncate.__promisify__;
export { checksum } from "@xmcl/core";
export { readFile, writeFile, mkdir, exists, pipeline };
export declare function missing(target: string): any;
export declare function ensureDir(target: string): Promise<void>;
export declare function ensureFile(target: string): Promise<void>;
export declare function normalizeArray<T>(arr?: T | T[]): T[];
export declare function spawnProcess(javaPath: string, args: string[], options?: ExecOptions): Promise<void>;
export declare function waitProcess(process: ChildProcessWithoutNullStreams): Promise<void>;
export interface ParallelTaskOptions {
    throwErrorImmediately?: boolean;
}
/**
 * Shared install options
 */
export interface InstallOptions {
    /**
     * When you want to install a version over another one.
     *
     * Like, you want to install liteloader over a forge version.
     * You should fill this with that forge version id.
     */
    inheritsFrom?: string;
    /**
     * Override the newly installed version id.
     *
     * If this is absent, the installed version id will be either generated or provided by installer.
     */
    versionId?: string;
}
export declare function errorToString(e: any): any;
//# sourceMappingURL=utils.d.ts.map