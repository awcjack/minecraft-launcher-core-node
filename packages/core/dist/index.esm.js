import { open, walkEntriesGenerator, openEntryReadStream } from '@xmcl/unzip';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { access as access$1, link as link$1, readFile as readFile$1, writeFile as writeFile$1, mkdir as mkdir$1, constants, createReadStream, createWriteStream, existsSync } from 'fs';
import * as os from 'os';
import { EOL } from 'os';
import { join, extname, dirname, isAbsolute, resolve, delimiter } from 'path';
import { pipeline as pipeline$1 } from 'stream';
import { promisify } from 'util';
import { v4 } from 'uuid';
import { createHash } from 'crypto';

/**
 * The Minecraft folder structure. All method will return the path related to a minecraft root like `.minecraft`.
 */
class MinecraftFolder {
    constructor(root) {
        this.root = root;
    }
    /**
     * Normal a Minecraft folder from a folder or string
     */
    static from(location) {
        return typeof location === "string"
            ? new MinecraftFolder(location)
            : location instanceof MinecraftFolder
                ? location
                : new MinecraftFolder(location.root);
    }
    get mods() { return join(this.root, "mods"); }
    get resourcepacks() { return join(this.root, "resourcepacks"); }
    get assets() { return join(this.root, "assets"); }
    get libraries() { return join(this.root, "libraries"); }
    get versions() { return this.getPath("versions"); }
    get logs() { return this.getPath("logs"); }
    get options() { return this.getPath("options.txt"); }
    get launcherProfile() { return this.getPath("launcher_profiles.json"); }
    get lastestLog() { return this.getPath("logs", "latest.log"); }
    get maps() { return this.getPath("saves"); }
    get saves() { return this.getPath("saves"); }
    get screenshots() { return this.getPath("screenshots"); }
    getNativesRoot(version) { return join(this.getVersionRoot(version), version + "-natives"); }
    getVersionRoot(version) { return join(this.versions, version); }
    getVersionJson(version) { return join(this.getVersionRoot(version), version + ".json"); }
    getVersionJar(version, type) { return type === "client" || type === undefined ? join(this.getVersionRoot(version), version + ".jar") : join(this.getVersionRoot(version), `${version}-${type}.jar`); }
    getVersionAll(version) {
        return [
            join(this.versions, version), join(this.versions, version, version + ".json"),
            join(this.versions, version, version + ".jar")
        ];
    }
    getResourcePack(fileName) { return join(this.resourcepacks, fileName); }
    getMod(fileName) { return join(this.mods, fileName); }
    getLog(fileName) { return join(this.logs, fileName); }
    getMapInfo(map) { return this.getPath("saves", map, "level.dat"); }
    getMapIcon(map) { return this.getPath("saves", map, "icon.png"); }
    getLibraryByPath(libraryPath) {
        return join(this.libraries, libraryPath);
    }
    getAssetsIndex(versionAssets) { return this.getPath("assets", "indexes", versionAssets + ".json"); }
    getAsset(hash) { return this.getPath("assets", "objects", hash.substring(0, 2), hash); }
    getPath(...path) {
        return join(this.root, ...path);
    }
}
var MinecraftPath;
(function (MinecraftPath) {
    MinecraftPath.mods = "mods";
    MinecraftPath.resourcepacks = "resourcepacks";
    MinecraftPath.assets = "assets";
    MinecraftPath.libraries = "libraries";
    MinecraftPath.versions = "versions";
    MinecraftPath.logs = "logs";
    MinecraftPath.options = "options.txt";
    MinecraftPath.launcherProfile = "launcher_profiles.json";
    MinecraftPath.lastestLog = "logs/latest.log";
    MinecraftPath.maps = MinecraftPath.saves;
    MinecraftPath.saves = "saves";
    MinecraftPath.screenshots = "screenshots";
    function getVersionRoot(version) { return join("versions", version); }
    MinecraftPath.getVersionRoot = getVersionRoot;
    function getNativesRoot(version) { return join("versions", version, version + "-natives"); }
    MinecraftPath.getNativesRoot = getNativesRoot;
    function getVersionJson(version) { return join("versions", version, version + ".json"); }
    MinecraftPath.getVersionJson = getVersionJson;
    function getVersionJar(version, type) {
        return type === "client" || type === undefined
            ? join("versions", version, version + ".jar")
            : join("versions", version, `${version}-${type}.jar`);
    }
    MinecraftPath.getVersionJar = getVersionJar;
    function getResourcePack(fileName) { return join("resourcepacks", fileName); }
    MinecraftPath.getResourcePack = getResourcePack;
    function getMod(fileName) { return join("mods", fileName); }
    MinecraftPath.getMod = getMod;
    function getLog(fileName) { return join("logs", fileName); }
    MinecraftPath.getLog = getLog;
    function getMapInfo(map) { return join("saves", map, "level.dat"); }
    MinecraftPath.getMapInfo = getMapInfo;
    function getMapIcon(map) { return join("saves", map, "icon.png"); }
    MinecraftPath.getMapIcon = getMapIcon;
    function getLibraryByPath(libraryPath) { return join("libraries", libraryPath); }
    MinecraftPath.getLibraryByPath = getLibraryByPath;
    function getAssetsIndex(versionAssets) { return join("assets", "indexes", versionAssets + ".json"); }
    MinecraftPath.getAssetsIndex = getAssetsIndex;
    function getAsset(hash) { return join("assets", "objects", hash.substring(0, 2), hash); }
    MinecraftPath.getAsset = getAsset;
})(MinecraftPath || (MinecraftPath = {}));

/**
 * Get Minecraft style platform info. (Majorly used to enable/disable native dependencies)
 */
function getPlatform() {
    const arch = os.arch();
    const version = os.release();
    switch (os.platform()) {
        case "darwin":
            return { name: "osx", version, arch };
        case "linux":
            return { name: "linux", version, arch };
        case "win32":
            return { name: "windows", version, arch };
        default:
            return { name: "unknown", version, arch };
    }
}

/**
 * @ignore
 */
