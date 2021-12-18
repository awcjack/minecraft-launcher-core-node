import { Platform } from "@xmcl/core";
import { Task } from "@xmcl/task";
import { DownloadTask } from "./downloadTask";
import { DownloadBaseOptions } from "./http/download";
export interface JavaInfo {
    /**
     * Full java executable path
     */
    path: string;
    /**
     * Java version string
     */
    version: string;
    /**
     * Major version of java
     */
    majorVersion: number;
}
export interface InstallJavaOptions extends DownloadBaseOptions {
    /**
     * The destination of this installation
     */
    destination: string;
    /**
     * The cached directory which compressed java lzma will be download to.
     * @default os.tempdir()
     */
    cacheDir?: string;
    /**
     * The platform to install. It will be auto-resolved by default.
     * @default currentPlatform
     */
    platform?: Platform;
    /**
     * Unpack lzma function. It must present, else it will not be able to unpack mojang provided LZMA.
     */
    unpackLZMA: UnpackLZMAFunction;
}
export declare type UnpackLZMAFunction = ((src: string, dest: string) => Promise<void>) | ((src: string, dest: string) => Task<void>);
export declare class DownloadJRETask extends DownloadTask {
    constructor(jre: DownloadInfo, dir: string, options: InstallJavaOptions);
}
interface DownloadInfo {
    sha1: string;
    url: string;
    version: string;
}
/**
 * Install JRE from Mojang offical resource. It should install jdk 8.
 * @param options The install options
 */
export declare function installJreFromMojangTask(options: InstallJavaOptions): any;
/**
 * Install JRE from Mojang offical resource. It should install jdk 8.
 * @param options The install options
 */
export declare function installJreFromMojang(options: InstallJavaOptions): any;
/**
 * Try to resolve a java info at this path. This will call `java -version`
 * @param path The java exectuable path.
 */
export declare function resolveJava(path: string): Promise<JavaInfo | undefined>;
/**
 * Parse version string and major version number from stderr of java process.
 *
 * @param versionText The stderr for `java -version`
 */
export declare function parseJavaVersion(versionText: string): {
    version: string;
    majorVersion: number;
} | undefined;
/**
 * Get all potential java locations for Minecraft.
 *
 * On mac/linux, it will perform `which java`. On win32, it will perform `where java`
 *
 * @returns The absolute java locations path
 */
export declare function getPotentialJavaLocations(): Promise<string[]>;
/**
 * Scan local java version on the disk.
 *
 * It will check if the passed `locations` are the home of java.
 * Notice that the locations should not be the executable, but the path of java installation, like JAVA_HOME.
 *
 * This will call `getPotentialJavaLocations` and then `resolveJava`
 *
 * @param locations The location (like java_home) want to check.
 * @returns All validate java info
 */
export declare function scanLocalJava(locations: string[]): Promise<JavaInfo[]>;
export {};
//# sourceMappingURL=java.d.ts.map