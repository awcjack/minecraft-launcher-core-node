/// <reference types="node" />
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";
/**
 * The http(s) agents object for requesting
 */
export interface Agents {
    http?: HttpAgent;
    https?: HttpsAgent;
}
export interface CreateAgentsOptions {
    /**
     * The suggested max concurrency of the download. This is not a strict criteria.
     *
     * This is used to generate the `agents` maxSocket.
     * If `agents` is assigned, this will be ignore.
     */
    maxSocket?: number;
    /**
     * The suggested max concurrency of the download. This is not a strict criteria.
     *
     * This is used to generate the `agents` maxFreeSocket.
     * If `agents` is assigned, this will be ignore.
     */
    maxFreeSocket?: number;
}
export declare function isAgents(agents?: Agents | CreateAgentsOptions): agents is Agents;
export declare function resolveAgents(agents?: Agents | CreateAgentsOptions): Agents;
/**
 * Default create agents object
 */
export declare function createAgents(options?: CreateAgentsOptions): {
    http: HttpAgent;
    https: HttpsAgent;
};
export declare function withAgents<T extends {
    agents?: Agents | CreateAgentsOptions;
}, R>(options: T, scope: (options: T) => R): Promise<R>;
//# sourceMappingURL=agents.d.ts.map