/** @internal */
const pipeline = promisify(pipeline$1);
/** @internal */
const access = promisify(access$1);
/** @internal */
const link = promisify(link$1);
/** @internal */
const readFile = promisify(readFile$1);
/** @internal */
const writeFile = promisify(writeFile$1);
/** @internal */
const mkdir = promisify(mkdir$1);
/** @internal */
function exists(file) {
    return access(file, constants.F_OK).then(() => true, () => false);
}
/**
 * Validate the sha1 value of the file
 * @internal
 */
async function validateSha1(target, hash, strict = false) {
    if (await access(target).then(() => false, () => true)) {
        return false;
    }
    if (!hash) {
        return !strict;
    }
    let sha1 = await checksum(target, "sha1");
    return sha1 === hash;
}
/**
 * Return the sha1 of a file
 * @internal
 */
async function checksum(target, algorithm) {
    let hash = createHash(algorithm).setEncoding("hex");
    await pipeline(createReadStream(target), hash);
    return hash.read();
}
/**
 * @internal
 */
function isNotNull(v) {
    return v !== undefined;
}

var LibraryInfo;
(function (LibraryInfo) {
    /**
     * Resolve the library info from the maven path.
     * @param path The library path. It should look like `net/minecraftforge/forge/1.0/forge-1.0.jar`
     */
    function resolveFromPath(path) {
        let parts = path.split("/");
        let file = parts[parts.length - 1];
        let version = parts[parts.length - 2];
        let artifactId = parts[parts.length - 3];
        let groupId = parts.slice(0, parts.length - 3).join(".");
        let filePrefix = `${artifactId}-${version}`;
        let ext = extname(file);
        let type = ext.substring(1);
        let isSnapshot = file.startsWith(version);
        let classifier = file.substring(isSnapshot ? version.length : filePrefix.length, file.length - ext.length);
        if (classifier.startsWith("-")) {
            classifier = classifier.slice(1);
        }
        let name = `${groupId}:${artifactId}:${version}`;
        if (classifier) {
            name += `:${classifier}`;
        }
        if (type !== "jar") {
            name += `@${type}`;
        }
        return {
            type,
            groupId,
            artifactId,
            version,
            classifier,
            name,
            path,
            isSnapshot,
        };
    }
    LibraryInfo.resolveFromPath = resolveFromPath;
    /**
     * Get the base info of the library from its name
     *
     * @param lib The name of library or the library itself
     */
    function resolve(lib) {
        const name = typeof lib === "string" ? lib : lib.name;
        const [body, type = "jar"] = name.split("@");
        const [groupId, artifactId, version, classifier = ""] = body.split(":");
        const isSnapshot = version.endsWith("-SNAPSHOT");
        const groupPath = groupId.replace(/\./g, "/");
        let base = `${groupPath}/${artifactId}/${version}/${artifactId}-${version}`;
        if (classifier) {
            base += `-${classifier}`;
        }
        const path = `${base}.${type}`;
        return {
            type,
            groupId,
            artifactId,
            version,
            name,
            isSnapshot,
            classifier,
            path,
        };
    }
    LibraryInfo.resolve = resolve;
})(LibraryInfo || (LibraryInfo = {}));
/**
 * A resolved library for launcher. It can by parsed from `LibraryInfo`.
 */
class ResolvedLibrary {
    constructor(name, info, download, checksums, serverreq, clientreq) {
        this.name = name;
        this.download = download;
        this.checksums = checksums;
        this.serverreq = serverreq;
        this.clientreq = clientreq;
        const { groupId, artifactId, version, isSnapshot, type, classifier, path } = info;
        this.groupId = groupId;
        this.artifactId = artifactId;
        this.version = version;
        this.isSnapshot = isSnapshot;
        this.type = type;
        this.classifier = classifier;
        this.path = path;
    }
}
/**
 * Represent a native libraries provided by Minecraft
 */
