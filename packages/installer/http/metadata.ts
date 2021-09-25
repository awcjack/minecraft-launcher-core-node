import { Agents } from './agents';
import { fetch } from "./utils"

export interface ResourceMetadata {
  url: URL
  isAcceptRanges: boolean
  contentLength: number
  lastModified: string | undefined
  eTag: string | undefined
}

export async function getMetadata(srcUrl: URL, _headers: Record<string, any>, agents: Agents, useGet: boolean = false): Promise<ResourceMetadata> {
  const { message, request } = await fetch({ ...srcUrl, method: useGet ? "GET" : "HEAD", ..._headers }, agents);

  message.resume();
  request.abort();

  const { headers, url: resultUrl, statusCode } = message;
  if (statusCode === 405 && !useGet) {
    return getMetadata(srcUrl, _headers, agents, useGet);
  }
  if (statusCode !== 200 && statusCode !== 201) {
    throw new Error(`HTTP Error: Status code ${statusCode} on ${resultUrl}`);
  }
  const url = resultUrl ?? srcUrl;
  const isAcceptRanges = headers["accept-ranges"] === "bytes";
  const contentLength = headers["content-length"] ? Number.parseInt(headers["content-length"]) : -1;
  const lastModified = headers["last-modified"] ?? undefined;
  const eTag = headers.etag as string | undefined;

  return {
    url: new URL(url),
    isAcceptRanges,
    contentLength,
    lastModified,
    eTag,
  }
}