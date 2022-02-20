/// <reference types="node" />
import { MinecraftFolder, MinecraftLocation } from "@xmcl/core";
import { Task, TaskGroup } from "@xmcl/task";
import { Entry, ZipFile } from "yauzl";
import { DownloadBaseOptions } from "./http/download";
import { ParallelTaskOptions } from "./utils";
export interface CurseforgeOptions extends DownloadBaseOptions, ParallelTaskOptions {
    /**
     * The function to query a curseforge project downloadable url.
     */
    queryFileUrl?: CurseforgeURLQuery;
    /**
     * Should it replace the override files if the file is existed.
     */
    replaceExisted?: boolean;
    /**
     * Overload the manifest for this installation.
     * It will use this manifest instead of the read manifest from modpack zip to install.
     */
    manifest?: Manifest;
    /**
     * The function to resolve the file path from url and other.
     *
     * By default this will install all the file
     */
    filePathResolver?: FilePathResolver;
}
export interface InstallFileOptions extends DownloadBaseOptions {
    /**
     * The function to query a curseforge project downloadable url.
     */
    queryFileUrl?: CurseforgeURLQuery;
}
declare type InputType = string | Buffer | {
    zip: ZipFile;
    entries: Entry[];
};
export interface Manifest {
    manifestType: string;
    manifestVersion: number;
    minecraft: {
        /**
         * Minecraft version
         */
        version: string;
        libraries?: string;
        /**
         * Can be forge
         */
        modLoaders: {
            id: string;
            primary: boolean;
        }[];
    };
    name: string;
    version: string;
    author: string;
    files: {
        projectID: number;
        fileID: number;
        required: boolean;
    }[];
    overrides: string;
}
export interface File {
    projectID: number;
    fileID: number;
}
export declare class BadCurseforgeModpackError extends Error {
    modpack: InputType;
    /**
     * What required entry is missing in modpack.
     */
    entry: string;
    error: string;
    constructor(modpack: InputType, 
    /**
     * What required entry is missing in modpack.
     */
    entry: string);
}
/**
 * Read the mainifest data from modpack
 * @throws {@link BadCurseforgeModpackError}
 */
export declare function readManifestTask(input: InputType): Task<Manifest>;
/**
 * Read the mainifest data from modpack
 * @throws {@link BadCurseforgeModpackError}
 */
export declare function readManifest(zip: InputType): Promise<Manifest>;
export declare type FilePathResolver = (projectId: number, fileId: number, minecraft: MinecraftFolder, url: string) => string | Promise<string>;
export declare type CurseforgeURLQuery = (projectId: number, fileId: number) => Promise<string>;
export declare type CurseforgeFileTypeQuery = (projectId: number) => Promise<"mods" | "resourcepacks">;
export declare function createDefaultCurseforgeQuery(): CurseforgeURLQuery;
/**
 * Install curseforge modpack to a specific Minecraft location.
 *
 * @param zip The curseforge modpack zip buffer or file path
 * @param minecraft The minecraft location
 * @param options The options for query curseforge
 */
export declare function installCurseforgeModpack(zip: InputType, minecraft: MinecraftLocation, options?: CurseforgeOptions): Promise<Manifest>;
export declare class DownloadCurseforgeFilesTask extends TaskGroup<void> {
    readonly manifest: Manifest;
    readonly minecraft: MinecraftFolder;
    readonly options: CurseforgeOptions;
    constructor(manifest: Manifest, minecraft: MinecraftFolder, options: CurseforgeOptions);
    protected runTask(): Promise<void>;
}
/**
 * Install curseforge modpack to a specific Minecraft location.
 *
 * This will NOT install the Minecraft version in the modpack, and will NOT install the forge or other modload listed in modpack!
 * Please resolve them by yourself.
 *
 * @param input The curseforge modpack zip buffer or file path
 * @param minecraft The minecraft location
 * @param options The options for query curseforge
 * @throws {@link BadCurseforgeModpackError}
 */
export declare function installCurseforgeModpackTask(input: InputType, minecraft: MinecraftLocation, options?: CurseforgeOptions): import("@xmcl/task").TaskRoutine<Manifest>;
/**
 * Install a cureseforge xml file to a specific locations
 */
export declare function installCurseforgeFile(file: File, destination: string, options?: InstallFileOptions): Promise<void>;
/**
 * Install a cureseforge xml file to a specific locations
 */
export declare function installCurseforgeFileTask(file: File, destination: string, options?: InstallFileOptions): import("@xmcl/task").TaskRoutine<void>;
export {};
//# sourceMappingURL=curseforge.d.ts.map