class ResolvedNative extends ResolvedLibrary {
    constructor(name, info, download, extractExclude) {
        super(name, info, download);
        this.extractExclude = extractExclude;
    }
}
var Version;
(function (Version) {
    /**
      * Check if all the rules in `Rule[]` are acceptable in certain OS `platform` and features.
      * @param rules The rules usually comes from `Library` or `LaunchArgument`
      * @param platform The platform, leave it absent will use the `currentPlatform`
      * @param features The features, used by game launch argument `arguments.game`
      */
    function checkAllowed(rules, platform = getPlatform(), features = []) {
        // by default it's allowed
        if (!rules || rules.length === 0) {
            return true;
        }
        // else it's disallow by default
        let allow = false;
        for (const rule of rules) {
            const action = rule.action === "allow";
            // apply by default
            let apply = true;
            if ("os" in rule && rule.os) {
                // don't apply by default if has os rule
                apply = false;
                const osRule = rule.os;
                if (platform.name === osRule.name
                    && (!osRule.version || platform.version.match(osRule.version))) {
                    apply = true;
                }
            }
            if (apply) {
                if ("features" in rule && rule.features) {
                    const featureRequire = rule.features;
                    // only apply when the EVERY required features enabled & not required features disabled
                    apply = Object.entries(featureRequire)
                        .every(([k, v]) => v ? features.indexOf(k) !== -1 : features.indexOf(k) === -1);
                }
            }
            if (apply) {
                allow = action;
            }
        }
        return allow;
    }
    Version.checkAllowed = checkAllowed;
    /**
     * Recursively parse the version JSON.
     *
     * This function requires that the id in version.json is identical to the directory name of that version.
     *
     * e.g. .minecraft/<version-a>/<version-a.json> and in <version-a.json>:
     *```
     * { "id": "<version-a>", ... }
     * ```
     * The function might throw multiple parsing errors. You can handle them with type by this:
     * ```ts
     * try {
     *   await Version.parse(mcPath, version);
     * } catch (e) {
     *   let err = e as VersionParseError;
     *   switch (err.error) {
     *     case "BadVersionJson": // do things...
     *     // handle other cases
     *     default: // this means this is not a VersionParseError, handle error normally.
     *   }
     * }
     * ```
     *
     * @param minecraftPath The .minecraft path
     * @param version The vesion id.
     * @return The final resolved version detail
     * @throws {@link CorruptedVersionJsonError}
     * @throws {@link MissingVersionJsonError}
     * @throws {@link BadVersionJsonError}
     * @see {@link VersionParseError}
     */
    async function parse(minecraftPath, version, platofrm = getPlatform()) {
        const folder = MinecraftFolder.from(minecraftPath);
        // the hierarchy is outer version to dep version
        // e.g. [liteloader version, forge version, minecraft version]
        const hierarchy = await resolveDependency(folder, version, platofrm);
        return resolve(minecraftPath, hierarchy);
    }
    Version.parse = parse;
    /**
     * Resolve the given version hierarchy into `ResolvedVersion`.
     *
     * Some launcher has non-standard version json format to handle hierarchy,
     * and if you want to handle them, you can use this function to parse.
     *
     * @param minecraftPath The path of the Minecraft folder
     * @param hierarchy The version hierarchy, which can be produced by `normalizeVersionJson`
     * @throws {@link BadVersionJsonError}
     * @see {@link VersionParseError}
     * @see {@link normalizeVersionJson}
     * @see {@link parse}
     */
    function resolve(minecraftPath, hierarchy) {
        const folder = MinecraftFolder.from(minecraftPath);
        const rootVersion = hierarchy[hierarchy.length - 1];
        const id = hierarchy[0].id;
        let assetIndex = rootVersion.assetIndex;
        let assets = "";
        const downloadsMap = {};
        const librariesMap = {};
        const nativesMap = {};
        let mainClass = "";
        const args = { jvm: [], game: [] };
        let minimumLauncherVersion = 0;
        let releaseTime = "";
        let time = "";
        let type = "";
        let logging;
        let minecraftVersion = rootVersion.id;
        let location;
        let javaVersion = { majorVersion: 8, component: "jre-legacy" };
        const chains = hierarchy.map((j) => folder.getVersionRoot(j.id));
        const inheritances = hierarchy.map((j) => j.id);
        let json;
        do {
            json = hierarchy.pop();
            minimumLauncherVersion = Math.max(json.minimumLauncherVersion || 0, minimumLauncherVersion);
            location = json.minecraftDirectory;
            if (!Reflect.get(json, "replace")) {
                args.game.push(...json.arguments.game);
                args.jvm.push(...json.arguments.jvm);
            }
            else {
                args.game = json.arguments.game;
                args.jvm = json.arguments.jvm;
            }
            releaseTime = json.releaseTime || releaseTime;
            time = json.time || time;
            logging = json.logging || logging;
            assets = json.assets || assets;
            type = json.type || type;
            mainClass = json.mainClass || mainClass;
            assetIndex = json.assetIndex || assetIndex;
            javaVersion = json.javaVersion || javaVersion;
            if (json.libraries) {
                json.libraries.forEach((lib) => {
                    const libOrgName = lib.name.substring(0, lib.name.lastIndexOf(":"));
                    if (lib instanceof ResolvedNative) {
                        nativesMap[libOrgName] = lib;
                    }
                    else {
                        librariesMap[libOrgName] = lib;
                    }
                });
            }
            if (json.downloads) {
                for (const key in json.downloads) {
                    downloadsMap[key] = json.downloads[key];
                }
            }
        } while (hierarchy.length !== 0);
        if (!mainClass) {
            throw Object.assign(new Error(), {
                error: "BadVersionJson",
                version: id,
                missing: "MainClass",
            });
        }
        if (!assetIndex) {
            throw Object.assign(new Error(), {
                error: "BadVersionJson",
                version: id,
                missing: "AssetIndex",
            });
        }
        if (Object.keys(downloadsMap).length === 0) {
            throw Object.assign(new Error(), {
                error: "BadVersionJson",
                version: id,
                missing: "Downloads",
            });
        }
        return {
            id,
            assetIndex,
            assets,
            minecraftVersion,
            inheritances,
            arguments: args,
            downloads: downloadsMap,
            libraries: Object.keys(librariesMap).map((k) => librariesMap[k]).concat(Object.keys(nativesMap).map((k) => nativesMap[k])),
            mainClass, minimumLauncherVersion, releaseTime, time, type, logging,
            pathChain: chains,
            minecraftDirectory: location,
            javaVersion,
        };
    }
    Version.resolve = resolve;
    /**
     * Simply extends the version (actaully mixin)
     *
     * The result version will have the union of two version's libs. If one lib in two versions has different version, it will take the extra version one.
     * It will also mixin the launchArgument if it could.
     *
     * This function can be used for mixin forge and liteloader version.
     *
     * This function will throw an Error if two version have different assets. It doesn't care about the detail version though.
     *
     * @beta
     * @param id The new version id
     * @param parent The parent version will be inherited
     * @param version The version info which will overlap some parent information
     * @return The raw version json could be save to the version json file
     */
    function inherits(id, parent, version) {
        const launcherVersion = Math.max(parent.minimumLauncherVersion, version.minimumLauncherVersion);
        const libMap = {};
        parent.libraries.forEach((l) => { libMap[l.name] = l; });
        const libraries = version.libraries.filter((l) => libMap[l.name] === undefined);
        const result = {
            id,
            time: new Date().toISOString(),
            releaseTime: new Date().toISOString(),
            type: version.type,
            libraries,
            mainClass: version.mainClass,
            inheritsFrom: parent.id,
            minimumLauncherVersion: launcherVersion,
        };
        if (typeof parent.minecraftArguments === "string") {
            if (typeof version.arguments === "object") {
                throw new TypeError("Extends require two version in same format!");
            }
            result.minecraftArguments = mixinArgumentString(parent.minecraftArguments, version.minecraftArguments || "");
        }
        else if (typeof parent.arguments === "object") {
            if (typeof version.minecraftArguments === "string") {
                throw new TypeError("Extends require two version in same format!");
            }
            result.arguments = version.arguments;
        }
        return result;
    }
    Version.inherits = inherits;
    /**
     * Mixin the string arguments
     * @beta
     * @param hi Higher priority argument
     * @param lo Lower priority argument
     */
    function mixinArgumentString(hi, lo) {
        const arrA = hi.split(" ");
        const arrB = lo.split(" ");
        const args = {};
        for (let i = 0; i < arrA.length; i++) { // collection higher priority argument
            const element = arrA[i];
            if (!args[element]) {
                args[element] = [];
            }
            if (arrA[i + 1]) {
                args[element].push(arrA[i += 1]);
            }
        }
        for (let i = 0; i < arrB.length; i++) { // collect lower priority argument
            const element = arrB[i];
            if (!args[element]) {
                args[element] = [];
            }
            if (arrB[i + 1]) {
                args[element].push(arrB[i += 1]);
            }
        }
        const out = [];
        for (const k of Object.keys(args)) {
            switch (k) {
                case "--tweakClass":
                    const set = {};
                    for (const v of args[k]) {
                        set[v] = 0;
                    }
                    Object.keys(set).forEach((v) => out.push(k, v));
                    break;
                default:
                    if (args[k][0]) {
                        out.push(k, args[k][0]);
                    } // use higher priority argument in common
                    break;
            }
        }
        return out.join(" ");
    }
    Version.mixinArgumentString = mixinArgumentString;
    /**
     * Resolve the dependencies of a minecraft version
     * @param path The path of minecraft
     * @param version The version id
     * @returns All the version required to run this version, including this version
     * @throws {@link CorruptedVersionJsonError}
     * @throws {@link MissingVersionJsonError}
     */
    async function resolveDependency(path, version, platform = getPlatform()) {
        const folder = MinecraftFolder.from(path);
        const stack = [];
        async function walk(versionName) {
            let jsonPath = folder.getVersionJson(versionName);
            let contentString;
            try {
                contentString = await readFile(jsonPath, "utf-8");
            }
            catch (err) {
                const e = err;
                throw Object.assign(new Error(e.message), {
                    error: "MissingVersionJson",
                    version: versionName,
                    path: jsonPath,
                });
            }
            let nextVersion;
            try {
                let versionJson = normalizeVersionJson(contentString, folder.root, platform);
                stack.push(versionJson);
                nextVersion = versionJson.inheritsFrom;
            }
            catch (e) {
                if (e instanceof SyntaxError) {
                    throw Object.assign(new Error(e.message), {
                        error: "CorruptedVersionJson",
                        version: versionName,
                        json: contentString
                    });
                }
                throw e;
            }
            if (nextVersion) {
                await walk(nextVersion);
            }
        }
        await walk(version);
        return stack;
    }
    Version.resolveDependency = resolveDependency;
    function resolveLibrary(lib, platform = getPlatform()) {
        if ("rules" in lib && !checkAllowed(lib.rules, platform)) {
            return undefined;
        }
        // official natives foramt
        if ("natives" in lib) {
            if (!lib.natives[platform.name]) {
                return undefined;
            }
            const classifier = (lib.natives[platform.name]).replace("${arch}", platform.arch.substring(1));
            const nativeArtifact = lib.downloads.classifiers[classifier];
            if (!nativeArtifact) {
                return undefined;
            }
            return new ResolvedNative(lib.name + ":" + classifier, LibraryInfo.resolve(lib.name + ":" + classifier), nativeArtifact, lib.extract ? lib.extract.exclude ? lib.extract.exclude : undefined : undefined);
        }
        const info = LibraryInfo.resolve(lib.name);
        // normal library
        if ("downloads" in lib) {
            if (!lib.downloads.artifact.url) {
                lib.downloads.artifact.url = info.groupId === "net.minecraftforge"
                    ? "https://files.minecraftforge.net/maven/" + lib.downloads.artifact.path
                    : "https://libraries.minecraft.net/" + lib.downloads.artifact.path;
            }
            return new ResolvedLibrary(lib.name, info, lib.downloads.artifact);
        }
        const maven = lib.url || "https://libraries.minecraft.net/";
        const artifact = {
            size: -1,
            sha1: lib.checksums ? lib.checksums[0] : "",
            path: info.path,
            url: maven + info.path,
        };
        return new ResolvedLibrary(lib.name, info, artifact, lib.checksums, lib.serverreq, lib.clientreq);
    }
    Version.resolveLibrary = resolveLibrary;
    /**
     * Resolve all these library and filter out os specific libs
     * @param libs All raw lib
     * @param platform The platform
     */
    function resolveLibraries(libs, platform = getPlatform()) {
        return libs.map((lib) => resolveLibrary(lib, platform)).filter((l) => l !== undefined);
    }
    Version.resolveLibraries = resolveLibraries;
    /**
     * Normalize a single version json.
     *
     * This function will force legacy version format into new format.
     * It will convert `minecraftArguments` into `arguments.game` and generate a default `arguments.jvm`
     *
     * This will pre-process the libraries according to the rules fields and current platform.
     * Non-matched libraries will be filtered out.
     *
     * This will also pre-process the jvm arguments according to the platform (os) info it provided.
     *
     * @param versionString The version json string
     * @param root The root of the version
     */
    function normalizeVersionJson(versionString, root, platform = getPlatform()) {
        function processArguments(ar) {
            return ar.filter((a) => {
                // only filter out the os only rule.
                // if the features fields presented, we don't process it now
                if (typeof a === "object" && a.rules.every((r) => typeof r === "string" || !("features" in r))) {
                    return Version.checkAllowed(a.rules, platform);
                }
                return true;
            });
        }
        let parsed = JSON.parse(versionString);
        // if we legacy version json don't have argument, but have minecraftArugments
        let legacyVersionJson = !parsed.arguments;
        let libraries = Version.resolveLibraries(parsed.libraries || [], platform);
        let args = {
            jvm: [],
            game: [],
        };
        if (!parsed.arguments) { // old version
            args.game = parsed.minecraftArguments
                ? parsed.minecraftArguments.split(" ")
                : [];
            args.jvm = [
                {
                    rules: [
                        {
                            action: "allow",
                            os: {
                                name: "windows",
                            },
                        },
                    ],
                    value: "-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump",
                },
                {
                    rules: [
                        {
                            action: "allow",
                            os: {
                                name: "windows",
                                version: "^10\\.",
                            },
                        },
                    ],
                    value: [
                        "-Dos.name=Windows 10",
                        "-Dos.version=10.0",
                    ],
                },
                "-Djava.library.path=${natives_directory}",
                "-Dminecraft.launcher.brand=${launcher_name}",
                "-Dminecraft.launcher.version=${launcher_version}",
                "-cp",
                "${classpath}",
            ];
        }
        else {
            args.jvm = parsed.arguments.jvm || [];
            args.game = parsed.arguments.game || [];
        }
        args.jvm = processArguments(args.jvm);
        let partial = {
            ...parsed,
            libraries,
            arguments: args,
            minecraftDirectory: root,
            // we want to replace the arguments for every version json in legacy version json
            replace: legacyVersionJson,
        };
        return partial;
    }
    Version.normalizeVersionJson = normalizeVersionJson;
})(Version || (Version = {}));

