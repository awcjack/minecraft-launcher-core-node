import { MinecraftFolder, MinecraftLocation, ResolvedLibrary, ResolvedVersion } from "@xmcl/core";
import { Task } from "@xmcl/task";
import { DownloadTask } from "./downloadTask";
import { DownloadBaseOptions } from "./http/download";
import { Timestamped } from "./http/fetch";
import { ParallelTaskOptions } from "./utils";
/**
 * The function to swap library host.
 */
export declare type LibraryHost = (library: ResolvedLibrary) => string | string[] | undefined;
export interface MinecraftVersionBaseInfo {
    /**
     * The version id, like 1.14.4
     */
    id: string;
    /**
     * The version json download url
     */
    url: string;
}
/**
 * The version metadata containing the version information, like download url
 */
export interface MinecraftVersion extends MinecraftVersionBaseInfo {
    /**
     * The version id, like 1.14.4
     */
    id: string;
    type: string;
    time: string;
    releaseTime: string;
    /**
     * The version json download url
     */
    url: string;
}
export interface AssetInfo {
    name: string;
    hash: string;
    size: number;
}
/**
 * Minecraft version metadata list
 */
export interface MinecraftVersionList extends Timestamped {
    latest: {
        /**
         * Snapshot version id of the Minecraft
         */
        snapshot: string;
        /**
         * Release version id of the Minecraft, like 1.14.2
         */
        release: string;
    };
    /**
     * All the vesrsion list
     */
    versions: MinecraftVersion[];
}
/**
 * Default minecraft version manifest url.
 */
export declare const DEFAULT_VERSION_MANIFEST_URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
/**
 * Default resource/assets url root
 */
export declare const DEFAULT_RESOURCE_ROOT_URL = "https://resources.download.minecraft.net";
/**
 * Get and update the version list.
 * This try to send http GET request to offical Minecraft metadata endpoint by default.
 * You can swap the endpoint by passing url on `remote` in option.
 *
 * @returns The new list if there is
 */
export declare function getVersionList(option?: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: MinecraftVersionList;
    /**
     * remote url of this request
     */
    remote?: string;
}): Promise<MinecraftVersionList>;
/**
 * Change the library host url
 */
export interface LibraryOptions extends DownloadBaseOptions, ParallelTaskOptions {
    /**
     * A more flexiable way to control library download url.
     * @see mavenHost
     */
    libraryHost?: LibraryHost;
    /**
     * The alterative maven host to download library. It will try to use these host from the `[0]` to the `[maven.length - 1]`
     */
    mavenHost?: string | string[];
    /**
     * Control how many libraries download task should run at the same time.
     * It will override the `maxConcurrencyOption` if this is presented.
     *
     * This will be ignored if you have your own downloader assigned.
     */
    librariesDownloadConcurrency?: number;
}
/**
 * Change the host url of assets download
 */
export interface AssetsOptions extends DownloadBaseOptions, ParallelTaskOptions {
    /**
     * The alternative assets host to download asset. It will try to use these host from the `[0]` to the `[assetsHost.length - 1]`
     */
    assetsHost?: string | string[];
    /**
     * Control how many assets download task should run at the same time.
     * It will override the `maxConcurrencyOption` if this is presented.
     *
     * This will be ignored if you have your own downloader assigned.
     */
    assetsDownloadConcurrency?: number;
    /**
     * The assets index download or url replacement
     */
    assetsIndexUrl?: string | string[] | ((version: ResolvedVersion) => string | string[]);
}
export declare type InstallLibraryVersion = Pick<ResolvedVersion, "libraries" | "minecraftDirectory">;
/**
 * Replace the minecraft client or server jar download
 */
