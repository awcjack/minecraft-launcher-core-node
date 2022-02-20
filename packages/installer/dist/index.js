'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var core = require('@xmcl/core');
require('crypto');
var http = require('http');
var fs = require('fs');
var https = require('https');
var url = require('url');
var child_process = require('child_process');
var path = require('path');
var util = require('util');
var task = require('@xmcl/task');
var forgeSiteParser = require('@xmcl/forge-site-parser');
var unzip = require('@xmcl/unzip');
var constants = require('constants');
var os = require('os');
var electronFetch = require('electron-fetch');
var asm = require('@xmcl/asm');

const unlink = util.promisify(fs.unlink);
const stat = util.promisify(fs.stat);
const link = util.promisify(fs.link);
const open = util.promisify(fs.open);
const close = util.promisify(fs.close);
const copyFile = util.promisify(fs.copyFile);
const truncate = util.promisify(fs.ftruncate);
function missing(target) {
    return core._exists(target).then((v) => !v);
}
async function ensureDir(target) {
    try {
        await core._mkdir(target);
    }
    catch (err) {
        const e = err;
        if (await stat(target).then((s) => s.isDirectory()).catch(() => false)) {
            return;
        }
        if (e.code === "EEXIST") {
            return;
        }
        if (e.code === "ENOENT") {
            if (path.dirname(target) === target) {
                throw e;
            }
            try {
                await ensureDir(path.dirname(target));
                await core._mkdir(target);
            }
            catch (_a) {
                if (await stat(target).then((s) => s.isDirectory()).catch((e) => false)) {
                    return;
                }
                throw e;
            }
            return;
        }
        throw e;
    }
}
function ensureFile(target) {
    return ensureDir(path.dirname(target));
}
function normalizeArray(arr = []) {
    return arr instanceof Array ? arr : [arr];
}
function spawnProcess(javaPath, args, options) {
    let process = child_process.spawn(javaPath, args, options);
    return waitProcess(process);
}
function waitProcess(process) {
    return new Promise((resolve, reject) => {
        let errorMsg = [];
        process.on("error", reject);
        process.on("close", (code) => {
            if (code !== 0) {
                reject(errorMsg.join(""));
            }
            else {
                resolve();
            }
        });
        process.on("exit", (code) => {
            if (code !== 0) {
                reject(errorMsg.join(""));
            }
            else {
                resolve();
            }
        });
        process.stdout.setEncoding("utf-8");
        process.stdout.on("data", (buf) => { });
        process.stderr.setEncoding("utf-8");
        process.stderr.on("data", (buf) => { errorMsg.push(buf.toString()); });
    });
}
function errorToString(e) {
    if (e instanceof Error) {
        return e.stack ? e.stack : e.message;
    }
    return e.toString();
}

function isValidProtocol(protocol) {
    return protocol === "http:" || protocol === "https:";
}
function urlToRequestOptions(url) {
    return {
        host: url.host,
        hostname: url.hostname,
        protocol: url.protocol,
        port: url.port,
        path: url.pathname + url.search,
    };
}
function format(url) {
    return `${url.protocol}//${url.host}${url.path}`;
}
function mergeRequestOptions(original, newOptions) {
    let options = { ...original };
    for (let [key, value] of Object.entries(newOptions)) {
        if (value !== null) {
            options[key] = value;
        }
    }
    return options;
}
function fetch(options, agents = {}) {
    return new Promise((resolve, reject) => {
        function follow(options) {
            if (!isValidProtocol(options.protocol)) {
                reject(new Error(`Invalid URL: ${format(options)}`));
            }
            else {
                let [req, agent] = options.protocol === "http:" ? [http.request, agents.http] : [https.request, agents.https];
                let clientReq = req({ ...options, agent }, (m) => {
                    if ((m.statusCode === 302 || m.statusCode === 301 || m.statusCode === 303 || m.statusCode === 308) && typeof m.headers.location === "string") {
                        m.resume();
                        follow(mergeRequestOptions(options, urlToRequestOptions(new url.URL(m.headers.location, `${options.protocol}//${options.host}`))));
                    }
                    else {
                        m.url = m.url || format(options);
                        clientReq.removeListener("error", reject);
                        resolve({ request: clientReq, message: m });
                    }
                });
                clientReq.addListener("error", reject);
                clientReq.end();
            }
        }
        follow(options);
    });
}
/**
 * Join two urls
 */
function joinUrl(a, b) {
    if (a.endsWith("/") && b.startsWith("/")) {
        return a + b.substring(1);
    }
    if (!a.endsWith("/") && !b.startsWith("/")) {
        return a + "/" + b;
    }
    return a + b;
}

async function fetchText(url$1, agent) {
    let parsed = new url.URL(url$1);
    if (!isValidProtocol(parsed.protocol)) {
        throw new Error(`Invalid protocol ${parsed.protocol}`);
    }
    let { message: msg } = await fetch({
        method: "GET",
        ...urlToRequestOptions(parsed),
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36 Edg/80.0.361.48",
        },
    }, agent);
    let buf = await new Promise((resolve, reject) => {
        let contents = [];
        msg.on("data", (chunk) => { contents.push(chunk); });
        msg.on("end", () => { resolve(Buffer.concat(contents)); });
        msg.on("error", reject);
    });
    return buf.toString();
}
async function fetchJson(url, agent) {
    return JSON.parse(await fetchText(url, agent));
}
async function getIfUpdate(url$1, timestamp, agent = {}) {
    let parsed = new url.URL(url$1);
    if (!isValidProtocol(parsed.protocol)) {
        throw new Error(`Invalid protocol ${parsed.protocol}`);
    }
    let { message: msg } = await fetch({
        method: "GET",
        ...urlToRequestOptions(parsed),
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36 Edg/80.0.361.48",
            "If-Modified-Since": timestamp !== null && timestamp !== void 0 ? timestamp : "",
        },
    }, agent);
    let buf = await new Promise((resolve, reject) => {
        let contents = [];
        msg.on("data", (chunk) => { contents.push(chunk); });
        msg.on("end", () => { resolve(Buffer.concat(contents)); });
        msg.on("error", reject);
    });
    let { statusCode, headers } = msg;
    if (statusCode === 304) {
        return {
            timestamp: headers["last-modified"],
            content: undefined,
        };
    }
    else if (statusCode === 200 || statusCode === 204) {
        return {
            timestamp: headers["last-modified"],
            content: buf.toString(),
        };
    }
    throw new Error(`Failure on response status code: ${statusCode}.`);
}
async function getAndParseIfUpdate(url, parser, lastObject) {
    let { content, timestamp } = await getIfUpdate(url, lastObject === null || lastObject === void 0 ? void 0 : lastObject.timestamp);
    if (content) {
        return { ...parser(content), timestamp, };
    }
    return lastObject; // this cannot be undefined as the content be null only and only if the lastObject is presented.
}
async function getLastModified(url$1, timestamp, agent = {}) {
    let parsed = new url.URL(url$1);
    if (!isValidProtocol(parsed.protocol)) {
        throw new Error(`Invalid protocol ${parsed.protocol}`);
    }
    let { message: msg } = await fetch({
        method: "HEAD",
        ...urlToRequestOptions(parsed),
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36 Edg/80.0.361.48",
            "If-Modified-Since": timestamp !== null && timestamp !== void 0 ? timestamp : "",
        },
    }, agent);
    msg.resume();
    let { headers, statusCode } = msg;
    if (statusCode === 304) {
        return [true, headers["last-modified"]];
    }
    else if (statusCode === 200 || statusCode === 204) {
        return [false, headers["last-modified"]];
    }
    throw new Error(`Failure on response status code: ${statusCode}.`);
}

const YARN_MAVEN_URL = "https://maven.fabricmc.net/net/fabricmc/yarn/maven-metadata.xml";
const LOADER_MAVEN_URL = "https://maven.fabricmc.net/net/fabricmc/fabric-loader/maven-metadata.xml";
const DEFAULT_FABRIC_API = "https://meta.fabricmc.net/v2";
/**
 * Get all the artifacts provided by fabric
 * @param remote The fabric API host
 * @beta
 */
function getFabricArtifacts(remote = DEFAULT_FABRIC_API) {
    return fetchJson(remote + "/versions");
}
/**
 * Get fabric-yarn artifact list
 * @param remote The fabric API host
 * @beta
 */
function getYarnArtifactList(remote = DEFAULT_FABRIC_API) {
    return fetchJson(remote + "/versions/yarn");
}
/**
 * Get fabric-yarn artifact list by Minecraft version
 * @param minecraft The Minecraft version
 * @param remote The fabric API host
 * @beta
 */
function getYarnArtifactListFor(minecraft, remote = DEFAULT_FABRIC_API) {
    return fetchJson(remote + "/versions/yarn/" + minecraft);
}
/**
 * Get fabric-loader artifact list
 * @param remote The fabric API host
 * @beta
 */
function getLoaderArtifactList(remote = DEFAULT_FABRIC_API) {
    return fetchJson(remote + "/versions/loader");
}
/**
 * Get fabric-loader artifact list by Minecraft version
 * @param minecraft The minecraft version
 * @param remote The fabric API host
 * @beta
 */
function getLoaderArtifactListFor(minecraft, remote = DEFAULT_FABRIC_API) {
    return fetchJson(remote + "/versions/loader/" + minecraft);
}
/**
 * Get fabric-loader artifact list by Minecraft version
 * @param minecraft The minecraft version
 * @param loader The yarn-loader version
 * @param remote The fabric API host
 * @beta
 */
function getFabricLoaderArtifact(minecraft, loader, remote = DEFAULT_FABRIC_API) {
    return fetchJson(remote + "/versions/loader/" + minecraft + "/" + loader);
}
/**
 * Get or refresh the yarn version list.
 * @beta
 */
async function getYarnVersionListFromXML(option = {}) {
    var _a;
    let [modified, timestamp] = await getLastModified(YARN_MAVEN_URL, (_a = option.original) === null || _a === void 0 ? void 0 : _a.timestamp);
    if (modified || !option.original) {
        let versions = await getYarnArtifactList(option.remote);
        return {
            versions: versions,
            timestamp: timestamp !== null && timestamp !== void 0 ? timestamp : "",
        };
    }
    return option.original;
}
/**
 * Get or refresh the fabric mod loader version list.
 * @beta
 */
async function getLoaderVersionListFromXML(option) {
    var _a;
    let [modified, timestamp] = await getLastModified(LOADER_MAVEN_URL, (_a = option.original) === null || _a === void 0 ? void 0 : _a.timestamp);
    if (modified || !option.original) {
        let versions = await getLoaderArtifactList(option.remote);
        return {
            versions: versions,
            timestamp: timestamp !== null && timestamp !== void 0 ? timestamp : "",
        };
    }
    return option.original;
}
/**
 * Install the fabric to the client. Notice that this will only install the json.
 * You need to call `Installer.installDependencies` to get a full client.
 * @param yarnVersion The yarn version
 * @param loaderVersion The fabric loader version
 * @param minecraft The minecraft location
 * @returns The installed version id
 */
async function installFabricYarnAndLoader(yarnVersion, loaderVersion, minecraft, options = {}) {
    const folder = core.MinecraftFolder.from(minecraft);
    const mcversion = yarnVersion.split("+")[0];
    const id = options.versionId || `${mcversion}-fabric${yarnVersion}-${loaderVersion}`;
    const jsonFile = folder.getVersionJson(id);
    const body = await fetchJson(`https://fabricmc.net/download/technic/?yarn=${encodeURIComponent(yarnVersion)}&loader=${encodeURIComponent(loaderVersion)}`);
    body.id = id;
    if (typeof options.inheritsFrom === "string") {
        body.inheritsFrom = options.inheritsFrom;
    }
    await ensureFile(jsonFile);
    await core._writeFile(jsonFile, JSON.stringify(body));
    return id;
}
/**
 * Generate fabric version json to the disk according to yarn and loader
 * @param side Client or server
 * @param yarnVersion The yarn version string or artifact
 * @param loader The loader artifact
 * @param minecraft The Minecraft Location
 * @param options The options
 * @beta
 */
