import { Agents } from "./agents";
export interface Timestamped {
    timestamp: string;
}
export interface FetchOptions {
    method: "GET";
    headers: Record<string, string | string[]>;
}
export declare function fetchText(url: string, agent?: Agents): Promise<string>;
export declare function fetchJson(url: string, agent?: Agents): Promise<any>;
export declare function getIfUpdate(url: string, timestamp?: string, agent?: Agents): Promise<{
    timestamp: string;
    content: string | undefined;
}>;
export declare function getAndParseIfUpdate<T extends Timestamped>(url: string, parser: (s: string) => any, lastObject: T | undefined): Promise<T>;
export declare function getLastModified(url: string, timestamp: string | undefined, agent?: Agents): Promise<readonly [true, string | undefined] | readonly [false, string | undefined]>;
//# sourceMappingURL=fetch.d.ts.map