import { Issue, LibraryIssue, MinecraftFolder, MinecraftLocation } from "@xmcl/core";
import { InstallProfile, PostProcessor } from "./profile";
export declare type InstallIssues = ProcessorIssue | LibraryIssue;
/**
 * The processor issue
 */
export interface ProcessorIssue extends Issue {
    role: "processor";
    /**
     * The processor
     */
    processor: PostProcessor;
}
export interface InstallProfileIssueReport {
    minecraftLocation: MinecraftFolder;
    installProfile: InstallProfile;
    issues: InstallIssues[];
}
/**
 * Diagnose a install profile status. Check if it processor output correctly processed.
 *
 * This can be used for check if forge correctly installed when minecraft >= 1.13
 * @beta
 *
 * @param installProfile The install profile.
 * @param minecraftLocation The minecraft location
 */
export declare function diagnoseInstall(installProfile: InstallProfile, minecraftLocation: MinecraftLocation): Promise<InstallProfileIssueReport>;
//# sourceMappingURL=diagnose.d.ts.map