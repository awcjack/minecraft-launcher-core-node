import { Agents } from "./agents";
import { URL } from "url";
import fetch from "electron-fetch";

export interface ResourceMetadata {
  url: URL
  isAcceptRanges: boolean
  contentLength: number
  lastModified: string | undefined
  eTag: string | undefined
}

export class FetchMetadataError extends Error {
    constructor(
    readonly error: "FetchResourceNotFound" | "BadResourceRequest" | "FetchResourceServerUnavaiable",
    readonly statusCode: number,
    readonly url: string,
    message: string,
    ) {
        super(message)
    }
}

export async function getMetadata(srcUrl: URL, _headers: Record<string, any>, agents: Agents, useGet: boolean = false): Promise<ResourceMetadata> {
    const res = await fetch(srcUrl, {
        method: useGet ? "GET" : "HEAD",
        headers: _headers
    }, agents);

    const statusCode = res.status ?? 500;
    if (statusCode === 405 && !useGet) {
        return getMetadata(srcUrl, _headers, agents, useGet);
    }
    if (statusCode !== 200 && statusCode !== 201) {
        throw new FetchMetadataError(
            statusCode === 404 ? "FetchResourceNotFound"
                : statusCode >= 500 ? "FetchResourceServerUnavaiable"
                    : "BadResourceRequest",
            statusCode,
            srcUrl.toString(),
            `Fetch download metadata failed due to http error. Status code: ${statusCode} on ${srcUrl.toString()}`)
    }
    const url = srcUrl;
    const isAcceptRanges = res.headers?.get["accept-ranges"] === "bytes";
    const contentLength = res.headers?.get["content-length"] ? Number.parseInt(res.headers?.get["content-length"]) : -1;
    const lastModified = res.headers?.get["last-modified"] ?? undefined;
    const eTag = res.headers?.get.etag ;

    return {
        url,
        isAcceptRanges,
        contentLength,
        lastModified,
        eTag,
    }
}
