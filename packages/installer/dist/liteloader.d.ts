import { MinecraftLocation } from "@xmcl/core";
import { Task } from "@xmcl/task";
import { Timestamped } from "./http/fetch";
import { InstallOptions } from "./utils";
export declare const DEFAULT_VERSION_MANIFEST = "http://dl.liteloader.com/versions/versions.json";
/**
 * The liteloader version list. Containing the minecraft version -> liteloader version info mapping.
 */
export interface LiteloaderVersionList extends Timestamped {
    meta: {
        description: string;
        authors: string;
        url: string;
        updated: string;
        updatedTime: number;
    };
    versions: {
        [version: string]: {
            snapshot?: LiteloaderVersion;
            release?: LiteloaderVersion;
        };
    };
}
export declare namespace LiteloaderVersionList {
    function parse(content: string): {
        meta: any;
        versions: {};
    };
}
/**
 * A liteloader remote version information
 */
export interface LiteloaderVersion {
    version: string;
    url: string;
    file: string;
    mcversion: string;
    type: "RELEASE" | "SNAPSHOT";
    md5: string;
    timestamp: string;
    libraries: Array<{
        name: string;
        url?: string;
    }>;
    tweakClass: string;
}
/**
 * This error is only thrown from liteloader install currently.
 */
export declare class MissingVersionJsonError extends Error {
    version: string;
    /**
     * The path of version json
     */
    path: string;
    constructor(version: string, 
    /**
     * The path of version json
     */
    path: string);
    error: "MissingVersionJson";
}
/**
 * Get or update the LiteLoader version list.
 *
 * This will request liteloader offical json by default. You can replace the request by assigning the remote option.
 */
export declare function getLiteloaderVersionList(option?: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: LiteloaderVersionList;
    /**
     * The optional requesting version json url.
     */
    remote?: string;
}): Promise<LiteloaderVersionList>;
/**
 * Install the liteloader to specific minecraft location.
 *
 * This will install the liteloader amount on the corresponded Minecraft version by default.
 * If you want to install over the forge. You should first install forge and pass the installed forge version id to the third param,
 * like `1.12-forge-xxxx`
 *
 * @param versionMeta The liteloader version metadata.
 * @param location The minecraft location you want to install
 * @param version The real existed version id (under the the provided minecraft location) you want to installed liteloader inherit
 * @throws {@link MissingVersionJsonError}
 */
export declare function installLiteloader(versionMeta: LiteloaderVersion, location: MinecraftLocation, options?: InstallOptions): any;
/**
 * Install the liteloader to specific minecraft location.
 *
 * This will install the liteloader amount on the corresponded Minecraft version by default.
 * If you want to install over the forge. You should first install forge and pass the installed forge version id to the third param,
 * like `1.12-forge-xxxx`
 *
 * @tasks installLiteloader, installLiteloader.resolveVersionJson installLiteloader.generateLiteloaderJson
 *
 * @param versionMeta The liteloader version metadata.
 * @param location The minecraft location you want to install
 * @param version The real existed version id (under the the provided minecraft location) you want to installed liteloader inherit
 */
export declare function installLiteloaderTask(versionMeta: LiteloaderVersion, location: MinecraftLocation, options?: InstallOptions): Task<string>;
//# sourceMappingURL=liteloader.d.ts.map