'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var uuid = require('uuid');
var http = require('http');
var https = require('https');
var crypto = require('crypto');
var FormData = require('form-data');
var url = require('url');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);
var FormData__default = /*#__PURE__*/_interopDefaultLegacy(FormData);

const httpRequester = async (option) => {
    let headers = { ...option.headers };
    let requestOption = {
        method: option.method,
        headers,
    };
    let url$1 = new url.URL(option.url);
    let body;
    if (option.body) {
        switch (option.bodyType) {
            case "json":
                headers["Content-Type"] = "application/json";
                body = Buffer.from(JSON.stringify(option.body), "utf-8");
                break;
            case "search":
                for (let [key, value] of Object.entries(option.body)) {
                    url$1.searchParams.append(key, value);
                }
                break;
            case "formMultiPart":
                let form = new FormData__default["default"]();
                for (let [key, value] of Object.entries(option.body)) {
                    if (typeof value === "string") {
                        form.append(key, value);
                    }
                    else {
                        form.append(key, value.value, { contentType: value.type });
                    }
                }
                headers = { ...headers, ...form.getHeaders() };
                body = form.getBuffer();
                break;
        }
        requestOption.headers = headers;
    }
    return new Promise((resolve, reject) => {
        function handleMessage(message) {
            let buffers = [];
            message.on("data", (buf) => { buffers.push(buf); });
            message.on("end", () => {
                resolve({
                    body: Buffer.concat(buffers).toString("utf-8"),
                    statusCode: message.statusCode || -1,
                    statusMessage: message.statusMessage || "",
                });
            });
            message.on("error", reject);
        }
        let req;
        if (url$1.protocol === "https:") {
            req = https.request(url$1, requestOption, handleMessage);
        }
        else if (url$1.protocol === "http:") {
            req = http.request(url$1, requestOption, handleMessage);
        }
        else {
            reject(new Error(`Unsupported protocol ${url$1.protocol}`));
            return;
        }
        req.on("error", reject);
        if (body) {
            req.write(body);
        }
        req.end();
    });
};
async function verify(data, signature, pemKey) {
    return crypto.createVerify("SHA1").update(data, "utf8").verify(pemKey, signature, "base64");
}
function decodeBase64(s) {
    return Buffer.from(s, "base64").toString();
}

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var sha1_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _crypto = _interopRequireDefault(crypto__default["default"]);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function sha1(bytes) {
  if (Array.isArray(bytes)) {
    bytes = Buffer.from(bytes);
  } else if (typeof bytes === 'string') {
    bytes = Buffer.from(bytes, 'utf8');
  }

  return _crypto.default.createHash('sha1').update(bytes).digest();
}

var _default = sha1;
exports.default = _default;
});

var sha1 = unwrapExports(sha1_1);

var regex = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
exports.default = _default;
});

unwrapExports(regex);

var require$$0$2 = regex;

var validate_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _regex = _interopRequireDefault(require$$0$2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validate(uuid) {
  return typeof uuid === 'string' && _regex.default.test(uuid);
}

var _default = validate;
exports.default = _default;
});

unwrapExports(validate_1);

var require$$0$1 = validate_1;

var stringify_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validate = _interopRequireDefault(require$$0$1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
const byteToHex = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).substr(1));
}

function stringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  const uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

var _default = stringify;
exports.default = _default;
});

unwrapExports(stringify_1);

var parse_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validate = _interopRequireDefault(require$$0$1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parse(uuid) {
  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Invalid UUID');
  }

  let v;
  const arr = new Uint8Array(16); // Parse ########-....-....-....-............

  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = v >>> 16 & 0xff;
  arr[2] = v >>> 8 & 0xff;
  arr[3] = v & 0xff; // Parse ........-####-....-....-............

  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v & 0xff; // Parse ........-....-####-....-............

  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v & 0xff; // Parse ........-....-....-####-............

  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v & 0xff; // Parse ........-....-....-....-############
  // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)

  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000 & 0xff;
  arr[11] = v / 0x100000000 & 0xff;
  arr[12] = v >>> 24 & 0xff;
  arr[13] = v >>> 16 & 0xff;
  arr[14] = v >>> 8 & 0xff;
  arr[15] = v & 0xff;
  return arr;
}

