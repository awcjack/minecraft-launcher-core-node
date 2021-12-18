import { ResourceMetadata } from "./metadata";
import { Segment } from "./segment";
export declare type DownloadFailedReason = "DownloadAborted" | "DownloadValidationFailed" | "GeneralDownloadException" | NetworkErrorType;
/**
 * Download
 */
export declare class DownloadError extends Error {
    readonly error: DownloadFailedReason;
    readonly metadata: ResourceMetadata | undefined;
    readonly headers: Record<string, any>;
    readonly destination: string;
    readonly segments: Segment[];
    readonly segmentErrors: any[];
    constructor(error: DownloadFailedReason, metadata: ResourceMetadata | undefined, headers: Record<string, any>, destination: string, segments: Segment[], segmentErrors: any[]);
}
export declare type NetworkErrorType = "ConnectionReset" | "ConnectionTimeout" | "OperationCancelled" | "ProtocolError";
export declare function resolveNetworkErrorType(e: any): NetworkErrorType | undefined;
/**
 * A simple util function to determine if this is a common network condition error.
 * @param e Error object
 */
export declare function isCommonNetworkError(e: any): boolean;
//# sourceMappingURL=error.d.ts.map