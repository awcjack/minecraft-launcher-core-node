import { Platform } from "@xmcl/core";
import { Task } from "@xmcl/task";
import { DownloadBaseOptions } from "./http/download";
import { ParallelTaskOptions } from "./utils";
/**
 * Contain all java runtimes basic info
 */
export interface JavaRuntimes {
    linux: JavaRuntimeTargets;
    "linux-i386": JavaRuntimeTargets;
    "mac-os": JavaRuntimeTargets;
    "windows-x64": JavaRuntimeTargets;
    "windows-x86": JavaRuntimeTargets;
}
export interface JavaRuntimeTargets {
    "java-runtime-alpha": JavaRuntimeTarget[];
    "java-runtime-beta": JavaRuntimeTarget[];
    "jre-legacy": JavaRuntimeTarget[];
    "minecraft-java-exe": JavaRuntimeTarget[];
    [key: string]: JavaRuntimeTarget[];
}
export declare enum JavaRuntimeTargetType {
    /**
     * The legacy java version
     */
    Legacy = "jre-legacy",
    /**
     * The new java environment, which is the java 16
     */
    Alpha = "java-runtime-alpha",
    Beta = "java-runtime-beta",
    JavaExe = "minecraft-java-exe"
}
/**
 * Represent a java runtime
 */
export interface JavaRuntimeTarget {
    /**
     * Guessing this is the flight of this java runtime
     */
    availability: {
        group: number;
        progress: number;
    };
    /**
     * The manifest detail of the resource
     */
    manifest: DownloadInfo;
    /**
     * The basic version info of the manifest
     */
    version: {
        /**
         * The name of the version. e.g. `8u51`, `12`, `16.0.1.9.1`
         */
        name: string;
        /**
         * The date string (UTC)
         */
        released: string;
    };
}
export interface Entry {
    type: "file" | "link" | "directory";
}
export interface LinkEntry extends Entry {
    type: "link";
    /**
     * The link target
     */
    target: string;
}
export interface DirectoryEntry extends Entry {
    type: "directory";
}
export interface DownloadInfo {
    /**
     * The sha info of the resource
     */
    sha1: string;
    /**
     * The size of the resource
     */
    size: number;
    /**
     * The url to download resource
     */
    url: string;
}
export interface FileEntry extends Entry {
    type: "file";
    executable: boolean;
    downloads: {
        /**
         * The raw format of the file
         */
        raw: DownloadInfo;
        /**
         * The lzma format of the file
         */
        lzma?: DownloadInfo;
    };
}
export declare type AnyEntry = FileEntry | DirectoryEntry | LinkEntry;
/**
 * Contains info about every files in this java runtime
 */
export interface JavaRuntimeManifest {
    target: JavaRuntimeTargetType | string;
    /**
     * The files of the java runtime
     */
    files: Record<string, AnyEntry>;
    version: JavaRuntimeTarget["version"];
}
export declare const DEFAULT_RUNTIME_ALL_URL = "https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json";
export interface FetchJavaRuntimeManifestOptions extends DownloadBaseOptions {
    /**
     * The alternative download host for the file
     */
    apiHost?: string | string[];
    /**
     * The url of the all runtime json
     */
    url?: string;
    /**
     * The platform to install. It will be auto-resolved by default.
     * @default getPlatform()
     */
    platform?: Platform;
    /**
     * The install java runtime type
     * @default InstallJavaRuntimeTarget.Next
     */
    target?: JavaRuntimeTargetType | string;
    /**
     * The index manifest of the java runtime. If this is not presented, it will fetch by platform and all platform url.
     */
    manifestIndex?: JavaRuntimes;
}
/**
 * Fetch java runtime manifest. It should be able to resolve to your platform, or you can assign the platform.
 *
 * Also, you should assign the target to download, or it will use the latest java 16.
 * @param options The options of fetch runtime manifest
 */
export declare function fetchJavaRuntimeManifest(options?: FetchJavaRuntimeManifestOptions): Promise<JavaRuntimeManifest>;
export interface InstallJavaRuntimeOptions extends DownloadBaseOptions, ParallelTaskOptions {
    /**
     * The alternative download host for the file
     */
    apiHost?: string | string[];
    /**
     * The destination of this installation
     */
    destination: string;
    /**
     * The actual manfiest to install.
     */
    manifest: JavaRuntimeManifest;
    /**
     * Download lzma compressed version instead of raw version.
     * - If `true`, it will just download lzma file version, you need to decompress by youself!
     * - If `Function`, it will use that function to decompress the file!
     */
    lzma?: boolean | ((compressedFilePath: string, targetPath: string) => Promise<void>);
}
/**
 * Install java runtime from java runtime manifest
 * @param options The options to install java runtime
 */
export declare function installJavaRuntimesTask(options: InstallJavaRuntimeOptions): Task<void>;
//# sourceMappingURL=java-runtime.d.ts.map