var _default = parse;
exports.default = _default;
});

unwrapExports(parse_1);

var require$$0 = stringify_1;

var require$$1 = parse_1;

var v35 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
exports.URL = exports.DNS = void 0;

var _stringify = _interopRequireDefault(require$$0);

var _parse = _interopRequireDefault(require$$1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function stringToBytes(str) {
  str = unescape(encodeURIComponent(str)); // UTF8 escape

  const bytes = [];

  for (let i = 0; i < str.length; ++i) {
    bytes.push(str.charCodeAt(i));
  }

  return bytes;
}

const DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
exports.DNS = DNS;
const URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
exports.URL = URL;

function _default(name, version, hashfunc) {
  function generateUUID(value, namespace, buf, offset) {
    if (typeof value === 'string') {
      value = stringToBytes(value);
    }

    if (typeof namespace === 'string') {
      namespace = (0, _parse.default)(namespace);
    }

    if (namespace.length !== 16) {
      throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
    } // Compute hash of namespace and value, Per 4.3
    // Future: Use spread syntax when supported on all platforms, e.g. `bytes =
    // hashfunc([...namespace, ... value])`


    let bytes = new Uint8Array(16 + value.length);
    bytes.set(namespace);
    bytes.set(value, namespace.length);
    bytes = hashfunc(bytes);
    bytes[6] = bytes[6] & 0x0f | version;
    bytes[8] = bytes[8] & 0x3f | 0x80;

    if (buf) {
      offset = offset || 0;

      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = bytes[i];
      }

      return buf;
    }

    return (0, _stringify.default)(bytes);
  } // Function#name is not settable on some platforms (#270)


  try {
    generateUUID.name = name; // eslint-disable-next-line no-empty
  } catch (err) {} // For CommonJS default export support


  generateUUID.DNS = DNS;
  generateUUID.URL = URL;
  return generateUUID;
}
});

var v35$1 = unwrapExports(v35);
v35.URL;
v35.DNS;

const v5 = (s) => v35$1("", 50, sha1)(s, new (class A extends Array {
    concat(o) { return o; }
})(16));
const loginPayload = (clientToken, option) => ({
    agent: { name: "Minecraft", version: 1 },
    requestUser: "requestUser" in option ? option.requestUser : true,
    clientToken,
    username: option.username,
    password: option.password,
});
const refreshPayload = (clientToken, option) => ({
    clientToken,
    accessToken: option.accessToken,
    requestUser: typeof option.requestUser === "boolean" ? option.requestUser : false,
});
/**
 * Random generate a new token by uuid v4. It can be client or auth token.
 * @returns a new token
 */
function newToken() {
    return uuid.v4().replace(/-/g, "");
}
class Authenticator {
    /**
     * Create a client for `Yggdrasil` service, given API and clientToken.
     * @param clientToken The client token uuid. It will generate a new one if it's absent.
     * @param api The api for this client.
     */
    constructor(clientToken, api) {
        this.clientToken = clientToken;
        this.api = api;
    }
    post(endpoint, payload) {
        return post(this.api.hostName + endpoint, payload);
    }
    /**
     * Login to the server by username and password. Notice that the auth server usually have the cooldown time for login.
     * You have to wait for about a minute after one approch of login, to login again.
     *
     * @param option The login options, contains the username, password
     * @throws This may throw the error object with `statusCode`, `statusMessage`, `type` (error type), and `message`
     */
    login(option) {
        return this.post(this.api.authenticate, loginPayload(this.clientToken, option));
    }
    /**
     * Determine whether the access/client token pair is valid.
     *
     * @param option The access token
     */
    validate(option) {
        return this.post(this.api.validate, {
            clientToken: this.clientToken,
            accessToken: option.accessToken,
        }).then(() => true, () => false);
    }
    /**
     * Invalidate an access token and client token
     *
     * @param option The tokens
     */
    invalidate(option) {
        return this.post(this.api.invalidate, {
            clientToken: this.clientToken,
            accessToken: option.accessToken,
        }).then(() => { });
    }
    /**
     * Refresh the current access token with specific client token.
     * Notice that the client token and access token must match.
     *
     * You can use this function to get a new token when your old token is expired.
     *
     * @param option The access token
     */
    refresh(option) {
        return this.post(this.api.refresh, refreshPayload(this.clientToken, option));
    }
    signout(option) {
        return this.post(this.api.signout, {
            username: option.username,
            password: option.password,
        }).then(() => { });
    }
}
/**
 * The default Mojang API
 */