function format(template, args) {
    return template.replace(/\$\{(.*?)}/g, (key) => {
        const value = args[key.substring(2).substring(0, key.length - 3)];
        return value ? value : key;
    });
}
const DEFAULT_EXTRA_JVM_ARGS = Object.freeze([
    "-Xmx2G",
    "-XX:+UnlockExperimentalVMOptions",
    "-XX:+UseG1GC",
    "-XX:G1NewSizePercent=20",
    "-XX:G1ReservePercent=20",
    "-XX:MaxGCPauseMillis=50",
    "-XX:G1HeapRegionSize=32M"
]);
var LaunchPrecheck;
(function (LaunchPrecheck) {
    /**
     * The default launch precheck. It will check version jar, libraries and natives.
     */
    LaunchPrecheck.DEFAULT_PRECHECKS = Object.freeze([checkVersion, checkLibraries, checkNatives, linkAssets]);
    /**
     * @deprecated
     */
    LaunchPrecheck.Default = LaunchPrecheck.DEFAULT_PRECHECKS;
    /**
     * Link assets to the assets/virtual/legacy.
     */
    async function linkAssets(resource, version, option) {
        if (version.assets !== "legacy") {
            return;
        }
        let assetsIndexPath = resource.getAssetsIndex(version.assets);
        let buf = await readFile(assetsIndexPath);
        let assetsIndex = JSON.parse(buf.toString());
        let virtualPath = resource.getPath("assets/virtual/" + version.assets);
        await mkdir(virtualPath, { recursive: true }).catch(() => { });
        let dirs = Object.keys(assetsIndex.objects)
            .map((path) => dirname(join(virtualPath, path)))
            .reduce((a, b) => a.add(b), new Set());
        await Promise.all([...dirs].map((dir) => mkdir(dir, { recursive: true })));
        for (let [path, { hash }] of Object.entries(assetsIndex.objects)) {
            let assetPath = resource.getAsset(hash);
            let targetPath = join(virtualPath, path);
            await link(assetPath, targetPath).catch((e) => {
                if (e.code !== "EEXIST") {
                    throw e;
                }
            });
        }
    }
    LaunchPrecheck.linkAssets = linkAssets;
    /**
     * Quick check if Minecraft version jar is corrupted
     * @throws {@link CorruptedVersionJarError}
     */
    async function checkVersion(resource, version, option) {
        const jarPath = resource.getVersionJar(version.minecraftVersion);
        if (!await validateSha1(jarPath, version.downloads.client.sha1)) {
            throw Object.assign(new Error(`Corrupted Version jar ${jarPath}. Either the file not reachable or the file sha1 not matched!`), {
                error: "CorruptedVersionJar",
                version: version.minecraftVersion,
            });
        }
    }
    LaunchPrecheck.checkVersion = checkVersion;
    /**
     * Quick check if there are missed libraries.
     * @throws {@link MissingLibrariesError}
     */
    async function checkLibraries(resource, version, option) {
        const validMask = await Promise.all(version.libraries
            .map((lib) => validateSha1(resource.getLibraryByPath(lib.download.path), lib.download.sha1)));
        const corruptedLibs = version.libraries.filter((_, index) => !validMask[index]);
        if (corruptedLibs.length > 0) {
            throw Object.assign(new Error(`Missing ${corruptedLibs.length} libraries! Either the file not reachable or the file sha1 not matched!`), {
                error: "MissingLibraries",
                libraries: corruptedLibs,
                version,
            });
        }
    }
    LaunchPrecheck.checkLibraries = checkLibraries;
    /**
     * Ensure the native are correctly extracted in place.
     *
     * It will check native root located in {@link LaunchOption.nativeRoot} if it's presented.
     * Or, it will use the `<version-id>-native` under version folder as native root to check.
     *
     * This will automatically extract native if there is not native extracted.
     *
     * @param resource The minecraft directory to extract native
     * @param option If the native root presented here, it will use the root here.
     */
    async function checkNatives(resource, version, option) {
        const native = option.nativeRoot || resource.getNativesRoot(version.id);
        await mkdir(native, { recursive: true }).catch((e) => {
            if (e.code !== "EEXIST") {
                throw e;
            }
        });
        const natives = version.libraries.filter((lib) => lib instanceof ResolvedNative);
        const checksumFile = join(native, ".json");
        const includedLibs = natives.map((n) => n.name).sort();
        const checksumFileObject = await readFile(checksumFile, "utf-8").then(JSON.parse).catch((e) => undefined);
        let shaEntries;
        if (checksumFileObject && checksumFileObject.libraries) {
            // only if the lib not change
            // consider the case of os changed or java changed
            if (checksumFileObject.libraries.sort().every((v, i) => v === includedLibs[i])) {
                shaEntries = checksumFileObject.entries;
            }
        }
        const extractedNatives = [];
        async function extractJar(n) {
            if (!n) {
                return;
            }
            const excluded = n.extractExclude || [];
            const containsExcludes = (p) => excluded.filter((s) => p.startsWith(s)).length === 0;
            const notInMetaInf = (p) => p.indexOf("META-INF/") === -1;
            const notSha1AndNotGit = (p) => !(p.endsWith(".sha1") || p.endsWith(".git"));
            const from = resource.getLibraryByPath(n.download.path);
            const promises = [];
            const zip = await open(from, { lazyEntries: true, autoClose: false });
            for await (const entry of walkEntriesGenerator(zip)) {
                if (containsExcludes(entry.fileName) && notInMetaInf(entry.fileName) && notSha1AndNotGit(entry.fileName)) {
                    const dest = join(native, entry.fileName);
                    extractedNatives.push({ file: entry.fileName, name: n.name, sha1: "" });
                    promises.push(promisify(pipeline$1)(await openEntryReadStream(zip, entry), createWriteStream(dest)));
                }
            }
            await Promise.all(promises);
        }
        if (shaEntries) {
            const validEntries = {};
            for (const entry of shaEntries) {
                if (typeof entry.file !== "string") {
                    continue;
                }
                const file = join(native, entry.file);
                const valid = await validateSha1(file, entry.sha1, true);
                if (valid) {
                    validEntries[entry.name] = true;
                }
            }
            const missingNatives = natives.filter((n) => !validEntries[n.name]);
            if (missingNatives.length !== 0) {
                await Promise.all(missingNatives.map(extractJar));
            }
        }
        else {
            await Promise.all(natives.map(extractJar));
            const entries = await Promise.all(extractedNatives.map(async (n) => ({
                ...n,
                sha1: await checksum(join(native, n.file), "sha1")
            })));
            const fileContent = JSON.stringify({
                entries,
                libraries: includedLibs,
            });
            await writeFile(checksumFile, fileContent);
        }
    }
    LaunchPrecheck.checkNatives = checkNatives;
})(LaunchPrecheck || (LaunchPrecheck = {}));
async function launchServer(options) {
    const args = await generateArgumentsServer(options);
    let cwd = options.cwd;
    if ("path" in options) {
        cwd = options.path;
    }
    else {
        cwd = dirname(options.serverExectuableJarPath);
    }
    const spawnOption = { cwd, env: process.env, ...(options.extraExecOption || {}) };
    return spawn(args[0], args.slice(1), spawnOption);
}
/**
 * Create a process watcher for a minecraft process.
 *
 * It will watch the stdout and the error event of the process to detect error and minecraft state.
 * @param process The Minecraft process
 * @param emitter The event emitter which will emit usefule event
 */