async function installFabric(loader, minecraft, options = {}) {
    var _a;
    const folder = core.MinecraftFolder.from(minecraft);
    let yarn;
    let side = (_a = options.side) !== null && _a !== void 0 ? _a : "client";
    let id = options.versionId;
    let mcversion;
    if (options.yarnVersion) {
        let yarnVersion = options.yarnVersion;
        if (typeof yarnVersion === "string") {
            yarn = yarnVersion;
            mcversion = yarn.split("+")[0];
        }
        else {
            yarn = yarnVersion.version;
            mcversion = yarnVersion.gameVersion || yarn.split("+")[0];
        }
    }
    else {
        mcversion = loader.intermediary.version;
    }
    if (!id) {
        id = mcversion;
        if (yarn) {
            id += `-fabric${yarn}-loader${loader.loader.version}`;
        }
        else {
            id += `-fabric${loader.loader.version}`;
        }
    }
    let libraries = [
        { name: loader.loader.maven, url: "https://maven.fabricmc.net/" },
        { name: loader.intermediary.maven, url: "https://maven.fabricmc.net/" },
        ...(options.yarnVersion
            ? [{ name: `net.fabricmc:yarn:${yarn}`, url: "https://maven.fabricmc.net/" }] : []),
        ...loader.launcherMeta.libraries.common,
        ...loader.launcherMeta.libraries[side],
    ];
    let mainClass = loader.launcherMeta.mainClass[side];
    let inheritsFrom = options.inheritsFrom || mcversion;
    let jsonFile = folder.getVersionJson(id);
    await ensureFile(jsonFile);
    await core._writeFile(jsonFile, JSON.stringify({
        id,
        inheritsFrom,
        mainClass,
        libraries,
        arguments: {
            game: [],
            jvm: [],
        },
        releaseTime: new Date().toJSON(),
        time: new Date().toJSON(),
    }));
    return id;
}

const DEFAULT_VERSION_MANIFEST = "http://dl.liteloader.com/versions/versions.json";
function processLibraries(lib) {
    if (Object.keys(lib).length === 1 && lib.name) {
        if (lib.name.startsWith("org.ow2.asm")) {
            lib.url = "https://files.minecraftforge.net/maven/";
        }
    }
    return lib;
}
exports.LiteloaderVersionList = void 0;
(function (LiteloaderVersionList) {
    function parse(content) {
        const result = JSON.parse(content);
        const metalist = { meta: result.meta, versions: {} };
        for (const mcversion in result.versions) {
            const versions = metalist.versions[mcversion] = {};
            const snapshots = result.versions[mcversion].snapshots;
            const artifacts = result.versions[mcversion].artefacts; // that's right, artefact
            const url = result.versions[mcversion].repo.url;
            if (snapshots) {
                const { stream, file, version, md5, timestamp, tweakClass, libraries } = snapshots["com.mumfrey:liteloader"].latest;
                const type = (stream === "RELEASE" ? "RELEASE" : "SNAPSHOT");
                versions.snapshot = {
                    url,
                    type,
                    file,
                    version,
                    md5,
                    timestamp,
                    mcversion,
                    tweakClass,
                    libraries: libraries.map(processLibraries),
                };
            }
            if (artifacts) {
                const { stream, file, version, md5, timestamp, tweakClass, libraries } = artifacts["com.mumfrey:liteloader"].latest;
                const type = (stream === "RELEASE" ? "RELEASE" : "SNAPSHOT");
                versions.release = {
                    url,
                    type,
                    file,
                    version,
                    md5,
                    timestamp,
                    mcversion,
                    tweakClass,
                    libraries: libraries.map(processLibraries),
                };
            }
        }
        return metalist;
    }
    LiteloaderVersionList.parse = parse;
})(exports.LiteloaderVersionList || (exports.LiteloaderVersionList = {}));
const snapshotRoot = "http://dl.liteloader.com/versions/";
const releaseRoot = "http://repo.mumfrey.com/content/repositories/liteloader/";
/**
 * This error is only thrown from liteloader install currently.
 */
class MissingVersionJsonError extends Error {
    constructor(version, 
    /**
     * The path of version json
     */
    path) {
        super();
        this.version = version;
        this.path = path;
        this.error = "MissingVersionJson";
    }
}
/**
 * Get or update the LiteLoader version list.
 *
 * This will request liteloader offical json by default. You can replace the request by assigning the remote option.
 */
function getLiteloaderVersionList(option = {}) {
    return getAndParseIfUpdate(option.remote || DEFAULT_VERSION_MANIFEST, exports.LiteloaderVersionList.parse, option.original);
}
/**
 * Install the liteloader to specific minecraft location.
 *
 * This will install the liteloader amount on the corresponded Minecraft version by default.
 * If you want to install over the forge. You should first install forge and pass the installed forge version id to the third param,
 * like `1.12-forge-xxxx`
 *
 * @param versionMeta The liteloader version metadata.
 * @param location The minecraft location you want to install
 * @param version The real existed version id (under the the provided minecraft location) you want to installed liteloader inherit
 * @throws {@link MissingVersionJsonError}
 */
function installLiteloader(versionMeta, location, options) {
    return installLiteloaderTask(versionMeta, location, options).startAndWait();
}
function buildVersionInfo(versionMeta, mountedJSON) {
    const id = `${mountedJSON.id}-Liteloader${versionMeta.mcversion}-${versionMeta.version}`;
    const time = new Date(Number.parseInt(versionMeta.timestamp, 10) * 1000).toISOString();
    const releaseTime = time;
    const type = versionMeta.type;
    const libraries = [
        {
            name: `com.mumfrey:liteloader:${versionMeta.version}`,
            url: type === "SNAPSHOT" ? snapshotRoot : releaseRoot,
        },
        ...versionMeta.libraries.map(processLibraries),
    ];
    const mainClass = "net.minecraft.launchwrapper.Launch";
    const inheritsFrom = mountedJSON.id;
    const jar = mountedJSON.jar || mountedJSON.id;
    const info = {
        id, time, releaseTime, type, libraries, mainClass, inheritsFrom, jar,
    };
    if (mountedJSON.arguments) {
        // liteloader not supported for version > 1.12...
        // just write this for exception
        info.arguments = {
            game: ["--tweakClass", versionMeta.tweakClass],
            jvm: [],
        };
    }
    else {
        info.minecraftArguments = `--tweakClass ${versionMeta.tweakClass} ` + mountedJSON.minecraftArguments;
    }
    return info;
}
/**
 * Install the liteloader to specific minecraft location.
 *
 * This will install the liteloader amount on the corresponded Minecraft version by default.
 * If you want to install over the forge. You should first install forge and pass the installed forge version id to the third param,
 * like `1.12-forge-xxxx`
 *
 * @tasks installLiteloader, installLiteloader.resolveVersionJson installLiteloader.generateLiteloaderJson
 *
 * @param versionMeta The liteloader version metadata.
 * @param location The minecraft location you want to install
 * @param version The real existed version id (under the the provided minecraft location) you want to installed liteloader inherit
 */
function installLiteloaderTask(versionMeta, location, options = {}) {
    return task.task("installLiteloader", async function installLiteloader() {
        const mc = core.MinecraftFolder.from(location);
        const mountVersion = options.inheritsFrom || versionMeta.mcversion;
        const mountedJSON = await this.yield(task.task("resolveVersionJson", async function resolveVersionJson() {
            if (await missing(mc.getVersionJson(mountVersion))) {
                throw new MissingVersionJsonError(mountVersion, mc.getVersionJson(mountVersion));
            }
            return core._readFile(mc.getVersionJson(mountVersion)).then((b) => b.toString()).then(JSON.parse);
        }));
        const versionInf = await this.yield(task.task("generateLiteloaderJson", async function generateLiteloaderJson() {
            const inf = buildVersionInfo(versionMeta, mountedJSON);
            inf.id = options.versionId || inf.id;
            inf.inheritsFrom = options.inheritsFrom || inf.inheritsFrom;
            const versionPath = mc.getVersionRoot(inf.id);
            await ensureDir(versionPath);
            await core._writeFile(path.join(versionPath, inf.id + ".json"), JSON.stringify(inf, undefined, 4));
            return inf;
        }));
        return versionInf.id;
    });
}

function resolveAbortSignal(signal) {
    if (signal) {
        return signal;
    }
    return {
        aborted: false,
        addEventListener() { return this; },
        removeEventListener() { return this; }
    };
}

function isAgents(agents) {
    if (!agents) {
        return false;
    }
    return "http" in agents || "https" in agents;
}
function resolveAgents(agents) {
    if (isAgents(agents)) {
        return agents;
    }
    return createAgents(agents);
}
/**
 * Default create agents object
 */
function createAgents(options = {}) {
    var _a, _b, _c, _d;
    return {
        http: new http.Agent({
            maxSockets: (_a = options.maxSocket) !== null && _a !== void 0 ? _a : os.cpus().length * 4,
            maxFreeSockets: (_b = options.maxFreeSocket) !== null && _b !== void 0 ? _b : 64,
            keepAlive: true,
        }),
        https: new https.Agent({
            maxSockets: (_c = options.maxSocket) !== null && _c !== void 0 ? _c : os.cpus().length * 4,
            maxFreeSockets: (_d = options.maxFreeSocket) !== null && _d !== void 0 ? _d : 64,
            keepAlive: true,
        })
    };
}
async function withAgents(options, scope) {
    var _a, _b;
    if (!isAgents(options.agents)) {
        const agents = resolveAgents(options.agents);
        try {
            const r = await scope({ ...options, agents });
            return r;
        }
        finally {
            (_a = agents.http) === null || _a === void 0 ? void 0 : _a.destroy();
            (_b = agents.https) === null || _b === void 0 ? void 0 : _b.destroy();
        }
    }
    else {
        return scope(options);
    }
}

/**
 * Download
 */
class DownloadError extends Error {
    constructor(error, metadata, headers, destination, segments, segmentErrors) {
        super(`The download failed! ${error}`);
        this.error = error;
        this.metadata = metadata;
        this.headers = headers;
        this.destination = destination;
        this.segments = segments;
        this.segmentErrors = segmentErrors;
    }
}
function resolveNetworkErrorType(e) {
    if (e.code === "ECONNRESET") {
        return "ConnectionReset";
    }
    if (e.code === "ETIMEDOUT") {
        return "ConnectionTimeout";
    }
    if (e.code === "EPROTO") {
        return "ProtocolError";
    }
    if (e.code === "ECANCELED") {
        return "OperationCancelled";
    }
}
/**
 * A simple util function to determine if this is a common network condition error.
 * @param e Error object
 */
function isCommonNetworkError(e) {
    if (typeof e.code === "string") {
        return e.code === "ECONNRESET"
            || e.code === "ETIMEDOUT"
            || e.code === "EPROTO"
            || e.code === "ECANCELED";
    }
    return false;
}

class FetchMetadataError extends Error {
    constructor(error, statusCode, url, message) {
        super(message);
        this.error = error;
        this.statusCode = statusCode;
        this.url = url;
    }
}
async function getMetadata(srcUrl, _headers, agents, useGet = false) {
    var _a, _b, _c, _d, _e, _f, _g;
    const res = await electronFetch.fetch(srcUrl, {
        method: useGet ? "GET" : "HEAD",
        headers: _headers
    }, agents);
    const statusCode = (_a = res.status) !== null && _a !== void 0 ? _a : 500;
    if (statusCode === 405 && !useGet) {
        return getMetadata(srcUrl, _headers, agents, useGet);
    }
    if (statusCode !== 200 && statusCode !== 201) {
        throw new FetchMetadataError(statusCode === 404 ? "FetchResourceNotFound"
            : statusCode >= 500 ? "FetchResourceServerUnavaiable"
                : "BadResourceRequest", statusCode, srcUrl.toString(), `Fetch download metadata failed due to http error. Status code: ${statusCode} on ${srcUrl.toString()}`);
    }
    const url = srcUrl;
    const isAcceptRanges = ((_b = res.headers) === null || _b === void 0 ? void 0 : _b.get["accept-ranges"]) === "bytes";
    const contentLength = ((_c = res.headers) === null || _c === void 0 ? void 0 : _c.get["content-length"]) ? Number.parseInt((_d = res.headers) === null || _d === void 0 ? void 0 : _d.get["content-length"]) : -1;
    const lastModified = (_f = (_e = res.headers) === null || _e === void 0 ? void 0 : _e.get["last-modified"]) !== null && _f !== void 0 ? _f : undefined;
    const eTag = (_g = res.headers) === null || _g === void 0 ? void 0 : _g.get.etag;
    return {
        url,
        isAcceptRanges,
        contentLength,
        lastModified,
        eTag,
    };
}

