import { MinecraftFolder, MinecraftLocation, Version as VersionJson } from "@xmcl/core";
import { AbortableTask } from "@xmcl/task";
import { InstallSideOption, LibraryOptions } from "./minecraft";
export interface PostProcessor {
    /**
     * The executable jar path
     */
    jar: string;
    /**
     * The classpath to run
     */
    classpath: string[];
    args: string[];
    outputs?: {
        [key: string]: string;
    };
}
export interface InstallProfile {
    spec?: number;
    /**
     * The type of this installation, like "forge"
     */
    profile: string;
    /**
     * The version of this installation
     */
    version: string;
    /**
     * The version json path
     */
    json: string;
    /**
     * The maven artifact name: <org>:<artifact-id>:<version>
     */
    path: string;
    /**
     * The minecraft version
     */
    minecraft: string;
    /**
     * The processor shared variables. The key is the name of variable to replace.
     *
     * The value of client/server is the value of the variable.
     */
    data?: {
        [key: string]: {
            client: string;
            server: string;
        };
    };
    /**
     * The post processor. Which require java to run.
     */
    processors?: Array<PostProcessor>;
    /**
     * The required install profile libraries
     */
    libraries: VersionJson.NormalLibrary[];
    /**
     * Legacy format
     */
    versionInfo?: VersionJson;
}
export interface InstallProfileOption extends LibraryOptions, InstallSideOption {
    /**
     * New forge (>=1.13) require java to install. Can be a executor or java executable path.
     */
    java?: string;
}
/**
 * Resolve processors in install profile
 */
export declare function resolveProcessors(side: "client" | "server", installProfile: InstallProfile, minecraft: MinecraftFolder): {
    args: string[];
    outputs: {
        [x: string]: string;
    } | undefined;
    /**
     * The executable jar path
     */
    jar: string;
    /**
     * The classpath to run
     */
    classpath: string[];
}[];
/**
 * Post process the post processors from `InstallProfile`.
 *
 * @param processors The processor info
 * @param minecraft The minecraft location
 * @param java The java executable path
 * @throws {@link PostProcessError}
 */
export declare function postProcess(processors: PostProcessor[], minecraft: MinecraftFolder, java: string): any;
/**
 * Install by install profile. The install profile usually contains some preprocess should run before installing dependencies.
 *
 * @param installProfile The install profile
 * @param minecraft The minecraft location
 * @param options The options to install
 * @throws {@link PostProcessError}
 */
export declare function installByProfile(installProfile: InstallProfile, minecraft: MinecraftLocation, options?: InstallProfileOption): any;
/**
 * Install by install profile. The install profile usually contains some preprocess should run before installing dependencies.
 *
 * @param installProfile The install profile
 * @param minecraft The minecraft location
 * @param options The options to install
 */
export declare function installByProfileTask(installProfile: InstallProfile, minecraft: MinecraftLocation, options?: InstallProfileOption): any;
export declare class PostProcessBadJarError extends Error {
    jarPath: string;
    causeBy: Error;
    constructor(jarPath: string, causeBy: Error);
    error: string;
}
export declare class PostProcessNoMainClassError extends Error {
    jarPath: string;
    constructor(jarPath: string);
    error: string;
}
export declare class PostProcessFailedError extends Error {
    jarPath: string;
    commands: string[];
    constructor(jarPath: string, commands: string[], message: string);
    error: string;
}
/**
 * Post process the post processors from `InstallProfile`.
 *
 * @param processors The processor info
 * @param minecraft The minecraft location
 * @param java The java executable path
 * @throws {@link PostProcessError}
 */
export declare class PostProcessingTask extends AbortableTask<void> {
    private processors;
    private minecraft;
    private java;
    readonly name: string;
    private pointer;
    private activeProcess;
    constructor(processors: PostProcessor[], minecraft: MinecraftFolder, java: string);
    protected findMainClass(lib: string): Promise<string>;
    protected isInvalid(outputs: Required<PostProcessor>["outputs"]): Promise<boolean>;
    protected postProcess(mc: MinecraftFolder, proc: PostProcessor, java: string): Promise<void>;
    protected process(): Promise<void>;
    protected abort(isCancelled: boolean): Promise<void>;
    protected isAbortedError(e: any): boolean;
}
//# sourceMappingURL=profile.d.ts.map