function createMinecraftProcessWatcher(process, emitter = new EventEmitter()) {
    var _a;
    let crashReport = "";
    let crashReportLocation = "";
    let waitForReady = true;
    process.on("error", (e) => {
        emitter.emit("error", e);
    });
    process.on("exit", (code, signal) => {
        emitter.emit("minecraft-exit", {
            code,
            signal,
            crashReport,
            crashReportLocation,
        });
    });
    (_a = process.stdout) === null || _a === void 0 ? void 0 : _a.on("data", (s) => {
        const string = s.toString();
        if (string.indexOf("---- Minecraft Crash Report ----") !== -1) {
            crashReport = string;
        }
        else if (string.indexOf("Crash report saved to:") !== -1) {
            crashReportLocation = string.substring(string.indexOf("Crash report saved to:") + "Crash report saved to: #@!@# ".length);
            crashReportLocation = crashReportLocation.replace(EOL, "").trim();
        }
        else if (waitForReady && string.indexOf("Reloading ResourceManager") !== -1 || string.indexOf("LWJGL Version: ") !== -1 || string.indexOf("OpenAL initialized.") !== -1) {
            waitForReady = false;
            emitter.emit("minecraft-window-ready");
        }
    });
    return emitter;
}
/**
 * Launch the minecraft as a child process. This function use spawn to create child process. To use an alternative way, see function generateArguments.
 *
 * By default, it will use the `LauncherPrecheck.Default` to pre-check:
 * - It will also check if the runtime libs are completed, and will extract native libs if needed.
 * - It might throw exception when the version jar is missing/checksum not matched.
 * - It might throw if the libraries/natives are missing.
 *
 * If you DON'T want such precheck, and you want to change it. You can assign the `prechecks` property in launch
 *
 * ```ts
 * launch({ ...otherOptions, prechecks: yourPrechecks });
 * ```
 *
 * @param options The detail options for this launching.
 * @see [ChildProcess](https://nodejs.org/api/child_process.html)
 * @see [spawn](https://nodejs.org/api/spawn.html)
 * @see {@link generateArguments}
 * @see {@link createMinecraftProcessWatcher}
 * @throws {@link CorruptedVersionJarError}
 * @throws {@link MissingLibrariesError}
 */