function isRetryHandler(options) {
    if (!options) {
        return false;
    }
    return "retry" in options && typeof options.retry === "function";
}
function resolveRetryHandler(options) {
    var _a, _b;
    if (isRetryHandler(options)) {
        return options;
    }
    return createRetryHandler((_a = options === null || options === void 0 ? void 0 : options.maxRetryCount) !== null && _a !== void 0 ? _a : 3, (_b = options === null || options === void 0 ? void 0 : options.shouldRetry) !== null && _b !== void 0 ? _b : isCommonNetworkError);
}
/**
 * Create a simple count based retry handler
 * @param maxRetryCount The max count we should try
 * @param shouldRetry Should the error be retry
 */
function createRetryHandler(maxRetryCount, shouldRetry) {
    const handler = {
        retry(url, attempt, error) {
            return shouldRetry(error) && attempt < maxRetryCount;
        }
    };
    return handler;
}

function isSegmentPolicy(segmentOptions) {
    if (!segmentOptions) {
        return false;
    }
    return "computeSegments" in segmentOptions && typeof segmentOptions.computeSegments === "function";
}
function resolveSegmentPolicy(segmentOptions) {
    var _a;
    if (isSegmentPolicy(segmentOptions)) {
        return segmentOptions;
    }
    return new DefaultSegmentPolicy((_a = segmentOptions === null || segmentOptions === void 0 ? void 0 : segmentOptions.segmentThreshold) !== null && _a !== void 0 ? _a : 2 * 1000000, 4);
}
class DefaultSegmentPolicy {
    constructor(segmentThreshold, concurrency) {
        this.segmentThreshold = segmentThreshold;
        this.concurrency = concurrency;
    }
    computeSegments(total) {
        const { segmentThreshold: chunkSize, concurrency } = this;
        const partSize = Math.max(chunkSize, Math.floor(total / concurrency));
        const segments = [];
        for (let cur = 0, chunkSize = 0; cur < total; cur += chunkSize) {
            const remain = total - cur;
            if (remain >= partSize) {
                chunkSize = partSize;
                segments.push({ start: cur, end: cur + chunkSize - 1 });
            }
            else {
                const last = segments[segments.length - 1];
                if (!last) {
                    segments.push({ start: 0, end: remain - 1 });
                }
                else {
                    last.end = last.end + remain;
                }
                cur = total;
            }
        }
        return segments;
    }
}

function createStatusController() {
    let total = 0;
    let progress = 0;
    const controller = {
        get total() { return total; },
        get progress() { return progress; },
        reset(_progress, _total) { progress = _progress; total = _total; },
        onProgress(_, _progress) { progress = _progress; }
    };
    return controller;
}
function resolveStatusController(controller) {
    if (!controller) {
        return createStatusController();
    }
    return controller;
}

