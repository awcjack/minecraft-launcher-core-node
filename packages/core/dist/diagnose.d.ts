import { ResolvedLibrary, ResolvedVersion } from "./version";
import { MinecraftFolder, MinecraftLocation } from "./folder";
/**
 * Represent a issue for your diagnosed minecraft client.
 */
export interface Issue {
    /**
     * The type of the issue.
     */
    type: "missing" | "corrupted";
    /**
     * The role of the file in Minecraft.
     */
    role: string;
    /**
     * The path of the problematic file.
     */
    file: string;
    /**
     * The useful hint to fix this issue. This should be a human readable string.
     */
    hint: string;
    /**
     * The expected checksum of the file. Can be an empty string if this file is missing or not check checksum at all!
     */
    expectedChecksum: string;
    /**
     * The actual checksum of the file. Can be an empty string if this file is missing or not check checksum at all!
     */
    receivedChecksum: string;
}
export declare type MinecraftIssues = LibraryIssue | MinecraftJarIssue | VersionJsonIssue | AssetIssue | AssetIndexIssue;
/**
 * The library issue represents a corrupted or missing lib.
 * You can use `Installer.installResolvedLibraries` to fix this.
 */
export interface LibraryIssue extends Issue {
    role: "library";
    /**
     * The problematic library
     */
    library: ResolvedLibrary;
}
/**
 * The minecraft jar issue represents a corrupted or missing minecraft jar.
 * You can use `Installer.installVersion` to fix this.
 */
export interface MinecraftJarIssue extends Issue {
    role: "minecraftJar";
    /**
     * The minecraft version for that jar
     */
    version: string;
}
/**
 * The minecraft jar issue represents a corrupted or missing version jar.
 *
 * This means your version is totally broken, and you should reinstall this version.
 *
 * - If this is just a Minecraft version, you will need to use `Installer.install` to re-install Minecraft.
 * - If this is a Forge version, you will need to use `ForgeInstaller.install` to re-install.
 * - Others are the same, just re-install
 */
export interface VersionJsonIssue extends Issue {
    role: "versionJson";
    /**
     * The version of version json that has problem.
     */
    version: string;
}
/**
 * The asset issue represents a corrupted or missing minecraft asset file.
 * You can use `Installer.installResolvedAssets` to fix this.
 */
export interface AssetIssue extends Issue {
    role: "asset";
    /**
     * The problematic asset
     */
    asset: {
        name: string;
        hash: string;
        size: number;
    };
}
/**
 * The asset index issue represents a corrupted or missing minecraft asset index file.
 * You can use `Installer.installAssets` to fix this.
 */
export interface AssetIndexIssue extends Issue {
    role: "assetIndex";
    /**
     * The minecraft version of the asset index
     */
    version: string;
}
export interface MinecraftIssueReport {
    minecraftLocation: MinecraftFolder;
    version: string;
    issues: MinecraftIssues[];
}
/**
 * Diagnose a single file by a certain checksum algorithm. By default, this use sha1
 */
export declare function diagnoseFile<T extends string>({ file, expectedChecksum, role, hint, algorithm }: {
    file: string;
    expectedChecksum: string;
    role: T;
    hint: string;
    algorithm?: string;
}): Promise<{
    readonly type: "missing" | "corrupted";
    readonly role: T;
    readonly file: string;
    readonly expectedChecksum: string;
    readonly receivedChecksum: string;
    readonly hint: string;
} | undefined>;
/**
 * Diagnose the version. It will check the version json/jar, libraries and assets.
 *
 * @param version The version id string
 * @param minecraft The minecraft location
 * @beta
 */
export declare function diagnose(version: string, minecraftLocation: MinecraftLocation): Promise<MinecraftIssueReport>;
/**
 * Diagnose assets currently installed.
 * @param assetObjects The assets object metadata to check
 * @param minecraft The minecraft location
 * @returns The diagnose report
 */
export declare function diagnoseAssets(assetObjects: Record<string, {
    hash: string;
    size: number;
}>, minecraft: MinecraftFolder): Promise<Array<AssetIssue>>;
/**
 * Diagnose all libraries presented in this resolved version.
 *
 * @param resolvedVersion The resolved version to check
 * @param minecraft The minecraft location
 * @returns List of libraries issue
 * @see {@link ResolvedVersion}
 */
export declare function diagnoseLibraries(resolvedVersion: ResolvedVersion, minecraft: MinecraftFolder): Promise<Array<LibraryIssue>>;
export declare function diagnoseAssetIndex(resolvedVersion: ResolvedVersion, minecraft: MinecraftFolder): Promise<AssetIndexIssue | undefined>;
export declare function diagnoseJar(resolvedVersion: ResolvedVersion, minecraft: MinecraftFolder): Promise<MinecraftJarIssue | undefined>;
//# sourceMappingURL=diagnose.d.ts.map