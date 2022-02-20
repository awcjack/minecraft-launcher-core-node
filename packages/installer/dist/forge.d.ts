import { MinecraftFolder, MinecraftLocation } from "@xmcl/core";
import { Task } from "@xmcl/task";
import { Entry, ZipFile } from "yauzl";
import { DownloadTask } from "./downloadTask";
import { Timestamped } from "./http/fetch";
import { LibraryOptions } from "./minecraft";
import { InstallProfileOption } from "./profile";
import { InstallOptions as InstallOptionsBase } from "./utils";
export interface ForgeVersionList extends Timestamped {
    mcversion: string;
    versions: ForgeVersion[];
}
/**
 * The forge version metadata to download a forge
 */
export interface ForgeVersion {
    /**
     * The installer info
     */
    installer: {
        md5: string;
        sha1: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    universal: {
        md5: string;
        sha1: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    /**
     * The minecraft version
     */
    mcversion: string;
    /**
     * The forge version (without minecraft version)
     */
    version: string;
    type: "buggy" | "recommended" | "common" | "latest";
}
/**
 * All the useful entries in forge installer jar
 */
export interface ForgeInstallerEntries {
    /**
     *  maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}.jar
     */
    forgeJar?: Entry;
    /**
     *  maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-universal.jar
     */
    forgeUniversalJar?: Entry;
    /**
     * data/client.lzma
     */
    clientLzma?: Entry;
    /**
     * data/server.lzma
     */
    serverLzma?: Entry;
    /**
     * install_profile.json
     */
    installProfileJson?: Entry;
    /**
     * version.json
     */
    versionJson?: Entry;
    /**
     * forge-${forgeVersion}-universal.jar
     */
    legacyUniversalJar?: Entry;
    /**
     * data/run.sh
     */
    runSh?: Entry;
    /**
     * data/run.bat
     */
    runBat?: Entry;
    /**
     * data/unix_args.txt
     */
    unixArgs?: Entry;
    /**
     * data/user_jvm_args.txt
     */
    userJvmArgs?: Entry;
    /**
     * data/win_args.txt
     */
    winArgs?: Entry;
}
export declare type ForgeInstallerEntriesPattern = ForgeInstallerEntries & Required<Pick<ForgeInstallerEntries, "versionJson" | "installProfileJson">>;
export declare type ForgeLegacyInstallerEntriesPattern = Required<Pick<ForgeInstallerEntries, "installProfileJson" | "legacyUniversalJar">>;
declare type RequiredVersion = {
    /**
     * The installer info.
     *
     * If this is not presented, it will genreate from mcversion and forge version.
     */
    installer?: {
        sha1?: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    /**
     * The minecraft version
     */
    mcversion: string;
    /**
     * The forge version (without minecraft version)
     */
    version: string;
};
export declare const DEFAULT_FORGE_MAVEN = "http://files.minecraftforge.net/maven";
/**
 * The options to install forge.
 */
export interface InstallForgeOptions extends LibraryOptions, InstallOptionsBase, InstallProfileOption {
}
export declare class DownloadForgeInstallerTask extends DownloadTask {
    readonly installJarPath: string;
    constructor(forgeVersion: string, installer: RequiredVersion["installer"], minecraft: MinecraftFolder, options: InstallForgeOptions);
}
export declare function isLegacyForgeInstallerEntries(entries: ForgeInstallerEntries): entries is ForgeLegacyInstallerEntriesPattern;
export declare function isForgeInstallerEntries(entries: ForgeInstallerEntries): entries is ForgeInstallerEntriesPattern;
/**
 * Walk the forge installer file to find key entries
 * @param zip THe forge instal
 * @param forgeVersion Forge version to install
 */
export declare function walkForgeInstallerEntries(zip: ZipFile, forgeVersion: string): Promise<ForgeInstallerEntries>;
export declare class BadForgeInstallerJarError extends Error {
    jarPath: string;
    /**
     * What entry in jar is missing
     */
    entry?: string | undefined;
    error: string;
    constructor(jarPath: string, 
    /**
     * What entry in jar is missing
     */
    entry?: string | undefined);
}
/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The installed version name.
 * @throws {@link BadForgeInstallerJarError}
 */
export declare function installForge(version: RequiredVersion, minecraft: MinecraftLocation, options?: InstallForgeOptions): Promise<string>;
/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The task to install the forge
 * @throws {@link BadForgeInstallerJarError}
 */
export declare function installForgeTask(version: RequiredVersion, minecraft: MinecraftLocation, options?: InstallForgeOptions): Task<string>;
/**
 * Query the webpage content from files.minecraftforge.net.
 *
 * You can put the last query result to the fallback option. It will check if your old result is up-to-date.
 * It will request a new page only when the fallback option is outdated.
 *
 * @param option The option can control querying minecraft version, and page caching.
 */
export declare function getForgeVersionList(option?: {
    /**
     * The minecraft version you are requesting
     */
    mcversion?: string;
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: ForgeVersionList;
}): Promise<ForgeVersionList>;
export {};
//# sourceMappingURL=forge.d.ts.map