async function launch(options) {
    var _a;
    const gamePath = !isAbsolute(options.gamePath) ? resolve(options.gamePath) : options.gamePath;
    const resourcePath = options.resourcePath || gamePath;
    const version = typeof options.version === "string" ? await Version.parse(resourcePath, options.version) : options.version;
    let args = await generateArguments({ ...options, version, gamePath, resourcePath });
    const minecraftFolder = MinecraftFolder.from(resourcePath);
    const prechecks = options.prechecks || LaunchPrecheck.DEFAULT_PRECHECKS;
    await Promise.all(prechecks.map((f) => f(minecraftFolder, version, options)));
    const spawnOption = { cwd: options.gamePath, ...(options.extraExecOption || {}) };
    if ((_a = options.extraExecOption) === null || _a === void 0 ? void 0 : _a.shell) {
        args = args.map((a) => `"${a}"`);
    }
    // fix the ENOTFOUND if cwd does not existed.
    if (!existsSync(gamePath)) {
        await mkdir(gamePath);
    }
    return spawn(args[0], args.slice(1), spawnOption);
}
/**
 * Generate the argument for server
 */
async function generateArgumentsServer(options) {
    const { javaPath, minMemory = 1024, maxMemory = 1024, extraJVMArgs = [], extraMCArgs = [], extraExecOption = {} } = options;
    const cmd = [
        javaPath,
        `-Xms${(minMemory)}M`,
        `-Xmx${(maxMemory)}M`,
        ...extraJVMArgs,
    ];
    if ("path" in options) {
        let mc = MinecraftFolder.from(options.path);
        let version = options.version;
        let resolvedVersion = typeof version === "string" ? await Version.parse(mc, version) : version;
        cmd.push("-jar", mc.getVersionJar(resolvedVersion.minecraftVersion, "server"));
    }
    else {
        cmd.push("-jar", options.serverExectuableJarPath);
    }
    cmd.push(...extraMCArgs);
    if (options.nogui) {
        cmd.push("nogui");
    }
    return cmd;
}
/**
 * Generate the arguments array by options. This function is useful if you want to launch the process by yourself.
 *
 * This function will **NOT** check if the runtime libs are completed, and **WONT'T** check or extract native libs.
 *
 * If you want to ensure native. Please see {@link LaunchPrecheck.checkNatives}.
 *
 * @param options The launch options.
 * @throws TypeError if options does not fully fulfill the requirement
 */
