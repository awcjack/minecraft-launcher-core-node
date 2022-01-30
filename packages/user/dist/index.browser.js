import { v4 } from 'uuid';

const httpRequester = async (option) => {
    const url = new URL(option.url);
    let body = undefined;
    let headers = option.headers;
    if (option.body) {
        switch (option.bodyType || "json") {
            case "json":
                headers["Content-Type"] = "application/json";
                body = JSON.stringify(option.body);
                break;
            case "search":
                url.search = new URLSearchParams(option.body).toString();
                break;
            case "formMultiPart":
                body = new FormData();
                for (let [key, value] of body) {
                    if (value instanceof Uint8Array) {
                        value = new File([value], "", { type: "image/png" });
                    }
                    body.append(key, value);
                }
                break;
        }
    }
    const response = await fetch(url.toString(), {
        body,
        headers,
        method: option.method,
    });
    return {
        body: await response.text(),
        statusCode: response.status,
        statusMessage: response.statusText,
    };
};
async function verify(data, signature, pemKey) {
    function stringToBuffer(s) {
        const byteArray = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) {
            byteArray[i] = s.charCodeAt(i);
        }
        return byteArray;
    }
    const option = {
        name: "RSASSA-PKCS1-v1_5",
        hash: "sha1",
    };
    if (typeof pemKey === "string") {
        pemKey = pemKey.replace("\n", "")
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "");
        pemKey = atob(pemKey);
        pemKey = stringToBuffer(pemKey);
    }
    const key = await crypto.subtle.importKey("pkcs8", pemKey, option, false, ["verify"]);
    return crypto.subtle.verify(option, key, stringToBuffer(signature), stringToBuffer(data));
}
function decodeBase64(b) {
    return atob(b);
}

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var sha1Browser = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

// Adapted from Chris Veness' SHA1 code at
// http://www.movable-type.co.uk/scripts/sha1.html
function f(s, x, y, z) {
  switch (s) {
    case 0:
      return x & y ^ ~x & z;

    case 1:
      return x ^ y ^ z;

    case 2:
      return x & y ^ x & z ^ y & z;

    case 3:
      return x ^ y ^ z;
  }
}

function ROTL(x, n) {
  return x << n | x >>> 32 - n;
}

function sha1(bytes) {
  const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
  const H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

  if (typeof bytes === 'string') {
    const msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = [];

    for (let i = 0; i < msg.length; ++i) {
      bytes.push(msg.charCodeAt(i));
    }
  } else if (!Array.isArray(bytes)) {
    // Convert Array-like to Array
    bytes = Array.prototype.slice.call(bytes);
  }

  bytes.push(0x80);
  const l = bytes.length / 4 + 2;
  const N = Math.ceil(l / 16);
  const M = new Array(N);

  for (let i = 0; i < N; ++i) {
    const arr = new Uint32Array(16);

    for (let j = 0; j < 16; ++j) {
      arr[j] = bytes[i * 64 + j * 4] << 24 | bytes[i * 64 + j * 4 + 1] << 16 | bytes[i * 64 + j * 4 + 2] << 8 | bytes[i * 64 + j * 4 + 3];
    }

    M[i] = arr;
  }

  M[N - 1][14] = (bytes.length - 1) * 8 / Math.pow(2, 32);
  M[N - 1][14] = Math.floor(M[N - 1][14]);
  M[N - 1][15] = (bytes.length - 1) * 8 & 0xffffffff;

  for (let i = 0; i < N; ++i) {
    const W = new Uint32Array(80);

    for (let t = 0; t < 16; ++t) {
      W[t] = M[i][t];
    }

    for (let t = 16; t < 80; ++t) {
      W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    }

    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];

    for (let t = 0; t < 80; ++t) {
      const s = Math.floor(t / 20);
      const T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t] >>> 0;
      e = d;
      d = c;
      c = ROTL(b, 30) >>> 0;
      b = a;
      a = T;
    }

    H[0] = H[0] + a >>> 0;
    H[1] = H[1] + b >>> 0;
    H[2] = H[2] + c >>> 0;
    H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0;
  }

  return [H[0] >> 24 & 0xff, H[0] >> 16 & 0xff, H[0] >> 8 & 0xff, H[0] & 0xff, H[1] >> 24 & 0xff, H[1] >> 16 & 0xff, H[1] >> 8 & 0xff, H[1] & 0xff, H[2] >> 24 & 0xff, H[2] >> 16 & 0xff, H[2] >> 8 & 0xff, H[2] & 0xff, H[3] >> 24 & 0xff, H[3] >> 16 & 0xff, H[3] >> 8 & 0xff, H[3] & 0xff, H[4] >> 24 & 0xff, H[4] >> 16 & 0xff, H[4] >> 8 & 0xff, H[4] & 0xff];
}