const AUTH_API_MOJANG = {
    hostName: "https://authserver.mojang.com",
    authenticate: "/authenticate",
    refresh: "/refresh",
    validate: "/validate",
    invalidate: "/invalidate",
    signout: "/signout",
};
function post(url, payload) {
    return httpRequester({
        url,
        method: "POST",
        body: payload,
        headers: {},
        bodyType: "json",
    }).then(({ statusCode, body, statusMessage }) => {
        try {
            if (statusCode >= 200 && statusCode < 300) {
                if (!body) {
                    return undefined;
                }
                return JSON.parse(body);
            }
            else {
                const errorBody = JSON.parse(body);
                const err = {
                    ...errorBody,
                    error: typeof errorBody.error === "string" ? errorBody.error : "General",
                    statusCode,
                    statusMessage,
                };
                throw err;
            }
        }
        catch (e) {
            if (typeof e.error === "string") {
                throw e;
            }
            throw {
                error: "General",
                statusCode,
                statusMessage,
                body,
            };
        }
    });
}
/**
 * Login to the server by username and password. Notice that the auth server usually have the cooldown time for login.
 * You have to wait for about a minute after one approch of login, to login again.
 *
 * @param option The login options, contains the username, password and clientToken
 * @param api The API of the auth server
 * @throws This may throw the error object with `statusCode`, `statusMessage`, `type` (error type), and `message`
 */
async function login(option, api = AUTH_API_MOJANG) {
    return post(api.hostName + api.authenticate, loginPayload(option.clientToken || newToken(), option));
}
/**
 * Refresh the current access token with specific client token.
 * Notice that the client token and access token must match.
 *
 * You can use this function to get a new token when your old token is expired.
 *
 * @param option The tokens
 * @param api The API of the auth server
 */
function refresh(option, api = AUTH_API_MOJANG) {
    return post(api.hostName + api.refresh, refreshPayload(option.clientToken, option));
}
/**
 * Determine whether the access/client token pair is valid.
 *
 * @param option The tokens
 * @param api The API of the auth server
 */
async function validate(option, api = AUTH_API_MOJANG) {
    try {
        await post(api.hostName + api.validate, {
            accessToken: option.accessToken,
            clientToken: option.clientToken,
        });
        return true;
    }
    catch (e) {
        return false;
    }
}
/**
 * Invalidate an access/client token pair
 *
 * @param option The tokens
 * @param api The API of the auth server
 */
async function invalidate(option, api = AUTH_API_MOJANG) {
    await post(api.hostName + api.invalidate, {
        accessToken: option.accessToken,
        clientToken: option.clientToken,
    });
}
/**
 * Signout user by username and password
 *
 * @param option The username and password
 * @param api The API of the auth server
 */
async function signout(option, api = AUTH_API_MOJANG) {
    await post(api.hostName + api.signout, {
        username: option.username,
        password: option.password,
    });
}
/**
 * Create an offline auth. It'll ensure the user game profile's `uuid` is the same for the same `username`.
 *
 * @param username The username you want to have in-game.
 */
function offline(username) {
    const prof = {
        id: v5(username).replace(/-/g, ""),
        name: username,
    };
    return {
        accessToken: newToken(),
        clientToken: newToken(),
        selectedProfile: prof,
        availableProfiles: [prof],
        user: {
            id: v5(username),
            username: username,
        },
    };
}

exports.GameProfile = void 0;
(function (GameProfile) {
    (function (Texture) {
        function isSlim(o) {
            return o.metadata ? o.metadata.model === "slim" : false;
        }
        Texture.isSlim = isSlim;
        function getModelType(o) {
            return isSlim(o) ? "slim" : "steve";
        }
        Texture.getModelType = getModelType;
    })(GameProfile.Texture || (GameProfile.Texture = {}));
})(exports.GameProfile || (exports.GameProfile = {}));

