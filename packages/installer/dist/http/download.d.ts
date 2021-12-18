/// <reference types="node" />
import { URL } from "url";
import { AbortSignal } from "./abort";
import { Agents, CreateAgentsOptions } from "./agents";
import { ResourceMetadata } from "./metadata";
import { DefaultRetryHandlerOptions, RetryHandler } from "./retry";
import { DefaultSegmentPolicyOptions, Segment, SegmentPolicy } from "./segment";
import { StatusController } from "./status";
import { ChecksumValidatorOptions, Validator } from "./validator";
export interface DownloadBaseOptions {
    /**
     * The agent of the request
     */
    agents?: Agents | CreateAgentsOptions;
    /**
     * The divide segment options
     */
    segmentPolicy?: SegmentPolicy | DefaultSegmentPolicyOptions;
    /**
     * The retry handler
     */
    retryHandler?: RetryHandler | DefaultRetryHandlerOptions;
    /**
     * The header of the request
     */
    headers?: Record<string, any>;
}
export interface DownloadOptions extends DownloadBaseOptions {
    /**
     * The url or urls (fallback) of the resource
     */
    url: string | string[];
    /**
     * The header of the request
     */
    headers?: Record<string, any>;
    /**
     * If the download is aborted, and want to recover, you can use this option to recover the download
     */
    segments?: Segment[];
    /**
     * If the download is aborted, and want to recover, you can use this option to recover the download
     */
    metadata?: ResourceMetadata;
    /**
     * Where the file will be downloaded to
     */
    destination: string;
    /**
     * The status controller. If you want to track download progress, you should use this.
     */
    statusController?: StatusController;
    /**
     * The validator, or the options to create a validator based on checksum.
     */
    validator?: Validator | ChecksumValidatorOptions;
}
/**
 * Download url or urls to a file path. This process is abortable, it's compatible with the dom like `AbortSignal`.
 */
export declare function download(options: DownloadOptions): Promise<void>;
export declare function createDownload(options: DownloadOptions): Download;
export declare class Download {
    /**
     * The original request url with fallback
     */
    readonly urls: string[];
    /**
     * The headers of the request
     */
    readonly headers: Record<string, any>;
    /**
     * The agent of the request
     */
    readonly agents: Agents;
    /**
     * Where the file download to
     */
    readonly destination: string;
    /**
    * The current download status
    */
    protected segments: Segment[];
    /**
     * The cached resource metadata
     */
    protected metadata: ResourceMetadata | undefined;
    protected segmentPolicy: SegmentPolicy;
    protected statusController: StatusController;
    protected retryHandler: RetryHandler;
    protected validator: Validator;
    /**
     * current fd
     */
    protected fd: number;
    constructor(
    /**
     * The original request url with fallback
     */
    urls: string[], 
    /**
     * The headers of the request
     */
    headers: Record<string, any>, 
    /**
     * The agent of the request
     */
    agents: Agents, 
    /**
     * Where the file download to
     */
    destination: string, 
    /**
    * The current download status
    */
    segments: Segment[], 
    /**
     * The cached resource metadata
     */
    metadata: ResourceMetadata | undefined, segmentPolicy: SegmentPolicy, statusController: StatusController, retryHandler: RetryHandler, validator: Validator);
    protected updateMetadata(url: URL): Promise<ResourceMetadata>;
    protected processDownload(metadata: ResourceMetadata, abortSignal: AbortSignal): Promise<void>;
    protected downloadUrl(url: string, abortSignal: AbortSignal): Promise<void>;
    /**
     * Start to download
     */
    start(abortSignal?: AbortSignal): Promise<void>;
}
//# sourceMappingURL=download.d.ts.map