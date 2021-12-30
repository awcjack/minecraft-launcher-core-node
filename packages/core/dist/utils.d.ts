/**
 * @ignore
 */
/// <reference types="node" />
import { readFile as freadFile, writeFile as fwriteFile, access as faccess, mkdir as fmkdir, link as flink } from "fs";
import { pipeline as pip } from "stream";
/** @internal */
export declare const pipeline: typeof pip.__promisify__;
/** @internal */
export declare const access: typeof faccess.__promisify__;
/** @internal */
export declare const link: typeof flink.__promisify__;
/** @internal */
export declare const readFile: typeof freadFile.__promisify__;
/** @internal */
export declare const writeFile: typeof fwriteFile.__promisify__;
/** @internal */
export declare const mkdir: typeof fmkdir.__promisify__;
/** @internal */
export declare function exists(file: string): Promise<boolean>;
/**
 * Validate the sha1 value of the file
 * @internal
 */
export declare function validateSha1(target: string, hash?: string, strict?: boolean): Promise<boolean>;
/**
 * Return the sha1 of a file
 * @internal
 */
export declare function checksum(target: string, algorithm: string): Promise<any>;
/**
 * @internal
 */
export declare function isNotNull<T>(v: T | undefined): v is T;
//# sourceMappingURL=utils.d.ts.map