export interface JarOption extends DownloadBaseOptions, ParallelTaskOptions {
    /**
     * The version json url replacement
     */
    json?: string | string[] | ((version: MinecraftVersionBaseInfo) => string | string[]);
    /**
     * The client jar url replacement
     */
    client?: string | string[] | ((version: ResolvedVersion) => string | string[]);
    /**
     * The server jar url replacement
     */
    server?: string | string[] | ((version: ResolvedVersion) => string | string[]);
}
export interface InstallSideOption {
    /**
     * The installation side
     */
    side?: "client" | "server";
}
export declare type Options = DownloadBaseOptions & ParallelTaskOptions & AssetsOptions & JarOption & LibraryOptions & InstallSideOption;
/**
 * Install the Minecraft game to a location by version metadata.
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param option
 */
export declare function install(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, option?: Options): Promise<ResolvedVersion>;
/**
 * Only install the json/jar. Do not install dependencies.
 *
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
export declare function installVersion(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options?: JarOption): Promise<ResolvedVersion>;
/**
 * Install the completeness of the Minecraft game assets and libraries on a existed version.
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
export declare function installDependencies(version: ResolvedVersion, options?: Options): Promise<ResolvedVersion>;
/**
 * Install or check the assets to resolved version
 *
 * @param version The target version
 * @param options The option to replace assets host url
 */
export declare function installAssets(version: ResolvedVersion, options?: AssetsOptions): Promise<ResolvedVersion>;
/**
 * Install all the libraries of providing version
 * @param version The target version
 * @param options The library host swap option
 */
export declare function installLibraries(version: ResolvedVersion, options?: LibraryOptions): Promise<void>;
/**
 * Only install several resolved libraries
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
export declare function installResolvedLibraries(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOptions): Promise<void>;
/**
 * Install the Minecraft game to a location by version metadata.
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * @param type The type of game, client or server
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param options
 */
export declare function installTask(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options?: Options): Task<ResolvedVersion>;
/**
 * Only install the json/jar. Do not install dependencies.
 *
 * @param type client or server
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
export declare function installVersionTask(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options?: JarOption): Task<ResolvedVersion>;
/**
 * Install the completeness of the Minecraft game assets and libraries on a existed version.
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
export declare function installDependenciesTask(version: ResolvedVersion, options?: Options): Task<ResolvedVersion>;
/**
 * Install or check the assets to resolved version
 *
 * @param version The target version
 * @param options The option to replace assets host url
 */
export declare function installAssetsTask(version: ResolvedVersion, options?: AssetsOptions): Task<ResolvedVersion>;
/**
 * Install all the libraries of providing version
 * @param version The target version
 * @param options The library host swap option
 */
export declare function installLibrariesTask(version: InstallLibraryVersion, options?: LibraryOptions): Task<void>;
/**
 * Only install several resolved libraries
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
export declare function installResolvedLibrariesTask(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOptions): Task<void>;
/**
 * Only install several resolved assets.
 * @param assets The assets to install
 * @param folder The minecraft folder
 * @param options The asset option
 */
export declare function installResolvedAssetsTask(assets: AssetInfo[], folder: MinecraftFolder, options?: AssetsOptions): import("@xmcl/task").TaskRoutine<void>;
export declare class InstallJsonTask extends DownloadTask {
    constructor(version: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options: Options);
}
export declare class InstallJarTask extends DownloadTask {
    constructor(version: ResolvedVersion, minecraft: MinecraftLocation, options: Options);
}
export declare class InstallAssetIndexTask extends DownloadTask {
    constructor(version: ResolvedVersion, options?: AssetsOptions);
}
export declare class InstallLibraryTask extends DownloadTask {
    constructor(lib: ResolvedLibrary, folder: MinecraftFolder, options: LibraryOptions);
}
export declare class InstallAssetTask extends DownloadTask {
    constructor(asset: AssetInfo, folder: MinecraftFolder, options: AssetsOptions);
}
/**
 * Resolve a library download urls with fallback.
 *
 * @param library The resolved library
 * @param libraryOptions The library install options
 */
export declare function resolveLibraryDownloadUrls(library: ResolvedLibrary, libraryOptions: LibraryOptions): string[];
//# sourceMappingURL=minecraft.d.ts.map