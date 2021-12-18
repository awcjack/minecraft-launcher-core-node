import { MinecraftLocation } from "@xmcl/core";
import { Timestamped } from "./http/fetch";
import { InstallOptions } from "./utils";
export declare const YARN_MAVEN_URL = "https://maven.fabricmc.net/net/fabricmc/yarn/maven-metadata.xml";
export declare const LOADER_MAVEN_URL = "https://maven.fabricmc.net/net/fabricmc/fabric-loader/maven-metadata.xml";
/**
 * Fabric Yarn version list
 * @see https://github.com/FabricMC/yarn
 */
export interface FabricYarnVersionList extends Timestamped {
    versions: FabricArtifactVersion[];
}
/**
 * Fabric mod loader version list
 * @see https://fabricmc.net/
 */
export interface FabricLoaderVersionList extends Timestamped {
    versions: FabricArtifactVersion[];
}
export interface FabricArtifactVersion {
    gameVersion?: string;
    separator?: string;
    build?: number;
    maven: string;
    version: string;
    stable: boolean;
}
export interface FabricArtifacts {
    mappings: FabricArtifactVersion[];
    loader: FabricArtifactVersion[];
}
export interface FabricLoaderArtifact {
    loader: FabricArtifactVersion;
    intermediary: FabricArtifactVersion;
    launcherMeta: {
        version: number;
        libraries: {
            client: {
                name: string;
                url: string;
            }[];
            common: {
                name: string;
                url: string;
            }[];
            server: {
                name: string;
                url: string;
            }[];
        };
        mainClass: {
            client: string;
            server: string;
        };
    };
}
export declare const DEFAULT_FABRIC_API = "https://meta.fabricmc.net/v2";
/**
 * Get all the artifacts provided by fabric
 * @param remote The fabric API host
 * @beta
 */
export declare function getFabricArtifacts(remote?: string): Promise<FabricArtifacts>;
/**
 * Get fabric-yarn artifact list
 * @param remote The fabric API host
 * @beta
 */
export declare function getYarnArtifactList(remote?: string): Promise<FabricArtifactVersion[]>;
/**
 * Get fabric-yarn artifact list by Minecraft version
 * @param minecraft The Minecraft version
 * @param remote The fabric API host
 * @beta
 */
export declare function getYarnArtifactListFor(minecraft: string, remote?: string): Promise<FabricArtifactVersion[]>;
/**
 * Get fabric-loader artifact list
 * @param remote The fabric API host
 * @beta
 */
export declare function getLoaderArtifactList(remote?: string): Promise<FabricArtifactVersion[]>;
/**
 * Get fabric-loader artifact list by Minecraft version
 * @param minecraft The minecraft version
 * @param remote The fabric API host
 * @beta
 */
export declare function getLoaderArtifactListFor(minecraft: string, remote?: string): Promise<FabricLoaderArtifact[]>;
/**
 * Get fabric-loader artifact list by Minecraft version
 * @param minecraft The minecraft version
 * @param loader The yarn-loader version
 * @param remote The fabric API host
 * @beta
 */
export declare function getFabricLoaderArtifact(minecraft: string, loader: string, remote?: string): Promise<FabricLoaderArtifact>;
/**
 * Get or refresh the yarn version list.
 * @beta
 */
export declare function getYarnVersionListFromXML(option?: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: FabricYarnVersionList;
    /**
     * remote maven xml url of this request
     */
    remote?: string;
}): Promise<FabricYarnVersionList>;
/**
 * Get or refresh the fabric mod loader version list.
 * @beta
 */
export declare function getLoaderVersionListFromXML(option: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: FabricLoaderVersionList;
    /**
     * remote maven xml url of this request
     */
    remote?: string;
}): Promise<FabricLoaderVersionList>;
/**
 * Install the fabric to the client. Notice that this will only install the json.
 * You need to call `Installer.installDependencies` to get a full client.
 * @param yarnVersion The yarn version
 * @param loaderVersion The fabric loader version
 * @param minecraft The minecraft location
 * @returns The installed version id
 */
export declare function installFabricYarnAndLoader(yarnVersion: string, loaderVersion: string, minecraft: MinecraftLocation, options?: InstallOptions): Promise<string>;
export interface FabricInstallOptions extends InstallOptions {
    side?: "client" | "server";
    yarnVersion?: string | FabricArtifactVersion;
}
/**
 * Generate fabric version json to the disk according to yarn and loader
 * @param side Client or server
 * @param yarnVersion The yarn version string or artifact
 * @param loader The loader artifact
 * @param minecraft The Minecraft Location
 * @param options The options
 * @beta
 */
export declare function installFabric(loader: FabricLoaderArtifact, minecraft: MinecraftLocation, options?: FabricInstallOptions): Promise<string>;
//# sourceMappingURL=fabric.d.ts.map