// export enum Status {
//     GREEN, YELLOW, RED,
// }
// /**
//  * Get the all mojang server statuses
//  *
//  * @param provider
//  */
// export async function getServiceStatus(): Promise<{ [server: string]: Status }> {
//     const { body } = await request({
//         url: "https://status.mojang.com/check", method: "GET",
//         headers: {}
//     });
//     return JSON.parse(body).reduce((a: any, b: any) => Object.assign(a, b), {});
// }
/**
 * Check if user need to verify its identity. If this return false, should perform such operations:
 * 1. call `getChallenges` get all questions
 * 2. let user response questions
 * 3. call `responseChallenges` to send user responsed questions, if false, redo `2` step.
 *
 * If you don't let user response challenges when this return false. You won't be able to get/set user texture from Mojang server.
 *
 * *(This only work for Mojang account. Third party definitly doesn't have such thing)*
 * @param accessToken You user access token.
 */
async function checkLocation(accessToken) {
    // "ForbiddenOperationException";
    // "Current IP is not secured";
    const { statusCode } = await httpRequester({
        url: "https://api.mojang.com/user/security/location",
        method: "GET",
        headers: { Authorization: `Bearer: ${accessToken}` },
    });
    return statusCode === 204;
}
/**
 * Get the user set challenge to response.
 *
 * @param accessToken The user access token
 * @returns User pre-defined questions
 */
async function getChallenges(accessToken) {
    const { body, statusCode, statusMessage } = await httpRequester({
        url: "https://api.mojang.com/user/security/challenges",
        method: "GET",
        headers: { Authorization: `Bearer: ${accessToken}` },
    });
    if (statusCode < 200 || statusCode >= 300) {
        throw { error: "General", statusCode, statusMessage };
    }
    const challenges = JSON.parse(body);
    return challenges;
}
/**
 * Response the challeges from `getChallenges`.
 *
 * @param accessToken The access token
 * @param responses Your responses
 * @returns True for correctly responsed all questions
 */
async function responseChallenges(accessToken, responses) {
    const { statusCode } = await httpRequester({
        url: "https://api.mojang.com/user/security/location",
        method: "POST",
        body: responses,
        bodyType: "json",
        headers: { Authorization: `Bearer: ${accessToken}` },
    });
    return statusCode >= 200 && statusCode < 300;
}

exports.ProfileServiceAPI = void 0;
(function (ProfileServiceAPI) {
    /**
     * Replace `${uuid}` string into uuid param
     * @param api The api
     * @param uuid The uuid will be replaced
     */
    function getProfileUrl(api, uuid) {
        return api.profile.replace("${uuid}", uuid);
    }
    ProfileServiceAPI.getProfileUrl = getProfileUrl;
    /**
     * Replace `${name}` string into name param
     * @param api The api
     * @param name The name will be replaced
     */
    function getProfileByNameUrl(api, name) {
        return api.profileByName.replace("${name}", name);
    }
    ProfileServiceAPI.getProfileByNameUrl = getProfileByNameUrl;
    /**
     * Replace uuid string into `${uuid}`, and type string into `${type}`
     * @param api The api
     * @param uuid The uuid string
     * @param type The type string
     */
    function getTextureUrl(api, uuid, type) {
        return api.texture.replace("${uuid}", uuid).replace("${type}", type);
    }
    ProfileServiceAPI.getTextureUrl = getTextureUrl;
})(exports.ProfileServiceAPI || (exports.ProfileServiceAPI = {}));
/**
 * The default Mojang API
 */
