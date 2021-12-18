/// <reference types="node" />
import { Agents } from "./agents";
import { URL } from "url";
export interface ResourceMetadata {
    url: URL;
    isAcceptRanges: boolean;
    contentLength: number;
    lastModified: string | undefined;
    eTag: string | undefined;
}
export declare class FetchMetadataError extends Error {
    readonly error: "FetchResourceNotFound" | "BadResourceRequest" | "FetchResourceServerUnavaiable";
    readonly statusCode: number;
    readonly url: string;
    constructor(error: "FetchResourceNotFound" | "BadResourceRequest" | "FetchResourceServerUnavaiable", statusCode: number, url: string, message: string);
}
export declare function getMetadata(srcUrl: URL, _headers: Record<string, any>, agents: Agents, useGet?: boolean): Promise<ResourceMetadata>;
//# sourceMappingURL=metadata.d.ts.map