async function generateArguments(options) {
    var _a;
    if (!options.version) {
        throw new TypeError("Version cannot be null!");
    }
    if (!options.isDemo) {
        options.isDemo = false;
    }
    const currentPlatform = (_a = options.platform) !== null && _a !== void 0 ? _a : getPlatform();
    const gamePath = !isAbsolute(options.gamePath) ? resolve(options.gamePath) : options.gamePath;
    const resourcePath = options.resourcePath || gamePath;
    const version = typeof options.version === "string" ? await Version.parse(resourcePath, options.version) : options.version;
    const mc = MinecraftFolder.from(resourcePath);
    const cmd = [];
    const { id = v4().replace(/-/g, ""), name = "Steve" } = options.gameProfile || {};
    const accessToken = options.accessToken || v4().replace(/-/g, "");
    const properties = options.properties || {};
    const userType = options.userType || "Mojang";
    const features = options.features || {};
    const jvmArguments = normalizeArguments(version.arguments.jvm, currentPlatform, features);
    const gameArguments = normalizeArguments(version.arguments.game, currentPlatform, features);
    const featureValues = Object.values(features).filter((f) => typeof f === "object").reduce((a, b) => ({ ...a, ...b }), {});
    const launcherName = options.launcherName || "Launcher";
    const launcherBrand = options.launcherBrand || "0.0.1";
    const nativeRoot = options.nativeRoot || mc.getNativesRoot(version.id);
    let gameIcon = options.gameIcon;
    if (!gameIcon) {
        const index = mc.getAssetsIndex(version.assetIndex.id);
        const indexContent = await readFile(index, { encoding: "utf-8" }).then((b) => JSON.parse(b.toString()), () => ({}));
        if ("icons/minecraft.icns" in indexContent) {
            gameIcon = mc.getAsset(indexContent["icons/minecraft.icns"].hash);
        }
        else if ("minecraft/icons/minecraft.icns" in indexContent) {
            gameIcon = mc.getAsset(indexContent["minecraft/icons/minecraft.icns"].hash);
        }
        else {
            gameIcon = "";
        }
    }
    const gameName = options.gameName || "Minecraft";
    cmd.push(options.javaPath);
    if (currentPlatform.name === "osx") {
        cmd.push(`-Xdock:name=${gameName}`);
        if (gameIcon) {
            cmd.push(`-Xdock:icon=${gameIcon}`);
        }
    }
    if (options.minMemory) {
        cmd.push(`-Xms${(options.minMemory)}M`);
    }
    if (options.maxMemory) {
        cmd.push(`-Xmx${(options.maxMemory)}M`);
    }
    if (options.ignoreInvalidMinecraftCertificates) {
        cmd.push("-Dfml.ignoreInvalidMinecraftCertificates=true");
    }
    if (options.ignorePatchDiscrepancies) {
        cmd.push("-Dfml.ignorePatchDiscrepancies=true");
    }
    if (options.yggdrasilAgent) {
        cmd.push(`-javaagent:${options.yggdrasilAgent.jar}=${options.yggdrasilAgent.server}`);
        cmd.push("-Dauthlibinjector.side=client");
        if (options.yggdrasilAgent.prefetched) {
            cmd.push(`-Dauthlibinjector.yggdrasil.prefetched=${options.yggdrasilAgent.prefetched}`);
        }
    }
    const jvmOptions = {
        natives_directory: nativeRoot,
        launcher_name: launcherName,
        launcher_version: launcherBrand,
        classpath: [
            ...version.libraries.filter((lib) => !(lib instanceof ResolvedNative)).map((lib) => mc.getLibraryByPath(lib.download.path)),
            mc.getVersionJar(version.minecraftVersion),
            ...(options.extraClassPaths || []),
        ].join(delimiter),
        library_directory: mc.getPath("libraries"),
        classpath_separator: delimiter,
        version_name: version.minecraftVersion,
        ...featureValues,
    };
    cmd.push(...jvmArguments.map((arg) => format(arg, jvmOptions)));
    // add extra jvm args
    if (options.extraJVMArgs instanceof Array) {
        if (options.extraJVMArgs.some((v) => typeof v !== "string")) {
            throw new TypeError("Require extraJVMArgs be all string!");
        }
        cmd.push(...options.extraJVMArgs);
    }
    else {
        // if options object already has `maxMemory` property, exclude the "-Xmx2G" option from the default extra jvm args
        if (options.maxMemory) {
            cmd.push(...DEFAULT_EXTRA_JVM_ARGS.filter((v) => v !== "-Xmx2G"));
        }
        else {
            cmd.push(...DEFAULT_EXTRA_JVM_ARGS);
        }
    }
    cmd.push(version.mainClass);
    const assetsDir = join(resourcePath, "assets");
    const resolution = options.resolution;
    const versionName = options.versionName || version.id;
    const versionType = options.versionType || version.type;
    const mcOptions = {
        version_name: versionName,
        version_type: versionType,
        assets_root: assetsDir,
        game_assets: join(assetsDir, "virtual", version.assets),
        assets_index_name: version.assets,
        game_directory: gamePath,
        auth_player_name: name,
        auth_uuid: id,
        auth_access_token: accessToken,
        user_properties: JSON.stringify(properties),
        user_type: userType,
        resolution_width: -1,
        resolution_height: -1,
        ...featureValues,
    };
    if (resolution) {
        mcOptions.resolution_width = resolution.width;
        mcOptions.resolution_height = resolution.height;
    }
    cmd.push(...gameArguments.map((arg) => format(arg, mcOptions)));
    if (options.extraMCArgs) {
        cmd.push(...options.extraMCArgs);
    }
    if (options.server) {
        cmd.push("--server", options.server.ip);
        if (options.server.port) {
            cmd.push("--port", options.server.port.toString());
        }
    }
    if (options.resolution && !cmd.find((a) => a === "--width")) {
        if (options.resolution.fullscreen) {
            cmd.push("--fullscreen");
        }
        else {
            if (options.resolution.height) {
                cmd.push("--height", options.resolution.height.toString());
            }
            if (options.resolution.width) {
                cmd.push("--width", options.resolution.width.toString());
            }
        }
    }
    return cmd;
}
/**
 * Truely normalize the launch argument.
 */