const PROFILE_API_MOJANG = {
    publicKey: `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAylB4B6m5lz7jwrcFz6Fd
/fnfUhcvlxsTSn5kIK/2aGG1C3kMy4VjhwlxF6BFUSnfxhNswPjh3ZitkBxEAFY2
5uzkJFRwHwVA9mdwjashXILtR6OqdLXXFVyUPIURLOSWqGNBtb08EN5fMnG8iFLg
EJIBMxs9BvF3s3/FhuHyPKiVTZmXY0WY4ZyYqvoKR+XjaTRPPvBsDa4WI2u1zxXM
eHlodT3lnCzVvyOYBLXL6CJgByuOxccJ8hnXfF9yY4F0aeL080Jz/3+EBNG8RO4B
yhtBf4Ny8NQ6stWsjfeUIvH7bU/4zCYcYOq4WrInXHqS8qruDmIl7P5XXGcabuzQ
stPf/h2CRAUpP/PlHXcMlvewjmGU6MfDK+lifScNYwjPxRo4nKTGFZf/0aqHCh/E
AsQyLKrOIYRE0lDG3bzBh8ogIMLAugsAfBb6M3mqCqKaTMAf/VAjh5FFJnjS+7bE
+bZEV0qwax1CEoPPJL1fIQjOS8zj086gjpGRCtSy9+bTPTfTR/SJ+VUB5G2IeCIt
kNHpJX2ygojFZ9n5Fnj7R9ZnOM+L8nyIjPu3aePvtcrXlyLhH/hvOfIOjPxOlqW+
O5QwSFP4OEcyLAUgDdUgyW36Z5mB285uKW/ighzZsOTevVUG2QwDItObIV6i8RCx
FbN2oDHyPaO5j1tTaBNyVt8CAwEAAQ==
-----END PUBLIC KEY-----`,
    texture: "https://api.mojang.com/user/profile/${uuid}/${type}",
    profile: "https://sessionserver.mojang.com/session/minecraft/profile/${uuid}",
    profileByName: "https://api.mojang.com/users/profiles/minecraft/${name}",
};
/**
 * Get all the textures of this GameProfile and cache them.
 *
 * @param profile The game profile from the profile service
 * @param cache Should we cache the texture into url? Default is `true`.
 */
function getTextures(profile) {
    if (!profile.properties || !profile.properties.textures) {
        return undefined;
    }
    const content = decodeBase64(profile.properties.textures);
    return JSON.parse(content);
}
/**
 * Fetch the GameProfile by uuid.
 *
 * @param uuid The unique id of user/player
 * @param option the options for this function
 */
async function lookup(uuid, option = {}) {
    const api = option.api || PROFILE_API_MOJANG;
    const unsigned = "unsigned" in option ? option.unsigned : !api.publicKey;
    const { body, statusCode, statusMessage, } = await httpRequester({
        url: exports.ProfileServiceAPI.getProfileUrl(api, uuid),
        method: "GET",
        headers: {},
        body: { unsigned },
        bodyType: "search",
    });
    if (statusCode !== 200) {
        throw {
            error: "General",
            statusCode,
            statusMessage,
        };
    }
    const o = JSON.parse(body);
    if (o.properties && o.properties instanceof Array) {
        const properties = o.properties;
        const to = {};
        for (const prop of properties) {
            if (prop.signature && api.publicKey && !await verify(prop.value, prop.signature, api.publicKey)) {
                console.warn(`Discard corrupted prop ${prop.name}: ${prop.value} as the signature mismatched!`);
            }
            else {
                to[prop.name] = prop.value;
            }
        }
        o.properties = to;
    }
    return o;
}
/**
 * Look up the GameProfile by username in game.
 * This will return the UUID of the name at the timestamp provided.
 * `?at=0` can be used to get the UUID of the original user of that username, but, it only works if the name was changed at least once, or if the account is legacy.

 * The timestamp is a UNIX timestamp (without milliseconds)
 * When the at parameter is not sent, the current time is used
 * @param name The username in game.
 * @param option the options of this function
 * @throws ProfileLookupException
 */
