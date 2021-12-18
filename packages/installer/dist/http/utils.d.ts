/// <reference types="node" />
import { Agent as HttpAgent, ClientRequest, IncomingMessage, RequestOptions } from "http";
import { Agent as HttpsAgent } from "https";
import { URL } from "url";
export declare function isValidProtocol(protocol: string | undefined | null): protocol is "http:" | "https:";
export declare function urlToRequestOptions(url: URL): RequestOptions;
export declare function format(url: RequestOptions): string;
export declare function fetch(options: RequestOptions, agents?: {
    http?: HttpAgent;
    https?: HttpsAgent;
}): Promise<{
    request: ClientRequest;
    message: IncomingMessage;
}>;
/**
 * Join two urls
 */
export declare function joinUrl(a: string, b: string): string;
export declare function checksumFromFd(fd: number, destination: string, algorithm: string): Promise<any>;
//# sourceMappingURL=utils.d.ts.map