function normalizeArguments(args, platform, features) {
    return args.map((arg) => {
        if (typeof arg === "string") {
            return arg;
        }
        if (!Version.checkAllowed(arg.rules, platform, Object.keys(features))) {
            return "";
        }
        return arg.value;
    }).reduce((result, cur) => {
        if (cur instanceof Array) {
            result.push(...cur);
        }
        else if (cur) {
            result.push(cur);
        }
        return result;
    }, []);
}

/**
 * Diagnose a single file by a certain checksum algorithm. By default, this use sha1
 */
async function diagnoseFile({ file, expectedChecksum, role, hint, algorithm }) {
    let issue = false;
    let receivedChecksum = "";
    algorithm = algorithm !== null && algorithm !== void 0 ? algorithm : "sha1";
    const fileExisted = await exists(file);
    if (!fileExisted) {
        issue = true;
    }
    else if (expectedChecksum !== "") {
        receivedChecksum = await checksum(file, algorithm);
        issue = receivedChecksum !== expectedChecksum;
    }
    const type = fileExisted ? "corrupted" : "missing";
    if (issue) {
        return {
            type,
            role,
            file,
            expectedChecksum,
            receivedChecksum,
            hint,
        };
    }
    return undefined;
}
/**
 * Diagnose the version. It will check the version json/jar, libraries and assets.
 *
 * @param version The version id string
 * @param minecraft The minecraft location
 * @beta
 */
async function diagnose(version, minecraftLocation) {
    const minecraft = MinecraftFolder.from(minecraftLocation);
    let report = {
        minecraftLocation: minecraft,
        version: version,
        issues: [],
    };
    let issues = report.issues;
    let resolvedVersion;
    try {
        resolvedVersion = await Version.parse(minecraft, version);
    }
    catch (err) {
        const e = err;
        if (e.error === "CorruptedVersionJson") {
            issues.push({ type: "corrupted", role: "versionJson", file: minecraft.getVersionJson(e.version), expectedChecksum: "", receivedChecksum: "", hint: "Re-install the minecraft!" });
        }
        else {
            issues.push({ type: "missing", role: "versionJson", file: minecraft.getVersionJson(e.version), expectedChecksum: "", receivedChecksum: "", hint: "Re-install the minecraft!" });
        }
        return report;
    }
    const jarIssue = await diagnoseJar(resolvedVersion, minecraft);
    if (jarIssue) {
        report.issues.push(jarIssue);
    }
    const assetIndexIssue = await diagnoseAssetIndex(resolvedVersion, minecraft);
    if (assetIndexIssue) {
        report.issues.push(assetIndexIssue);
    }
    const librariesIssues = await diagnoseLibraries(resolvedVersion, minecraft);
    if (librariesIssues.length > 0) {
        report.issues.push(...librariesIssues);
    }
    if (!assetIndexIssue) {
        const objects = (await readFile(minecraft.getAssetsIndex(resolvedVersion.assets), "utf-8").then((b) => JSON.parse(b.toString()))).objects;
        const assetsIssues = await diagnoseAssets(objects, minecraft);
        if (assetsIssues.length > 0) {
            report.issues.push(...assetsIssues);
        }
    }
    return report;
}
/**
 * Diagnose assets currently installed.
 * @param assetObjects The assets object metadata to check
 * @param minecraft The minecraft location
 * @returns The diagnose report
 */
async function diagnoseAssets(assetObjects, minecraft) {
    const filenames = Object.keys(assetObjects);
    const issues = await Promise.all(filenames.map(async (filename) => {
        const { hash, size } = assetObjects[filename];
        const assetPath = minecraft.getAsset(hash);
        const issue = await diagnoseFile({ file: assetPath, expectedChecksum: hash, role: "asset", hint: "Problem on asset! Please consider to use Installer.installAssets to fix." });
        if (issue) {
            return Object.assign(issue, { asset: { name: filename, hash, size } });
        }
        return undefined;
    }));
    return issues.filter(isNotNull);
}
/**
 * Diagnose all libraries presented in this resolved version.
 *
 * @param resolvedVersion The resolved version to check
 * @param minecraft The minecraft location
 * @returns List of libraries issue
 * @see {@link ResolvedVersion}
 */
async function diagnoseLibraries(resolvedVersion, minecraft) {
    const issues = await Promise.all(resolvedVersion.libraries.map(async (lib) => {
        const libPath = minecraft.getLibraryByPath(lib.download.path);
        const issue = await diagnoseFile({ file: libPath, expectedChecksum: lib.download.sha1, role: "library", hint: "Problem on library! Please consider to use Installer.installLibraries to fix." });
        if (issue) {
            return Object.assign(issue, { library: lib });
        }
        return undefined;
    }));
    return issues.filter(isNotNull);
}
async function diagnoseAssetIndex(resolvedVersion, minecraft) {
    const assetsIndexPath = minecraft.getAssetsIndex(resolvedVersion.assets);
    const issue = await diagnoseFile({ file: assetsIndexPath, expectedChecksum: resolvedVersion.assetIndex.sha1, role: "assetIndex", hint: "Problem on assets index file! Please consider to use Installer.installAssets to fix." });
    if (issue) {
        return Object.assign(issue, { version: resolvedVersion.minecraftVersion });
    }
    return undefined;
}
async function diagnoseJar(resolvedVersion, minecraft) {
    const jarPath = minecraft.getVersionJar(resolvedVersion.minecraftVersion);
    const issue = await diagnoseFile({ file: jarPath, expectedChecksum: resolvedVersion.downloads.client.sha1, role: "minecraftJar", hint: "Problem on Minecraft jar! Please consider to use Installer.instalVersion to fix." });
    if (issue) {
        return Object.assign(issue, { version: resolvedVersion.minecraftVersion });
    }
    return undefined;
}

export { DEFAULT_EXTRA_JVM_ARGS, LaunchPrecheck, LibraryInfo, MinecraftFolder, MinecraftPath, ResolvedLibrary, ResolvedNative, Version, access as _access, exists as _exists, mkdir as _mkdir, pipeline as _pipeline, readFile as _readFile, writeFile as _writeFile, checksum, createMinecraftProcessWatcher, diagnose, diagnoseAssetIndex, diagnoseAssets, diagnoseFile, diagnoseJar, diagnoseLibraries, generateArguments, generateArgumentsServer, getPlatform, launch, launchServer };
//# sourceMappingURL=index.esm.js.map