class ChecksumValidator {
    constructor(checksum) {
        this.checksum = checksum;
    }
    async validate(fd, destination, url) {
        if (this.checksum) {
            const actual = await core.checksum(destination, this.checksum.algorithm);
            const expect = this.checksum.hash;
            if (actual !== expect) {
                throw new ChecksumNotMatchError(this.checksum.algorithm, this.checksum.hash, actual, destination, url);
            }
        }
    }
}
function isValidator(options) {
    if (!options) {
        return false;
    }
    return "validate" in options && typeof options.validate === "function";
}
function resolveValidator(options) {
    if (isValidator(options)) {
        return options;
    }
    if (options) {
        return new ChecksumValidator({ hash: options.hash, algorithm: options.algorithm });
    }
    return { validate() { return Promise.resolve(); } };
}
class ZipValidator {
    async validate(fd, destination, url) {
        try {
            const file = await unzip.open(fd);
            file.close();
        }
        catch (e) {
            throw new ValidationError("InvalidZipError", e.message);
        }
    }
}
class JsonValidator {
    validate(fd, destination, url) {
        return new Promise((resolve, reject) => {
            const read = fs.createReadStream(destination, {
                fd,
                autoClose: false,
                emitClose: true,
            });
            let content = "";
            read.on("data", (buf) => {
                content += buf.toString();
            });
            read.on("end", () => {
                try {
                    JSON.parse(content);
                    resolve();
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
}
class ValidationError extends Error {
    constructor(error, message) {
        super(message);
        this.error = error;
    }
}
class ChecksumNotMatchError extends ValidationError {
    constructor(algorithm, expect, actual, file, source) {
        super("ChecksumNotMatchError", source ? `File ${file} (${source}) ${algorithm} checksum not match. Expect: ${expect}. Actual: ${actual}.` : `File ${file} ${algorithm} checksum not match. Expect: ${expect}. Actual: ${actual}.`);
        this.algorithm = algorithm;
        this.expect = expect;
        this.actual = actual;
        this.file = file;
        this.source = source;
    }
}

// @ts-ignore
const pfstat = util.promisify(fs.fstat);
const pfdatasync = util.promisify(fs.fdatasync);
class AbortError extends Error {
}
/**
 * Download url or urls to a file path. This process is abortable, it's compatible with the dom like `AbortSignal`.
 */
function download(options) {
    const worker = createDownload(options);
    return worker.start();
}
function createDownload(options) {
    var _a;
    return new Download(typeof options.url === "string" ? [options.url] : options.url, (_a = options.headers) !== null && _a !== void 0 ? _a : {}, resolveAgents(options.agents), options.destination, options.segments, options.metadata, resolveSegmentPolicy(options.segmentPolicy), resolveStatusController(options.statusController), resolveRetryHandler(options.retryHandler), resolveValidator(options.validator));
}
class Download {
    constructor(
    /**
     * The original request url with fallback
     */
    urls, 
    /**
     * The headers of the request
     */
    headers, 
    /**
     * The agent of the request
     */
    agents, 
    /**
     * Where the file download to
     */
    destination, 
    /**
    * The current download status
    */
    segments = [], 
    /**
     * The cached resource metadata
     */
    metadata, segmentPolicy, statusController, retryHandler, validator) {
        this.urls = urls;
        this.headers = headers;
        this.agents = agents;
        this.destination = destination;
        this.segments = segments;
        this.metadata = metadata;
        this.segmentPolicy = segmentPolicy;
        this.statusController = statusController;
        this.retryHandler = retryHandler;
        this.validator = validator;
        /**
         * current fd
         */
        this.fd = -1;
    }
    async updateMetadata(url) {
        var _a, _b;
        const metadata = await getMetadata(url, this.headers, this.agents);
        if (!metadata || metadata.eTag != ((_a = this.metadata) === null || _a === void 0 ? void 0 : _a.eTag) || metadata.eTag === undefined || metadata.contentLength !== ((_b = this.metadata) === null || _b === void 0 ? void 0 : _b.contentLength)) {
            this.metadata = metadata;
            const contentLength = metadata.contentLength;
            this.segments = contentLength && metadata.isAcceptRanges
                ? this.segmentPolicy.computeSegments(contentLength)
                : [{ start: 0, end: contentLength }];
            this.statusController.reset(0, metadata.contentLength);
            await truncate(this.fd, metadata.contentLength);
        }
        else {
            this.statusController.reset(this.segments.reduce((a, b) => a + (b.end - b.start), 0), metadata.contentLength);
        }
        return this.metadata;
    }
    async processDownload(metadata, abortSignal) {
        var _a;
        let flag = 0;
        const abortHandlers = [];
        const errors = [];
        await Promise.all(this.segments.map(async (segment, index) => {
            var _a;
            if (segment.start > segment.end) {
                // the segment is finished, just ignore it
                return;
            }
            const options = {
                ...urlToRequestOptions(metadata.url),
                method: "GET",
                headers: {
                    ...this.headers,
                    Range: `bytes=${segment.start}-${(_a = (segment.end)) !== null && _a !== void 0 ? _a : ""}`,
                },
            };
            try {
                if (abortSignal.aborted || flag) {
                    throw new AbortError();
                }
                const { message: response, request } = await fetch(options, this.agents);
                if (abortSignal.aborted || flag) {
                    // ensure we correctly release the message
                    response.resume();
                    throw new AbortError();
                }
                const fileStream = fs.createWriteStream(this.destination, {
                    fd: this.fd,
                    start: segment.start,
                    // we should not close the file stream, as it will close the fd as the same time!
                    autoClose: false,
                });
                // track the progress
                response.on("data", (chunk) => {
                    segment.start += chunk.length;
                    this.statusController.onProgress(chunk.length, this.statusController.progress + chunk.length);
                });
                // create abort handler
                const abortHandler = () => {
                    request.destroy(new AbortError());
                    response.unpipe();
                };
                abortHandlers.push(abortHandler);
                // add abort handler to abort signal
                abortSignal.addEventListener("abort", abortHandler);
                await core._pipeline(response, fileStream);
                abortSignal.removeEventListener("abort", abortHandler);
            }
            catch (e) {
                if (e instanceof AbortError || e.message === "aborted") {
                    // user abort the operation, or abort by other sibling error
                    if (flag === 0) {
                        flag = 1;
                    }
                }
                else {
                    // true error thrown.
                    flag = 2;
                    // all other sibling requests should be aborted
                    abortHandlers.forEach((f) => f());
                    errors.push(e);
                }
            }
        }));
        // use local aborted flag instead of signal.aborted
        // as local aborted flag means the request is TRUELY aborted
        if (flag) {
            throw new DownloadError(flag === 1 ? "DownloadAborted" : (_a = resolveNetworkErrorType(errors[0])) !== null && _a !== void 0 ? _a : "GeneralDownloadException", this.metadata, this.headers, this.destination, this.segments, errors);
        }
    }
    async downloadUrl(url$1, abortSignal) {
        let attempt = 0;
        const parsedUrl = new url.URL(url$1);
        if (parsedUrl.protocol === "file:") {
            const filePath = url.fileURLToPath(url$1);
            if (await core._exists(filePath)) {
                // properly handle the file protocol. we just copy the file
                // luckly, opening file won't affect file copy 😀
                await copyFile(url.fileURLToPath(url$1), this.destination);
                return;
            }
        }
        while (true) {
            try {
                attempt += 1;
                const metadata = await this.updateMetadata(parsedUrl);
                await this.processDownload(metadata, abortSignal);
                return;
            }
            catch (e) {
                // user abort should throw anyway
                if (e instanceof DownloadError && e.error === "DownloadAborted") {
                    throw e;
                }
                // some common error we want to retry
                if (await this.retryHandler.retry(url$1, attempt, e)) {
                    continue;
                }
                const networkError = resolveNetworkErrorType(e);
                if (networkError) {
                    throw new DownloadError(networkError, this.metadata, this.headers, this.destination, this.segments, [e]);
                }
                throw e;
            }
        }
    }
    /**
     * Start to download
     */
    async start(abortSignal = resolveAbortSignal()) {
        try {
            if (this.fd === -1) {
                await ensureFile(this.destination);
                // use O_RDWR for read write which won't be truncated
                this.fd = await open(this.destination, constants.O_RDWR | constants.O_CREAT);
            }
            // prevalidate the file
            const size = (await pfstat(this.fd)).size;
            if (size !== 0) {
                const error = await this.validator.validate(this.fd, this.destination, this.urls[0]).catch((e) => e);
                // if the file size is not 0 and checksum matched, we just don't process the file
                if (!error) {
                    return;
                }
            }
            let succeed = false;
            const aggregatedErrors = [];
            for (const url of this.urls) {
                try {
                    await this.downloadUrl(url, abortSignal);
                    await pfdatasync(this.fd);
                    await this.validator.validate(this.fd, this.destination, url);
                    succeed = true;
                    break;
                }
                catch (e) {
                    if (e instanceof DownloadError && e.error === "DownloadAborted") {
                        throw e;
                    }
                    aggregatedErrors.push(e);
                }
            }
            if (!succeed && aggregatedErrors.length > 0) {
                throw aggregatedErrors;
            }
        }
        catch (e) {
            const errs = e instanceof Array ? e : [e];
            const lastError = errs[0];
            if (!(lastError instanceof DownloadError) && !(lastError instanceof ValidationError)) {
                await unlink(this.destination).catch(() => { });
            }
            throw e;
        }
        finally {
            if (this.fd !== -1) {
                await close(this.fd).catch(() => { });
            }
            this.fd = -1;
        }
    }
}

class DownloadTask extends task.AbortableTask {
    constructor(options) {
        super();
        this.abort = () => { };
        options.statusController = this;
        this.download = createDownload(options);
    }
    reset(progress, total) {
        this._progress = progress;
        this._total = total;
    }
    onProgress(chunkSize, progress) {
        this._progress = progress;
        this.update(chunkSize);
    }
    process() {
        const listeners = [];
        const aborted = () => this.isCancelled || this.isPaused;
        const signal = {
            get aborted() { return aborted(); },
            addEventListener(event, listener) {
                if (event !== "abort") {
                    return this;
                }
                listeners.push(listener);
                return this;
            },
            removeEventListener(event, listener) {
                // noop as this will be auto gc
                return this;
            }
        };
        this.abort = () => {
            listeners.forEach((l) => l());
        };
        return this.download.start(signal);
    }
    isAbortedError(e) {
        if (e instanceof Array) {
            e = e[0];
        }
        if (e instanceof DownloadError && e.error === "DownloadAborted") {
            return true;
        }
        return false;
    }
}

/**
 * Default minecraft version manifest url.
 */
const DEFAULT_VERSION_MANIFEST_URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
/**
 * Default resource/assets url root
 */
const DEFAULT_RESOURCE_ROOT_URL = "https://resources.download.minecraft.net";
/**
 * Get and update the version list.
 * This try to send http GET request to offical Minecraft metadata endpoint by default.
 * You can swap the endpoint by passing url on `remote` in option.
 *
 * @returns The new list if there is
 */
function getVersionList(option = {}) {
    return getAndParseIfUpdate(option.remote || DEFAULT_VERSION_MANIFEST_URL, JSON.parse, option.original);
}
function resolveDownloadUrls(original, version, option) {
    let result = [original];
    if (typeof option === "function") {
        result.unshift(...normalizeArray(option(version)));
    }
    else {
        result.unshift(...normalizeArray(option));
    }
    return result;
}
/**
 * Install the Minecraft game to a location by version metadata.
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param option
 */
async function install(versionMeta, minecraft, option = {}) {
    return installTask(versionMeta, minecraft, option).startAndWait();
}
/**
 * Only install the json/jar. Do not install dependencies.
 *
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
function installVersion(versionMeta, minecraft, options = {}) {
    return installVersionTask(versionMeta, minecraft, options).startAndWait();
}
/**
 * Install the completeness of the Minecraft game assets and libraries on a existed version.
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
function installDependencies(version, options) {
    return installDependenciesTask(version, options).startAndWait();
}
/**
 * Install or check the assets to resolved version
 *
 * @param version The target version
 * @param options The option to replace assets host url
 */
function installAssets(version, options = {}) {
    return installAssetsTask(version, options).startAndWait();
}
/**
 * Install all the libraries of providing version
 * @param version The target version
 * @param options The library host swap option
 */
function installLibraries(version, options = {}) {
    return installLibrariesTask(version, options).startAndWait();
}
/**
 * Only install several resolved libraries
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
async function installResolvedLibraries(libraries, minecraft, option) {
    await installLibrariesTask({ libraries, minecraftDirectory: typeof minecraft === "string" ? minecraft : minecraft.root }, option).startAndWait();
}
/**
 * Install the Minecraft game to a location by version metadata.
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * @param type The type of game, client or server
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param options
 */
function installTask(versionMeta, minecraft, options = {}) {
    return task.task("install", async function () {
        return withAgents(options, async (options) => {
            const version = await this.yield(installVersionTask(versionMeta, minecraft, options));
            if (options.side !== "server") {
                await this.yield(installDependenciesTask(version, options));
            }
            return version;
        });
    });
}
/**
 * Only install the json/jar. Do not install dependencies.
 *
 * @param type client or server
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
function installVersionTask(versionMeta, minecraft, options = {}) {
    return task.task("version", async function () {
        return withAgents(options, async (options) => {
            await this.yield(new InstallJsonTask(versionMeta, minecraft, options));
            const version = await core.Version.parse(minecraft, versionMeta.id);
            await this.yield(new InstallJarTask(version, minecraft, options));
            return version;
        });
    }, versionMeta);
}
/**
 * Install the completeness of the Minecraft game assets and libraries on a existed version.
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
function installDependenciesTask(version, options = {}) {
    return task.task("dependencies", async function () {
        await withAgents(options, (options) => Promise.all([
            this.yield(installAssetsTask(version, options)),
            this.yield(installLibrariesTask(version, options)),
        ]));
        return version;
    });
}
/**
 * Install or check the assets to resolved version
 *
 * @param version The target version
 * @param options The option to replace assets host url
 */
function installAssetsTask(version, options = {}) {
    return task.task("assets", async function () {
        const folder = core.MinecraftFolder.from(version.minecraftDirectory);
        const jsonPath = folder.getPath("assets", "indexes", version.assets + ".json");
        await this.yield(new InstallAssetIndexTask(version, options));
        await ensureDir(folder.getPath("assets", "objects"));
        const { objects } = JSON.parse(await core._readFile(jsonPath).then((b) => b.toString()));
        const objectArray = Object.keys(objects).map((k) => ({ name: k, ...objects[k] }));
        // let sizes = objectArray.map((a) => a.size).map((a, b) => a + b, 0);
        await withAgents(options, (options) => {
            var _a;
            return this.all(objectArray.map((o) => new InstallAssetTask(o, folder, options)), {
                throwErrorImmediately: (_a = options.throwErrorImmediately) !== null && _a !== void 0 ? _a : false,
                getErrorMessage: (errs) => `Errors during install Minecraft ${version.id}'s assets at ${version.minecraftDirectory}: ${errs.map(errorToString).join("\n")}`
            });
        });
        return version;
    });
}
/**
 * Install all the libraries of providing version
 * @param version The target version
 * @param options The library host swap option
 */
function installLibrariesTask(version, options = {}) {
    return task.task("libraries", async function () {
        const folder = core.MinecraftFolder.from(version.minecraftDirectory);
        await withAgents(options, (options) => {
            var _a;
            return this.all(version.libraries.map((lib) => new InstallLibraryTask(lib, folder, options)), {
                throwErrorImmediately: (_a = options.throwErrorImmediately) !== null && _a !== void 0 ? _a : false,
                getErrorMessage: (errs) => `Errors during install libraries at ${version.minecraftDirectory}: ${errs.map(errorToString).join("\n")}`
            });
        });
    });
}
/**
 * Only install several resolved libraries
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
function installResolvedLibrariesTask(libraries, minecraft, option) {
    return installLibrariesTask({ libraries, minecraftDirectory: typeof minecraft === "string" ? minecraft : minecraft.root }, option);
}
/**
 * Only install several resolved assets.
 * @param assets The assets to install
 * @param folder The minecraft folder
 * @param options The asset option
 */
function installResolvedAssetsTask(assets, folder, options = {}) {
    return task.task("assets", async function () {
        await ensureDir(folder.getPath("assets", "objects"));
        // const sizes = assets.map((a) => a.size).map((a, b) => a + b, 0);
        await withAgents(options, (options) => this.all(assets.map((o) => new InstallAssetTask(o, folder, options)), {
            throwErrorImmediately: false,
            getErrorMessage: (errs) => `Errors during install assets at ${folder.root}:\n${errs.map(errorToString).join("\n")}`,
        }));
    });
}
class InstallJsonTask extends DownloadTask {
    constructor(version, minecraft, options) {
        const folder = core.MinecraftFolder.from(minecraft);
        const destination = folder.getVersionJson(version.id);
        const expectSha1 = version.url.split("/")[5];
        const urls = resolveDownloadUrls(version.url, version, options.json);
        super({
            url: urls,
            agents: options.agents,
            segmentPolicy: options.segmentPolicy,
            retryHandler: options.retryHandler,
            validator: expectSha1 ? { algorithm: "sha1", hash: expectSha1 } : new JsonValidator(),
            destination,
        });
        this.name = "json";
        this.param = version;
    }
}
class InstallJarTask extends DownloadTask {
    constructor(version, minecraft, options) {
        var _a;
        const folder = core.MinecraftFolder.from(minecraft);
        const type = (_a = options.side) !== null && _a !== void 0 ? _a : "client";
        const destination = path.join(folder.getVersionRoot(version.id), type === "client" ? version.id + ".jar" : version.id + "-" + type + ".jar");
        const urls = resolveDownloadUrls(version.downloads[type].url, version, options[type]);
        const expectSha1 = version.downloads[type].sha1;
        super({
            url: urls,
            validator: { algorithm: "sha1", hash: expectSha1 },
            destination,
            agents: options.agents,
            segmentPolicy: options.segmentPolicy,
            retryHandler: options.retryHandler,
        });
        this.name = "jar";
        this.param = version;
    }
}
class InstallAssetIndexTask extends DownloadTask {
    constructor(version, options = {}) {
        const folder = core.MinecraftFolder.from(version.minecraftDirectory);
        const jsonPath = folder.getPath("assets", "indexes", version.assets + ".json");
        super({
            url: resolveDownloadUrls(version.assetIndex.url, version, options.assetsIndexUrl),
            destination: jsonPath,
            validator: {
                algorithm: "sha1",
                hash: version.assetIndex.sha1,
            },
            agents: options.agents,
            segmentPolicy: options.segmentPolicy,
            retryHandler: options.retryHandler,
        });
        this.name = "assetIndex";
        this.param = version;
    }
}
class InstallLibraryTask extends DownloadTask {
    constructor(lib, folder, options) {
        const libraryPath = lib.download.path;
        const destination = path.join(folder.libraries, libraryPath);
        const urls = resolveLibraryDownloadUrls(lib, options);
        super({
            url: urls,
            validator: lib.download.sha1 === "" ? new ZipValidator() : {
                algorithm: "sha1",
                hash: lib.download.sha1,
            },
            destination,
            agents: options.agents,
            segmentPolicy: options.segmentPolicy,
            retryHandler: options.retryHandler,
        });
        this.name = "library";
        this.param = lib;
    }
}
class InstallAssetTask extends DownloadTask {
    constructor(asset, folder, options) {
        const assetsHosts = [
            ...normalizeArray(options.assetsHost),
            DEFAULT_RESOURCE_ROOT_URL,
        ];
        const { hash, size, name } = asset;
        const head = hash.substring(0, 2);
        const dir = folder.getPath("assets", "objects", head);
        const file = path.join(dir, hash);
        const urls = assetsHosts.map((h) => `${h}/${head}/${hash}`);
        super({
            url: urls,
            destination: file,
            validator: { hash, algorithm: "sha1", },
            agents: options.agents,
            segmentPolicy: options.segmentPolicy,
            retryHandler: options.retryHandler,
        });
        this._total = size;
        this.name = "asset";
        this.param = asset;
    }
}
const DEFAULT_MAVENS = ["https://repo1.maven.org/maven2/"];
/**
 * Resolve a library download urls with fallback.
 *
 * @param library The resolved library
 * @param libraryOptions The library install options
 */
function resolveLibraryDownloadUrls(library, libraryOptions) {
    var _a, _b;
    const libraryHosts = (_b = (_a = libraryOptions.libraryHost) === null || _a === void 0 ? void 0 : _a.call(libraryOptions, library)) !== null && _b !== void 0 ? _b : [];
    return [
        // user defined alternative host to download
        ...normalizeArray(libraryHosts),
        ...normalizeArray(libraryOptions.mavenHost).map((m) => joinUrl(m, library.download.path)),
        library.download.url,
        ...DEFAULT_MAVENS.map((m) => joinUrl(m, library.download.path)),
    ];
}

/**
 * Resolve processors in install profile
 */
function resolveProcessors(side, installProfile, minecraft) {
    function normalizePath(val) {
        if (val && val.match(/^\[.+\]$/g)) { // match sth like [net.minecraft:client:1.15.2:slim]
            const name = val.substring(1, val.length - 1);
            return minecraft.getLibraryByPath(core.LibraryInfo.resolve(name).path);
        }
        return val;
    }
    function normalizeVariable(val) {
        if (val && val.match(/^{.+}$/g)) { // match sth like {MAPPINGS}
            const key = val.substring(1, val.length - 1);
            return variables[key][side];
        }
        return val;
    }
    // store the mapping of {VARIABLE_NAME} -> real path in disk
    const variables = {
        SIDE: {
            client: "client",
            server: "server",
        },
        MINECRAFT_JAR: {
            client: minecraft.getVersionJar(installProfile.minecraft),
            server: minecraft.getVersionJar(installProfile.minecraft, "server"),
        },
    };
    if (installProfile.data) {
        for (const key in installProfile.data) {
            const { client, server } = installProfile.data[key];
            variables[key] = {
                client: normalizePath(client),
                server: normalizePath(server),
            };
        }
    }
    if (variables.INSTALLER) {
        variables.ROOT = {
            client: path.dirname(variables.INSTALLER.client),
            server: path.dirname(variables.INSTALLER.server),
        };
    }
    let processors = (installProfile.processors || []).map((proc) => ({
        ...proc,
        args: proc.args.map(normalizePath).map(normalizeVariable),
        outputs: proc.outputs
            ? Object.entries(proc.outputs).map(([k, v]) => ({ [normalizeVariable(k)]: normalizeVariable(v) })).reduce((a, b) => Object.assign(a, b), {})
            : undefined,
    }));
    processors = processors.filter((processor) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (processor.sides && Array.isArray(processor.sides)) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (processor.sides.includes(side)) {
                return true;
            }
            else {
                return false;
            }
        }
        return true;
    });
    return processors;
}
/**
 * Post process the post processors from `InstallProfile`.
 *
 * @param processors The processor info
 * @param minecraft The minecraft location
 * @param java The java executable path
 * @throws {@link PostProcessError}
 */
function postProcess(processors, minecraft, java) {
    return new PostProcessingTask(processors, minecraft, java).startAndWait();
}
/**
 * Install by install profile. The install profile usually contains some preprocess should run before installing dependencies.
 *
 * @param installProfile The install profile
 * @param minecraft The minecraft location
 * @param options The options to install
 * @throws {@link PostProcessError}
 */
function installByProfile(installProfile, minecraft, options = {}) {
    return installByProfileTask(installProfile, minecraft, options).startAndWait();
}
/**
 * Install by install profile. The install profile usually contains some preprocess should run before installing dependencies.
 *
 * @param installProfile The install profile
 * @param minecraft The minecraft location
 * @param options The options to install
 */
function installByProfileTask(installProfile, minecraft, options = {}) {
    return task.task("installByProfile", async function () {
        const minecraftFolder = core.MinecraftFolder.from(minecraft);
        const java = options.java || "java";
        const processor = resolveProcessors(options.side || "client", installProfile, minecraftFolder);
        const versionJson = await core._readFile(minecraftFolder.getVersionJson(installProfile.version)).then((b) => b.toString()).then(JSON.parse);
        const libraries = core.Version.resolveLibraries([...installProfile.libraries, ...versionJson.libraries]);
        await this.yield(installResolvedLibrariesTask(libraries, minecraft, options));
        await this.yield(new PostProcessingTask(processor, minecraftFolder, java));
    });
}
class PostProcessBadJarError extends Error {
    constructor(jarPath, causeBy) {
        super(`Fail to post process bad jar: ${jarPath}`);
        this.jarPath = jarPath;
        this.causeBy = causeBy;
        this.error = "PostProcessBadJar";
    }
}
class PostProcessNoMainClassError extends Error {
    constructor(jarPath) {
        super(`Fail to post process bad jar without main class: ${jarPath}`);
        this.jarPath = jarPath;
        this.error = "PostProcessNoMainClass";
    }
}
class PostProcessFailedError extends Error {
    constructor(jarPath, commands, message) {
        super(message);
        this.jarPath = jarPath;
        this.commands = commands;
        this.error = "PostProcessFailed";
    }
}
/**
 * Post process the post processors from `InstallProfile`.
 *
 * @param processors The processor info
 * @param minecraft The minecraft location
 * @param java The java executable path
 * @throws {@link PostProcessError}
 */
class PostProcessingTask extends task.AbortableTask {
    constructor(processors, minecraft, java) {
        super();
        this.processors = processors;
        this.minecraft = minecraft;
        this.java = java;
        this.name = "postProcessing";
        this.pointer = 0;
        this.param = processors;
        this._total = processors.length;
    }
    async findMainClass(lib) {
        var _a;
        let zip;
        let mainClass;
        try {
            zip = await unzip.open(lib, { lazyEntries: true });
            for await (const entry of unzip.walkEntriesGenerator(zip)) {
                if (entry.fileName === "META-INF/MANIFEST.MF") {
                    const content = await unzip.readEntry(zip, entry).then((b) => b.toString());
                    mainClass = (_a = content.split("\n")
                        .map((l) => l.split(": "))
                        .find((arr) => arr[0] === "Main-Class")) === null || _a === void 0 ? void 0 : _a[1].trim();
                    break;
                }
            }
        }
        catch (e) {
            throw new PostProcessBadJarError(lib, e);
        }
        finally {
            zip === null || zip === void 0 ? void 0 : zip.close();
        }
        if (!mainClass) {
            throw new PostProcessNoMainClassError(lib);
        }
        return mainClass;
    }
    async isInvalid(outputs) {
        for (const [file, expect] of Object.entries(outputs)) {
            let sha1 = await core.checksum(file, "sha1").catch((e) => "");
            let expected = expect.replace(/'/g, "");
            if (expected !== sha1) {
                return true;
            }
        }
        return false;
    }
    async postProcess(mc, proc, java) {
        let jarRealPath = mc.getLibraryByPath(core.LibraryInfo.resolve(proc.jar).path);
        let mainClass = await this.findMainClass(jarRealPath);
        let cp = [...proc.classpath, proc.jar].map(core.LibraryInfo.resolve).map((p) => mc.getLibraryByPath(p.path)).join(path.delimiter);
        let cmd = ["-cp", cp, mainClass, ...proc.args];
        try {
            const process = child_process.spawn(java, cmd);
            await waitProcess(process);
        }
        catch (e) {
            if (typeof e === "string") {
                throw new PostProcessFailedError(proc.jar, [java, ...cmd], e);
            }
            throw e;
        }
        if (proc.outputs && await this.isInvalid(proc.outputs)) {
            throw new PostProcessFailedError(proc.jar, [java, ...cmd], "Validate the output of process failed!");
        }
    }
    async process() {
        for (; this.pointer < this.processors.length; this.pointer++) {
            const proc = this.processors[this.pointer];
            if (this.isCancelled) {
                throw new task.CancelledError();
            }
            if (this.isPaused) {
                throw "PAUSED";
            }
            if (!proc.outputs || await this.isInvalid(proc.outputs)) {
                await this.postProcess(this.minecraft, proc, this.java);
            }
            if (this.isCancelled) {
                throw new task.CancelledError();
            }
            if (this.isPaused) {
                throw "PAUSED";
            }
            this._progress = this.pointer;
            this.update(1);
        }
    }
    async abort(isCancelled) {
        // this.activeProcess?.kill()
    }
    isAbortedError(e) {
        return e === "PAUSED";
    }
}

const DEFAULT_FORGE_MAVEN = "http://files.minecraftforge.net/maven";
class DownloadForgeInstallerTask extends DownloadTask {
    constructor(forgeVersion, installer, minecraft, options) {
        const path = installer ? installer.path : `net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-installer.jar`;
        const forgeMavenPath = path.replace("/maven", "").replace("maven", "");
        const library = core.Version.resolveLibrary({
            name: `net.minecraftforge:forge:${forgeVersion}:installer`,
            downloads: {
                artifact: {
                    url: joinUrl(DEFAULT_FORGE_MAVEN, forgeMavenPath),
                    path: `net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-installer.jar`,
                    size: -1,
                    sha1: (installer === null || installer === void 0 ? void 0 : installer.sha1) || "",
                }
            }
        });
        const mavenHost = options.mavenHost ? [...normalizeArray(options.mavenHost), DEFAULT_FORGE_MAVEN] : [DEFAULT_FORGE_MAVEN];
        const urls = resolveLibraryDownloadUrls(library, { ...options, mavenHost });
        const installJarPath = minecraft.getLibraryByPath(library.path);
        super({
            url: urls,
            destination: installJarPath,
            validator: (installer === null || installer === void 0 ? void 0 : installer.sha1) ? {
                hash: installer.sha1,
                algorithm: "sha1",
            } : new ZipValidator(),
            agents: options.agents,
            segmentPolicy: options.segmentPolicy,
            retryHandler: options.retryHandler,
        });
        this.installJarPath = installJarPath;
        this.name = "downloadInstaller";
        this.param = { version: forgeVersion };
    }
}
function getLibraryPathWithoutMaven(mc, name) {
    // remove the maven/ prefix
    return mc.getLibraryByPath(name.substring(name.indexOf("/") + 1));
}
function extractEntryTo(zip, e, dest) {
    return unzip.openEntryReadStream(zip, e).then((stream) => core._pipeline(stream, fs.createWriteStream(dest)));
}
async function installLegacyForgeFromZip(zip, entries, profile, mc, options) {
    const versionJson = profile.versionInfo;
    // apply override for inheritsFrom
    versionJson.id = options.versionId || versionJson.id;
    versionJson.inheritsFrom = options.inheritsFrom || versionJson.inheritsFrom;
    const rootPath = mc.getVersionRoot(versionJson.id);
    const versionJsonPath = path.join(rootPath, `${versionJson.id}.json`);
    await ensureFile(versionJsonPath);
    const library = core.LibraryInfo.resolve(versionJson.libraries.find((l) => l.name.startsWith("net.minecraftforge:forge")));
    await Promise.all([
        core._writeFile(versionJsonPath, JSON.stringify(versionJson, undefined, 4)),
        extractEntryTo(zip, entries.legacyUniversalJar, mc.getLibraryByPath(library.path)),
    ]);
    return versionJson.id;
}
/**
 * Unpack forge installer jar file content to the version library artifact directory.
 * @param zip The forge jar file
 * @param entries The entries
 * @param forgeVersion The expected version of forge
 * @param profile The forge install profile
 * @param mc The minecraft location
 * @returns The installed version id
 */
async function unpackForgeInstaller(zip, entries, forgeVersion, profile, mc, jarPath, options) {
    const versionJson = await unzip.readEntry(zip, entries.versionJson).then((b) => b.toString()).then(JSON.parse);
    // apply override for inheritsFrom
    versionJson.id = options.versionId || versionJson.id;
    versionJson.inheritsFrom = options.inheritsFrom || versionJson.inheritsFrom;
    // resolve all the required paths
    const rootPath = mc.getVersionRoot(versionJson.id);
    const versionJsonPath = path.join(rootPath, `${versionJson.id}.json`);
    const installJsonPath = path.join(rootPath, "install_profile.json");
    const dataRoot = path.dirname(jarPath);
    const unpackData = (entry) => {
        promises.push(extractEntryTo(zip, entry, path.join(dataRoot, entry.fileName.substring("data/".length))));
    };
    await ensureFile(versionJsonPath);
    const promises = [];
    if (entries.forgeUniversalJar) {
        promises.push(extractEntryTo(zip, entries.forgeUniversalJar, getLibraryPathWithoutMaven(mc, entries.forgeUniversalJar.fileName)));
    }
    if (!profile.data) {
        profile.data = {};
    }
    const installerMaven = `net.minecraftforge:forge:${forgeVersion}:installer`;
    profile.data.INSTALLER = {
        client: `[${installerMaven}]`,
        server: `[${installerMaven}]`,
    };
    if (entries.serverLzma) {
        // forge version and mavens, compatible with twitch api
        const serverMaven = `net.minecraftforge:forge:${forgeVersion}:serverdata@lzma`;
        // override forge bin patch location
        profile.data.BINPATCH.server = `[${serverMaven}]`;
        const serverBinPath = mc.getLibraryByPath(core.LibraryInfo.resolve(serverMaven).path);
        await ensureFile(serverBinPath);
        promises.push(extractEntryTo(zip, entries.serverLzma, serverBinPath));
    }
    if (entries.clientLzma) {
        // forge version and mavens, compatible with twitch api
        const clientMaven = `net.minecraftforge:forge:${forgeVersion}:clientdata@lzma`;
        // override forge bin patch location
        profile.data.BINPATCH.client = `[${clientMaven}]`;
        const clientBinPath = mc.getLibraryByPath(core.LibraryInfo.resolve(clientMaven).path);
        await ensureFile(clientBinPath);
        promises.push(extractEntryTo(zip, entries.clientLzma, clientBinPath));
    }
    if (entries.forgeJar) {
        promises.push(extractEntryTo(zip, entries.forgeJar, getLibraryPathWithoutMaven(mc, entries.forgeJar.fileName)));
    }
    if (entries.runBat) {
        unpackData(entries.runBat);
    }
    if (entries.runSh) {
        unpackData(entries.runSh);
    }
    if (entries.winArgs) {
        unpackData(entries.winArgs);
    }
    if (entries.unixArgs) {
        unpackData(entries.unixArgs);
    }
    if (entries.userJvmArgs) {
        unpackData(entries.userJvmArgs);
    }
    promises.push(core._writeFile(installJsonPath, JSON.stringify(profile)), core._writeFile(versionJsonPath, JSON.stringify(versionJson)));
    await Promise.all(promises);
    return versionJson.id;
}
function isLegacyForgeInstallerEntries(entries) {
    return !!entries.legacyUniversalJar && !!entries.installProfileJson;
}
function isForgeInstallerEntries(entries) {
    return !!entries.installProfileJson && !!entries.versionJson;
}
/**
 * Walk the forge installer file to find key entries
 * @param zip THe forge instal
 * @param forgeVersion Forge version to install
 */
async function walkForgeInstallerEntries(zip, forgeVersion) {
    const [forgeJar, forgeUniversalJar, clientLzma, serverLzma, installProfileJson, versionJson, legacyUniversalJar, runSh, runBat, unixArgs, userJvmArgs, winArgs] = await unzip.filterEntries(zip, [
        `maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}.jar`,
        `maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-universal.jar`,
        "data/client.lzma",
        "data/server.lzma",
        "install_profile.json",
        "version.json",
        `forge-${forgeVersion}-universal.jar`,
        "data/run.sh",
        "data/run.bat",
        "data/unix_args.txt",
        "data/user_jvm_args.txt",
        "data/win_args.txt",
    ]);
    return {
        forgeJar,
        forgeUniversalJar,
        clientLzma,
        serverLzma,
        installProfileJson,
        versionJson,
        legacyUniversalJar,
        runSh, runBat, unixArgs, userJvmArgs, winArgs,
    };
}
class BadForgeInstallerJarError extends Error {
    constructor(jarPath, 
    /**
     * What entry in jar is missing
     */
    entry) {
        super(entry ? `Missing entry ${entry} in forge installer jar: ${jarPath}` : `Bad forge installer: ${jarPath}`);
        this.jarPath = jarPath;
        this.entry = entry;
        this.error = "BadForgeInstallerJar";
    }
}
function installByInstallerTask(version, minecraft, options) {
    return task.task("installForge", async function () {
        function getForgeArtifactVersion() {
            let [_, minor] = version.mcversion.split(".");
            let minorVersion = Number.parseInt(minor);
            if (minorVersion >= 7 && minorVersion <= 8) {
                return `${version.mcversion}-${version.version}-${version.mcversion}`;
            }
            return `${version.mcversion}-${version.version}`;
        }
        const forgeVersion = getForgeArtifactVersion();
        const mc = core.MinecraftFolder.from(minecraft);
        return withAgents(options, async (options) => {
            const jarPath = await this.yield(new DownloadForgeInstallerTask(forgeVersion, version.installer, mc, options)
                .map(function () { return this.installJarPath; }));
            const zip = await unzip.open(jarPath, { lazyEntries: true, autoClose: false });
            const entries = await walkForgeInstallerEntries(zip, forgeVersion);
            if (!entries.installProfileJson) {
                throw new BadForgeInstallerJarError(jarPath, "install_profile.json");
            }
            const profile = await unzip.readEntry(zip, entries.installProfileJson).then((b) => b.toString()).then(JSON.parse);
            if (isForgeInstallerEntries(entries)) {
                // new forge
                const versionId = await unpackForgeInstaller(zip, entries, forgeVersion, profile, mc, jarPath, options);
                await this.concat(installByProfileTask(profile, minecraft, options));
                return versionId;
            }
            else if (isLegacyForgeInstallerEntries(entries)) {
                // legacy forge
                return installLegacyForgeFromZip(zip, entries, profile, mc, options);
            }
            else {
                // bad forge
                throw new BadForgeInstallerJarError(jarPath);
            }
        });
    });
}
/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The installed version name.
 * @throws {@link BadForgeInstallerJarError}
 */
function installForge(version, minecraft, options) {
    return installForgeTask(version, minecraft, options).startAndWait();
}
/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The task to install the forge
 * @throws {@link BadForgeInstallerJarError}
 */
function installForgeTask(version, minecraft, options = {}) {
    return installByInstallerTask(version, minecraft, options);
}
/**
 * Query the webpage content from files.minecraftforge.net.
 *
 * You can put the last query result to the fallback option. It will check if your old result is up-to-date.
 * It will request a new page only when the fallback option is outdated.
 *
 * @param option The option can control querying minecraft version, and page caching.
 */
async function getForgeVersionList(option = {}) {
    const mcversion = option.mcversion || "";
    const url = mcversion === "" ? "http://files.minecraftforge.net/maven/net/minecraftforge/forge/index.html" : `http://files.minecraftforge.net/maven/net/minecraftforge/forge/index_${mcversion}.html`;
    return getAndParseIfUpdate(url, forgeSiteParser.parse, option.original);
}

function getDefaultEntryResolver() {
    return (e) => e.fileName;
}
class UnzipTask extends task.BaseTask {
    constructor(zipFile, entries, destination, resolver = getDefaultEntryResolver()) {
        super();
        this.zipFile = zipFile;
        this.entries = entries;
        this.resolver = resolver;
        this.streams = [];
        this._onCancelled = () => { };
        this._to = destination;
    }
    async handleEntry(entry, relativePath) {
        const file = path.join(this.to, relativePath);
        if (this._state === task.TaskState.Cancelled) {
            throw new task.CancelledError();
        }
        const readStream = await unzip.openEntryReadStream(this.zipFile, entry);
        if (this.isCancelled) {
            throw new task.CancelledError();
        }
        if (this._state === task.TaskState.Paused) {
            readStream.pause();
        }
        await ensureFile(file);
        const writeStream = fs.createWriteStream(file);
        readStream.on("data", (buf) => {
            this._progress += buf.length;
            this.update(buf.length);
        });
        await core._pipeline(readStream, writeStream);
    }
    async runTask() {
        const promises = [];
        for (const e of this.entries) {
            const path = await this.resolver(e);
            if (this.isCancelled) {
                throw new task.CancelledError();
            }
            this._total += e.uncompressedSize;
            promises.push(this.handleEntry(e, path));
        }
        this.update(0);
        try {
            await Promise.all(promises);
        }
        catch (e) {
            if (e instanceof task.CancelledError) {
                this._onCancelled();
            }
            throw e;
        }
    }
    cancelTask() {
        for (const [read, write] of this.streams) {
            read.unpipe();
            read.destroy(new task.CancelledError());
            this.zipFile.close();
            write.destroy(new task.CancelledError());
        }
        return new Promise((resolve) => {
            this._onCancelled = resolve;
        });
    }
    async pauseTask() {
        const promise = Promise.all(this.streams.map(([read]) => new Promise((resolve) => read.once("pause", resolve))));
        for (const [read] of this.streams) {
            read.pause();
        }
        await promise;
    }
    async resumeTask() {
        const promise = Promise.all(this.streams.map(([read]) => new Promise((resolve) => read.once("readable", resolve))));
        for (const [read] of this.streams) {
            read.resume();
        }
        await promise;
    }
}

class BadCurseforgeModpackError extends Error {
    constructor(modpack, 
    /**
     * What required entry is missing in modpack.
     */
    entry) {
        super(`Missing entry ${entry} in curseforge modpack: ${modpack}`);
        this.modpack = modpack;
        this.entry = entry;
        this.error = "BadCurseforgeModpack";
    }
}
/**
 * Read the mainifest data from modpack
 * @throws {@link BadCurseforgeModpackError}
 */
function readManifestTask(input) {
    return task.task("unpack", async () => {
        const zip = await normalizeInput(input);
        const mainfiestEntry = zip.entries.find((e) => e.fileName === "manifest.json");
        if (!mainfiestEntry) {
            throw new BadCurseforgeModpackError(input, "manifest.json");
        }
        const buffer = await unzip.readEntry(zip.zip, mainfiestEntry);
        const content = JSON.parse(buffer.toString());
        return content;
    });
}
/**
 * Read the mainifest data from modpack
 * @throws {@link BadCurseforgeModpackError}
 */
function readManifest(zip) {
    return readManifestTask(zip).startAndWait();
}
function createDefaultCurseforgeQuery() {
    let agent = new https.Agent();
    return (projectId, fileId) => fetchText(`https://addons-ecs.forgesvc.net/api/v2/addon/${projectId}/file/${fileId}/download-url`, { https: agent });
}
/**
 * Install curseforge modpack to a specific Minecraft location.
 *
 * @param zip The curseforge modpack zip buffer or file path
 * @param minecraft The minecraft location
 * @param options The options for query curseforge
 */
function installCurseforgeModpack(zip, minecraft, options) {
    return installCurseforgeModpackTask(zip, minecraft, options).startAndWait();
}
class DownloadCurseforgeFilesTask extends task.TaskGroup {
    constructor(manifest, minecraft, options) {
        super();
        this.manifest = manifest;
        this.minecraft = minecraft;
        this.options = options;
        this.name = "download";
        this.param = manifest;
    }
    async runTask() {
        var _a, _b;
        const requestor = ((_a = this.options) === null || _a === void 0 ? void 0 : _a.queryFileUrl) || createDefaultCurseforgeQuery();
        const resolver = ((_b = this.options) === null || _b === void 0 ? void 0 : _b.filePathResolver) || ((p, f, m, u) => m.getMod(path.basename(u)));
        const minecraft = this.minecraft;
        return withAgents(this.options, async (options) => {
            var _a;
            const tasks = await Promise.all(this.manifest.files.map(async (f) => {
                const from = await requestor(f.projectID, f.fileID);
                const to = await resolver(f.projectID, f.fileID, minecraft, from);
                return new DownloadTask({
                    url: from,
                    destination: to,
                    agents: options.agents,
                    segmentPolicy: options.segmentPolicy,
                    retryHandler: options.retryHandler,
                });
            }));
            this.children.push(...tasks);
            await this.all(tasks, {
                throwErrorImmediately: (_a = this.options.throwErrorImmediately) !== null && _a !== void 0 ? _a : false,
                getErrorMessage: (errs) => `Fail to install curseforge modpack to ${minecraft.root}: ${errs.map(errorToString).join("\n")}`
            });
        });
    }
}
async function normalizeInput(input) {
    if (typeof input === "string" || input instanceof Buffer) {
        const zip = await unzip.open(input, { lazyEntries: true, autoClose: false });
        return { zip, entries: await unzip.readAllEntries(zip) };
    }
    else {
        return input;
    }
}
/**
 * Install curseforge modpack to a specific Minecraft location.
 *
 * This will NOT install the Minecraft version in the modpack, and will NOT install the forge or other modload listed in modpack!
 * Please resolve them by yourself.
 *
 * @param input The curseforge modpack zip buffer or file path
 * @param minecraft The minecraft location
 * @param options The options for query curseforge
 * @throws {@link BadCurseforgeModpackError}
 */
function installCurseforgeModpackTask(input, minecraft, options = {}) {
    return task.task("installCurseforgeModpack", async function () {
        var _a;
        const folder = core.MinecraftFolder.from(minecraft);
        const zip = await normalizeInput(input);
        const manifest = (_a = options === null || options === void 0 ? void 0 : options.manifest) !== null && _a !== void 0 ? _a : (await this.yield(readManifestTask(zip)));
        await this.yield(new DownloadCurseforgeFilesTask(manifest, folder, options));
        await this.yield(new UnzipTask(zip.zip, zip.entries.filter((e) => !e.fileName.endsWith("/") && e.fileName.startsWith(manifest.overrides)), folder.root, (e) => e.fileName.substring(manifest.overrides.length)).setName("unpack"));
        return manifest;
    });
}
/**
 * Install a cureseforge xml file to a specific locations
 */
function installCurseforgeFile(file, destination, options) {
    return installCurseforgeFileTask(file, destination, options).startAndWait();
}
/**
 * Install a cureseforge xml file to a specific locations
 */
function installCurseforgeFileTask(file, destination, options = {}) {
    return task.task("installCurseforgeFile", async function () {
        const requestor = options.queryFileUrl || createDefaultCurseforgeQuery();
        const url = await requestor(file.projectID, file.fileID);
        await new DownloadTask({
            url,
            destination: path.join(destination, path.basename(url)),
            agents: options.agents,
            segmentPolicy: options.segmentPolicy,
            retryHandler: options.retryHandler,
        }).startAndWait(this.context, this.parent);
    });
}

/**
 * Generate the optifine version json from provided info.
 * @param editionRelease The edition + release with _
 * @param minecraftVersion The minecraft version
 * @param launchWrapperVersion The launch wrapper version
 * @param options The install options
 * @beta Might be changed and don't break the major version
 */
function generateOptifineVersion(editionRelease, minecraftVersion, launchWrapperVersion, options = {}) {
    var _a, _b;
    let id = (_a = options.versionId) !== null && _a !== void 0 ? _a : `${minecraftVersion}-Optifine_${editionRelease}`;
    let inheritsFrom = (_b = options.inheritsFrom) !== null && _b !== void 0 ? _b : minecraftVersion;
    let mainClass = "net.minecraft.launchwrapper.Launch";
    let libraries = [{ name: `optifine:Optifine:${minecraftVersion}_${editionRelease}` }];
    if (launchWrapperVersion) {
        libraries.unshift({ name: `optifine:launchwrapper-of:${launchWrapperVersion}` });
    }
    else {
        libraries.unshift({ name: "net.minecraft:launchwrapper:1.12" });
    }
    return {
        id,
        inheritsFrom,
        arguments: {
            game: ["--tweakClass", options.useForgeTweaker ? "optifine.OptiFineForgeTweaker" : "optifine.OptiFineTweaker"],
            jvm: [],
        },
        releaseTime: new Date().toJSON(),
        time: new Date().toJSON(),
        type: "release",
        libraries,
        mainClass,
        minimumLauncherVersion: 21,
    };
}
/**
 * Install optifine by optifine installer
 *
 * @param installer The installer jar file path
 * @param minecraft The minecraft location
 * @param options The option to install
 * @beta Might be changed and don't break the major version
 * @throws {@link BadOptifineJarError}
 */
function installOptifine(installer, minecraft, options) {
    return installOptifineTask(installer, minecraft, options).startAndWait();
}
class BadOptifineJarError extends Error {
    constructor(optifine, 
    /**
     * What entry in jar is missing
     */
    entry) {
        super(`Missing entry ${entry} in optifine installer: ${optifine}`);
        this.optifine = optifine;
        this.entry = entry;
        this.error = "BadOptifineJar";
    }
}
/**
 * Install optifine by optifine installer task
 *
 * @param installer The installer jar file path
 * @param minecraft The minecraft location
 * @param options The option to install
 * @beta Might be changed and don't break the major version
 * @throws {@link BadOptifineJarError}
 */
function installOptifineTask(installer, minecraft, options = {}) {
    return task.task("installOptifine", async function () {
        var _a, _b;
        let mc = core.MinecraftFolder.from(minecraft);
        // context.update(0, 100);
        const zip = await unzip.open(installer);
        const entries = await unzip.readAllEntries(zip);
        const record = unzip.getEntriesRecord(entries);
        // context.update(10, 100);
        const entry = (_b = (_a = record["net/optifine/Config.class"]) !== null && _a !== void 0 ? _a : record["Config.class"]) !== null && _b !== void 0 ? _b : record["notch/net/optifine/Config.class"];
        if (!entry) {
            throw new BadOptifineJarError(installer, "net/optifine/Config.class");
        }
        const launchWrapperVersionEntry = record["launchwrapper-of.txt"];
        const launchWrapperVersion = launchWrapperVersionEntry ? await unzip.readEntry(zip, launchWrapperVersionEntry).then((b) => b.toString())
            : undefined;
        // context.update(15, 100);
        const buf = await unzip.readEntry(zip, entry);
        const reader = new asm.ClassReader(buf);
        class OptifineVisitor extends asm.ClassVisitor {
            constructor() {
                super(...arguments);
                this.fields = {};
            }
            visitField(access, name, desc, signature, value) {
                this.fields[name] = value;
                return null;
            }
        }
        const visitor = new OptifineVisitor(asm.Opcodes.ASM5);
        reader.accept(visitor);
        const mcversion = visitor.fields.MC_VERSION; // 1.14.4
        const edition = visitor.fields.OF_EDITION; // HD_U
        const release = visitor.fields.OF_RELEASE; // F5
        const editionRelease = edition + "_" + release;
        const versionJSON = generateOptifineVersion(editionRelease, mcversion, launchWrapperVersion, options);
        const versionJSONPath = mc.getVersionJson(versionJSON.id);
        // context.update(20, 100);
        // write version json
        await this.yield(task.task("json", async () => {
            await ensureFile(versionJSONPath);
            await core._writeFile(versionJSONPath, JSON.stringify(versionJSON, null, 4));
        }));
        const launchWrapperEntry = record[`launchwrapper-of-${launchWrapperVersion}.jar`];
        // write launch wrapper
        if (launchWrapperEntry) {
            await this.yield(task.task("library", async () => {
                const wrapperDest = mc.getLibraryByPath(`optifine/launchwrapper-of/${launchWrapperVersion}/launchwrapper-of-${launchWrapperVersion}.jar`);
                await ensureFile(wrapperDest);
                await core._writeFile(wrapperDest, await unzip.readEntry(zip, launchWrapperEntry));
            }));
        }
        // write the optifine
        await this.yield(task.task("jar", async () => {
            var _a;
            const dest = mc.getLibraryByPath(`optifine/Optifine/${mcversion}_${editionRelease}/Optifine-${mcversion}_${editionRelease}.jar`);
            const mcJar = mc.getVersionJar(mcversion);
            await ensureFile(dest);
            await spawnProcess((_a = options.java) !== null && _a !== void 0 ? _a : "java", ["-cp", installer, "optifine.Patcher", mcJar, installer, dest]);
        }));
        return versionJSON.id;
    });
}

class DownloadJRETask extends DownloadTask {
    constructor(jre, dir, options) {
        const { sha1, url } = jre;
        const filename = path.basename(url);
        const downloadDestination = path.resolve(dir, filename);
        super({
            url,
            destination: downloadDestination,
            validator: {
                algorithm: "sha1",
                hash: sha1,
            },
            segmentPolicy: options.segmentPolicy,
            retryHandler: options.retryHandler,
            agents: options.agents,
        });
        this.name = "downloadJre";
        this.param = jre;
    }
}
/**
 * Install JRE from Mojang offical resource. It should install jdk 8.
 * @param options The install options
 */
function installJreFromMojangTask(options) {
    const { destination, unpackLZMA, cacheDir = os.tmpdir(), platform = core.getPlatform(), } = options;
    return task.task("installJreFromMojang", async function () {
        const info = await this.yield(task.task("fetchInfo", () => fetchJson("https://launchermeta.mojang.com/mc/launcher.json")));
        const system = platform.name;
        function resolveArch() {
            switch (platform.arch) {
                case "x86":
                case "x32": return "32";
                case "x64": return "64";
                default: return "32";
            }
        }
        const currentArch = resolveArch();
        if (!info[system] || !info[system][currentArch] || !info[system][currentArch].jre) {
            throw new Error("No Java package available for your platform");
        }
        const lzmaPath = await this.yield(new DownloadJRETask(info[system][currentArch].jre, cacheDir, options).map(function () { return this.to; }));
        const result = unpackLZMA(lzmaPath, destination);
        await ensureDir(destination);
        if (result instanceof Promise) {
            await this.yield(task.task("decompress", () => result));
        }
        else {
            await this.yield(result);
        }
        await this.yield(task.task("cleanup", () => unlink(lzmaPath)));
    });
}
/**
 * Install JRE from Mojang offical resource. It should install jdk 8.
 * @param options The install options
 */
function installJreFromMojang(options) {
    return installJreFromMojangTask(options).startAndWait();
}
/**
 * Try to resolve a java info at this path. This will call `java -version`
 * @param path The java exectuable path.
 */
async function resolveJava(path) {
    if (await missing(path)) {
        return undefined;
    }
    return new Promise((resolve) => {
        child_process.exec(`"${path}" -version`, (err, sout, serr) => {
            if (serr) {
                let ver = parseJavaVersion(serr);
                if (ver) {
                    resolve({ path, ...ver });
                }
                else {
                    resolve(undefined);
                }
            }
            else {
                resolve(undefined);
            }
        });
    });
}
/**
 * Parse version string and major version number from stderr of java process.
 *
 * @param versionText The stderr for `java -version`
 */
function parseJavaVersion(versionText) {
    const getVersion = (str) => {
        if (!str) {
            return undefined;
        }
        const match = /(\d+\.\d+\.\d+)(_(\d+))?/.exec(str);
        if (match === null) {
            return undefined;
        }
        return match[1];
    };
    let javaVersion = getVersion(versionText);
    if (!javaVersion) {
        return undefined;
    }
    let majorVersion = Number.parseInt(javaVersion.split(".")[0], 10);
    if (majorVersion === 1) {
        majorVersion = Number.parseInt(javaVersion.split(".")[1], 10);
    }
    let java = {
        version: javaVersion,
        majorVersion,
    };
    return java;
}
/**
 * Get all potential java locations for Minecraft.
 *
 * On mac/linux, it will perform `which java`. On win32, it will perform `where java`
 *
 * @returns The absolute java locations path
 */
async function getPotentialJavaLocations() {
    let unchecked = new Set();
    let currentPlatform = os.platform();
    let javaFile = currentPlatform === "win32" ? "javaw.exe" : "java";
    if (process.env.JAVA_HOME) {
        unchecked.add(path.join(process.env.JAVA_HOME, "bin", javaFile));
    }
    const which = () => new Promise((resolve) => {
        child_process.exec("which java", (error, stdout) => {
            resolve(stdout.replace("\n", ""));
        });
    });
    const where = () => new Promise((resolve) => {
        child_process.exec("where java", (error, stdout) => {
            resolve(stdout.split("\r\n"));
        });
    });
    if (currentPlatform === "win32") {
        const out = await new Promise((resolve) => {
            child_process.exec("REG QUERY HKEY_LOCAL_MACHINE\\Software\\JavaSoft\\ /s /v JavaHome", (error, stdout) => {
                if (!stdout) {
                    resolve([]);
                }
                resolve(stdout.split(os.EOL).map((item) => item.replace(/[\r\n]/g, ""))
                    .filter((item) => item != null && item !== undefined)
                    .filter((item) => item[0] === " ")
                    .map((item) => `${item.split("    ")[3]}\\bin\\javaw.exe`));
            });
        });
        for (const o of [...out, ...await where()]) {
            unchecked.add(o);
        }
        unchecked.add("C:\\Program Files (x86)\\Minecraft Launcher\\runtime\\jre-x64/X86");
    }
    else if (currentPlatform === "darwin") {
        unchecked.add("/Library/Internet Plug-Ins/JavaAppletPlugin.plugin/Contents/Home/bin/java");
        unchecked.add(await which());
    }
    else {
        unchecked.add(await which());
    }
    let checkingList = Array.from(unchecked).filter((jPath) => typeof jPath === "string").filter((p) => p !== "");
    return checkingList;
}
/**
 * Scan local java version on the disk.
 *
 * It will check if the passed `locations` are the home of java.
 * Notice that the locations should not be the executable, but the path of java installation, like JAVA_HOME.
 *
 * This will call `getPotentialJavaLocations` and then `resolveJava`
 *
 * @param locations The location (like java_home) want to check.
 * @returns All validate java info
 */
async function scanLocalJava(locations) {
    let unchecked = new Set(locations);
    let potential = await getPotentialJavaLocations();
    potential.forEach((p) => unchecked.add(p));
    let checkingList = [...unchecked].filter((jPath) => typeof jPath === "string").filter((p) => p !== "");
    const javas = await Promise.all(checkingList.map((jPath) => resolveJava(jPath)));
    return javas.filter(((j) => j !== undefined));
}

exports.JavaRuntimeTargetType = void 0;
(function (JavaRuntimeTargetType) {
    /**
     * The legacy java version
     */
    JavaRuntimeTargetType["Legacy"] = "jre-legacy";
    /**
     * The new java environment, which is the java 16
     */
    JavaRuntimeTargetType["Alpha"] = "java-runtime-alpha";
    JavaRuntimeTargetType["Beta"] = "java-runtime-beta";
    JavaRuntimeTargetType["JavaExe"] = "minecraft-java-exe";
})(exports.JavaRuntimeTargetType || (exports.JavaRuntimeTargetType = {}));
const DEFAULT_RUNTIME_ALL_URL = "https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json";
function normalizeUrls(url$1, fileHost) {
    if (!fileHost) {
        return [url$1];
    }
    if (typeof fileHost === "string") {
        const u = new url.URL(url$1);
        u.hostname = fileHost;
        return [u.toString(), url$1];
    }
    return fileHost.map((host) => {
        const u = new url.URL(url$1);
        u.hostname = host;
        return u.toString();
    }).concat(url$1);
}
/**
 * Fetch java runtime manifest. It should be able to resolve to your platform, or you can assign the platform.
 *
 * Also, you should assign the target to download, or it will use the latest java 16.
 * @param options The options of fetch runtime manifest
 */
async function fetchJavaRuntimeManifest(options = {}) {
    var _a, _b, _c, _d;
    const manifestIndex = (_a = options.manifestIndex) !== null && _a !== void 0 ? _a : await fetchJson(normalizeUrls((_b = options.url) !== null && _b !== void 0 ? _b : DEFAULT_RUNTIME_ALL_URL, options.apiHost)[0]);
    const platform = (_c = options.platform) !== null && _c !== void 0 ? _c : core.getPlatform();
    const runtimeTarget = (_d = options.target) !== null && _d !== void 0 ? _d : exports.JavaRuntimeTargetType.Beta;
    const resolveTarget = () => {
        if (platform.name === "windows") {
            if (platform.arch === "x64") {
                return manifestIndex["windows-x64"];
            }
            if (platform.arch === "x86" || platform.arch === "x32") {
                return manifestIndex["windows-x86"];
            }
        }
        if (platform.name === "osx") {
            return manifestIndex["mac-os"];
        }
        if (platform.name === "linux") {
            if (platform.arch === "x86" || platform.arch === "x32") {
                return manifestIndex["linux-i386"];
            }
            if (platform.arch === "x64") {
                return manifestIndex.linux;
            }
        }
        throw new Error("Cannot resolve platform");
    };
    const targets = resolveTarget()[runtimeTarget];
    if (targets && targets.length > 0) {
        const target = targets[0];
        const manifestUrl = normalizeUrls(target.manifest.url, options.apiHost)[0];
        const manifest = await fetchJson(manifestUrl);
        const result = {
            files: manifest.files,
            target: runtimeTarget,
            version: target.version,
        };
        return result;
    }
    else {
        throw new Error();
    }
}
/**
 * Install java runtime from java runtime manifest
 * @param options The options to install java runtime
 */
function installJavaRuntimesTask(options) {
    return task.task("installJavaRuntime", async function () {
        const destination = options.destination;
        const manifest = options.manifest;
        const decompressFunction = typeof options.lzma === "function" ? options.lzma : undefined;
        const downloadLzma = !!options.lzma;
        class DownloadAndDecompressTask extends DownloadTask {
            constructor(options) {
                super(options);
            }
            async runTask() {
                const result = await super.runTask();
                if (this._total === this._progress) {
                    const dest = this.download.destination.substring(0, this.download.destination.length - 5);
                    await decompressFunction(this.download.destination, dest);
                }
                return result;
            }
        }
        await withAgents(options, (options) => this.all(Object.entries(manifest.files)
            .filter(([file, entry]) => entry.type === "file")
            .map(([file, entry]) => {
            const fEntry = entry;
            const downloadInfo = (downloadLzma && fEntry.downloads.lzma) ? fEntry.downloads.lzma : fEntry.downloads.raw;
            const isLzma = downloadInfo == fEntry.downloads.lzma;
            const dest = isLzma ? (path.join(destination, file) + ".lzma") : path.join(destination, file);
            const urls = normalizeUrls(downloadInfo.url, options.apiHost);
            const downloadOptions = {
                url: urls,
                validator: {
                    algorithm: "sha1",
                    hash: downloadInfo.sha1,
                },
                destination: dest,
                segmentPolicy: options.segmentPolicy,
                retryHandler: options.retryHandler,
                agents: options.agents,
            };
            return isLzma && decompressFunction
                ? new DownloadAndDecompressTask(downloadOptions).setName("download")
                : new DownloadTask(downloadOptions).setName("download");
        }), {
            throwErrorImmediately: options.throwErrorImmediately,
            getErrorMessage: (e) => `Fail to install java runtime ${manifest.version.name} on ${manifest.target}`,
        }));
        await Promise.all(Object.entries(manifest.files)
            .filter(([file, entry]) => entry.type !== "file")
            .map(async ([file, entry]) => {
            const dest = path.join(destination, file);
            if (entry.type === "directory") {
                await ensureDir(dest);
            }
            else if (entry.type === "link") {
                await link(path.join(destination, entry.target), destination);
            }
        }));
    });
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
async function diagnoseInstall(installProfile, minecraftLocation) {
    const mc = core.MinecraftFolder.from(minecraftLocation);
    const report = {
        minecraftLocation: mc,
        installProfile,
        issues: [],
    };
    const issues = report.issues;
    const processors = resolveProcessors("client", installProfile, mc);
    await Promise.all(core.Version.resolveLibraries(installProfile.libraries).map(async (lib) => {
        const libPath = mc.getLibraryByPath(lib.download.path);
        const issue = await core.diagnoseFile({
            role: "library",
            file: libPath,
            expectedChecksum: lib.download.sha1,
            hint: "Problem on install_profile! Please consider to use Installer.installByProfile to fix."
        });
        if (issue) {
            issues.push(Object.assign(issue, { library: lib }));
        }
    }));
    for (const proc of processors) {
        if (proc.outputs) {
            for (const file in proc.outputs) {
                const issue = await core.diagnoseFile({
                    role: "processor",
                    file,
                    expectedChecksum: proc.outputs[file].replace(/'/g, ""),
                    hint: "Re-install this installer profile!"
                });
                if (issue) {
                    issues.push(Object.assign(issue, { processor: proc }));
                }
            }
        }
    }
    return report;
}

exports.BadCurseforgeModpackError = BadCurseforgeModpackError;
exports.BadForgeInstallerJarError = BadForgeInstallerJarError;
exports.BadOptifineJarError = BadOptifineJarError;
exports.ChecksumNotMatchError = ChecksumNotMatchError;
exports.ChecksumValidator = ChecksumValidator;
exports.DEFAULT_FABRIC_API = DEFAULT_FABRIC_API;
exports.DEFAULT_FORGE_MAVEN = DEFAULT_FORGE_MAVEN;
exports.DEFAULT_RESOURCE_ROOT_URL = DEFAULT_RESOURCE_ROOT_URL;
exports.DEFAULT_RUNTIME_ALL_URL = DEFAULT_RUNTIME_ALL_URL;
exports.DEFAULT_VERSION_MANIFEST = DEFAULT_VERSION_MANIFEST;
exports.DEFAULT_VERSION_MANIFEST_URL = DEFAULT_VERSION_MANIFEST_URL;
exports.DefaultSegmentPolicy = DefaultSegmentPolicy;
exports.Download = Download;
exports.DownloadCurseforgeFilesTask = DownloadCurseforgeFilesTask;
exports.DownloadForgeInstallerTask = DownloadForgeInstallerTask;
exports.DownloadJRETask = DownloadJRETask;
exports.DownloadTask = DownloadTask;
exports.FetchMetadataError = FetchMetadataError;
exports.InstallAssetIndexTask = InstallAssetIndexTask;
exports.InstallAssetTask = InstallAssetTask;
exports.InstallJarTask = InstallJarTask;
exports.InstallJsonTask = InstallJsonTask;
exports.InstallLibraryTask = InstallLibraryTask;
exports.JsonValidator = JsonValidator;
exports.LOADER_MAVEN_URL = LOADER_MAVEN_URL;
exports.MissingVersionJsonError = MissingVersionJsonError;
exports.PostProcessBadJarError = PostProcessBadJarError;
exports.PostProcessFailedError = PostProcessFailedError;
exports.PostProcessNoMainClassError = PostProcessNoMainClassError;
exports.PostProcessingTask = PostProcessingTask;
exports.UnzipTask = UnzipTask;
exports.ValidationError = ValidationError;
exports.YARN_MAVEN_URL = YARN_MAVEN_URL;
exports.ZipValidator = ZipValidator;
exports.createAgents = createAgents;
exports.createDefaultCurseforgeQuery = createDefaultCurseforgeQuery;
exports.createDownload = createDownload;
exports.createRetryHandler = createRetryHandler;
exports.createStatusController = createStatusController;
exports.diagnoseInstall = diagnoseInstall;
exports.download = download;
exports.fetchJavaRuntimeManifest = fetchJavaRuntimeManifest;
exports.fetchJson = fetchJson;
exports.fetchText = fetchText;
exports.generateOptifineVersion = generateOptifineVersion;
exports.getAndParseIfUpdate = getAndParseIfUpdate;
exports.getDefaultEntryResolver = getDefaultEntryResolver;
exports.getFabricArtifacts = getFabricArtifacts;
exports.getFabricLoaderArtifact = getFabricLoaderArtifact;
exports.getForgeVersionList = getForgeVersionList;
exports.getIfUpdate = getIfUpdate;
exports.getLastModified = getLastModified;
exports.getLiteloaderVersionList = getLiteloaderVersionList;
exports.getLoaderArtifactList = getLoaderArtifactList;
exports.getLoaderArtifactListFor = getLoaderArtifactListFor;
exports.getLoaderVersionListFromXML = getLoaderVersionListFromXML;
exports.getMetadata = getMetadata;
exports.getPotentialJavaLocations = getPotentialJavaLocations;
exports.getVersionList = getVersionList;
exports.getYarnArtifactList = getYarnArtifactList;
exports.getYarnArtifactListFor = getYarnArtifactListFor;
exports.getYarnVersionListFromXML = getYarnVersionListFromXML;
exports.install = install;
exports.installAssets = installAssets;
exports.installAssetsTask = installAssetsTask;
exports.installByProfile = installByProfile;
exports.installByProfileTask = installByProfileTask;
exports.installCurseforgeFile = installCurseforgeFile;
exports.installCurseforgeFileTask = installCurseforgeFileTask;
exports.installCurseforgeModpack = installCurseforgeModpack;
exports.installCurseforgeModpackTask = installCurseforgeModpackTask;
exports.installDependencies = installDependencies;
exports.installDependenciesTask = installDependenciesTask;
exports.installFabric = installFabric;
exports.installFabricYarnAndLoader = installFabricYarnAndLoader;
exports.installForge = installForge;
exports.installForgeTask = installForgeTask;
exports.installJavaRuntimesTask = installJavaRuntimesTask;
exports.installJreFromMojang = installJreFromMojang;
exports.installJreFromMojangTask = installJreFromMojangTask;
exports.installLibraries = installLibraries;
exports.installLibrariesTask = installLibrariesTask;
exports.installLiteloader = installLiteloader;
exports.installLiteloaderTask = installLiteloaderTask;
exports.installOptifine = installOptifine;
exports.installOptifineTask = installOptifineTask;
exports.installResolvedAssetsTask = installResolvedAssetsTask;
exports.installResolvedLibraries = installResolvedLibraries;
exports.installResolvedLibrariesTask = installResolvedLibrariesTask;
exports.installTask = installTask;
exports.installVersion = installVersion;
exports.installVersionTask = installVersionTask;
exports.isAgents = isAgents;
exports.isForgeInstallerEntries = isForgeInstallerEntries;
exports.isLegacyForgeInstallerEntries = isLegacyForgeInstallerEntries;
exports.isRetryHandler = isRetryHandler;
exports.isSegmentPolicy = isSegmentPolicy;
exports.isValidator = isValidator;
exports.parseJavaVersion = parseJavaVersion;
exports.postProcess = postProcess;
exports.readManifest = readManifest;
exports.readManifestTask = readManifestTask;
exports.resolveAbortSignal = resolveAbortSignal;
exports.resolveAgents = resolveAgents;
exports.resolveJava = resolveJava;
exports.resolveLibraryDownloadUrls = resolveLibraryDownloadUrls;
exports.resolveProcessors = resolveProcessors;
exports.resolveRetryHandler = resolveRetryHandler;
exports.resolveSegmentPolicy = resolveSegmentPolicy;
exports.resolveStatusController = resolveStatusController;
exports.resolveValidator = resolveValidator;
exports.scanLocalJava = scanLocalJava;
exports.walkForgeInstallerEntries = walkForgeInstallerEntries;
exports.withAgents = withAgents;
//# sourceMappingURL=index.js.map