var _default = sha1;
exports.default = _default;
});

var sha1 = unwrapExports(sha1Browser);

var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

function validate$1(uuid) {
  return typeof uuid === 'string' && REGEX.test(uuid);
}

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

var byteToHex = [];

for (var i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).substr(1));
}

function stringify(arr) {
  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!validate$1(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

function parse(uuid) {
  if (!validate$1(uuid)) {
    throw TypeError('Invalid UUID');
  }

  var v;
  var arr = new Uint8Array(16); // Parse ########-....-....-....-............

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

function stringToBytes(str) {
  str = unescape(encodeURIComponent(str)); // UTF8 escape

  var bytes = [];

  for (var i = 0; i < str.length; ++i) {
    bytes.push(str.charCodeAt(i));
  }

  return bytes;
}

var DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
var URL$1 = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
function v35 (name, version, hashfunc) {
  function generateUUID(value, namespace, buf, offset) {
    if (typeof value === 'string') {
      value = stringToBytes(value);
    }

    if (typeof namespace === 'string') {
      namespace = parse(namespace);
    }

    if (namespace.length !== 16) {
      throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
    } // Compute hash of namespace and value, Per 4.3
    // Future: Use spread syntax when supported on all platforms, e.g. `bytes =
    // hashfunc([...namespace, ... value])`


    var bytes = new Uint8Array(16 + value.length);
    bytes.set(namespace);
    bytes.set(value, namespace.length);
    bytes = hashfunc(bytes);
    bytes[6] = bytes[6] & 0x0f | version;
    bytes[8] = bytes[8] & 0x3f | 0x80;

    if (buf) {
      offset = offset || 0;

      for (var i = 0; i < 16; ++i) {
        buf[offset + i] = bytes[i];
      }

      return buf;
    }

    return stringify(bytes);
  } // Function#name is not settable on some platforms (#270)


  try {
    generateUUID.name = name; // eslint-disable-next-line no-empty
  } catch (err) {} // For CommonJS default export support


  generateUUID.DNS = DNS;
  generateUUID.URL = URL$1;
  return generateUUID;
}

const v5 = (s) => v35("", 50, sha1)(s, new (class A extends Array {
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
    return v4().replace(/-/g, "");
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

var GameProfile;
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
})(GameProfile || (GameProfile = {}));

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

var ProfileServiceAPI;
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
})(ProfileServiceAPI || (ProfileServiceAPI = {}));
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
        url: ProfileServiceAPI.getProfileUrl(api, uuid),
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
    let target = ProfileServiceAPI.getProfileByNameUrl(api, name);
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
    const urlString = ProfileServiceAPI.getTextureUrl(api, option.uuid, option.type);
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

export { AUTH_API_MOJANG, Authenticator, GameProfile, PROFILE_API_MOJANG, ProfileLookuper, ProfileServiceAPI, checkLocation, getChallenges, getTextures, invalidate, login, lookup, lookupByName, newToken, offline, refresh, responseChallenges, setTexture, signout, v5, validate };
//# sourceMappingURL=index.browser.js.map