function lookupByName(name, option = {}) {
    const api = option.api || PROFILE_API_MOJANG;
    const time = option.timestamp || 0;
    let target = exports.ProfileServiceAPI.getProfileByNameUrl(api, name);
    let form;
    if (time) {
        form = { at: (time / 1000) };
    }
    return httpRequester({
        url: target,
        method: "GET",
        headers: {},
        body: form,
        bodyType: "search",
    }).then(({ statusCode, statusMessage, body }) => {
        if (statusCode === 200) {
            return JSON.parse(body);
        }
        else if (statusCode === 204) {
            throw {
                error: "NoPlayerFoundException",
                errorMessage: "",
                statusCode,
                statusMessage
            };
        }
        else {
            let errorBody;
            try {
                errorBody = JSON.parse(body);
            }
            catch (_a) {
                errorBody = {};
            }
            throw {
                error: errorBody.error || "General",
                errorMessage: errorBody.errorMessage,
                statusCode,
                statusMessage
            };
        }
    });
}
/**
 * Set texture by access token and uuid.
 * If the texture is undefined, it will clear the texture to default steve.
 */
async function setTexture(option, api = PROFILE_API_MOJANG) {
    var _a, _b;
    const urlString = exports.ProfileServiceAPI.getTextureUrl(api, option.uuid, option.type);
    const headers = {
        Authorization: `Bearer: ${option.accessToken}`
    };
    if (!option.texture) {
        // delete texture
        await httpRequester({
            url: urlString,
            method: "DELETE",
            headers,
        });
    }
    else if ("data" in option.texture) {
        // upload texture
        await httpRequester({
            url: urlString,
            method: "PUT",
            body: {
                model: ((_a = option.texture.metadata) === null || _a === void 0 ? void 0 : _a.model) || "",
                file: { type: "image/png", value: option.texture.data },
            },
            bodyType: "formMultiPart",
            headers,
        });
    }
    else if ("url" in option.texture) {
        // set texture
        await httpRequester({
            url: urlString,
            method: "POST",
            body: {
                model: ((_b = option.texture.metadata) === null || _b === void 0 ? void 0 : _b.model) || "",
                url: option.texture.url,
            },
            bodyType: "search",
            headers,
        });
    }
    else {
        throw new Error("Illegal Option Format!");
    }
}
/**
 * A lookuper will maintain your last time of lookup. It will prevent the lookup frequency exceed the rate limit
 */
class ProfileLookuper {
    constructor(api, 
    /**
     * The rate limit of this lookuper
     */
    rateLimit = 6000) {
        this.api = api;
        this.rateLimit = rateLimit;
        this.lookupRecord = {};
    }
    lookup(uuid) {
        const now = Date.now();
        const api = this.api;
        const rateLimit = this.rateLimit;
        const lastLookup = this.lookupRecord[uuid];
        if (!lastLookup) {
            // never lookup
            this.lookupRecord[uuid] = {
                deferredLookup: undefined,
                lastLookupTime: Date.now(),
            };
            return lookup(uuid, { api });
        }
        let lastLookupTime = lastLookup.lastLookupTime;
        let deferredLookup = lastLookup.deferredLookup;
        if (now - lastLookupTime < rateLimit) {
            // lookup too freq
            if (!deferredLookup) {
                // no one looked
                deferredLookup = new Promise((resolve) => {
                    setTimeout(() => {
                        this.lookupRecord[uuid] = {
                            deferredLookup: undefined,
                            lastLookupTime: Date.now(),
                        };
                        resolve(lookup(uuid, { api }));
                    }, (now - lastLookupTime - rateLimit));
                });
            }
            lastLookup.deferredLookup = deferredLookup;
            return deferredLookup;
        }
        // not too freq, update the look up time
        lastLookup.lastLookupTime = Date.now();
        return lookup(uuid, { api });
    }
}

exports.AUTH_API_MOJANG = AUTH_API_MOJANG;
exports.Authenticator = Authenticator;
exports.PROFILE_API_MOJANG = PROFILE_API_MOJANG;
exports.ProfileLookuper = ProfileLookuper;
exports.checkLocation = checkLocation;
exports.getChallenges = getChallenges;
exports.getTextures = getTextures;
exports.invalidate = invalidate;
exports.login = login;
exports.lookup = lookup;
exports.lookupByName = lookupByName;
exports.newToken = newToken;
exports.offline = offline;
exports.refresh = refresh;
exports.responseChallenges = responseChallenges;
exports.setTexture = setTexture;
exports.signout = signout;
exports.v5 = v5;
exports.validate = validate;
//# sourceMappingURL=index.js.map
