import custom from 'custom';

let httpApi = null;

function getHttp() {
    if (httpApi) return httpApi;
    try {
        if ($falcon && $falcon.jsapi) {
            httpApi = $falcon.jsapi.net || $falcon.jsapi.http || null;
        }
    } catch (_) {
        httpApi = null;
    }
    return httpApi;
}

function normalizeHeaders(headers) {
    if (!headers) return {};
    if (!Array.isArray(headers)) return headers;
    const result = {};
    headers.forEach(header => {
        if (typeof header !== 'string') return;
        const separator = header.indexOf(':');
        if (separator <= 0) return;
        result[header.slice(0, separator).trim()] = header.slice(separator + 1).trim();
    });
    return result;
}

function byteArray(value) {
    if (value === null || value === undefined) return null;
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    if (value && value.buffer instanceof ArrayBuffer && typeof value.length === 'number') {
        return new Uint8Array(value.buffer, value.byteOffset || 0, value.byteLength || value.length);
    }
    if (value && value.subarray && typeof value.length === 'number') return value;
    if (Array.isArray(value)) return new Uint8Array(value);
    if (value && Array.isArray(value.data)) return new Uint8Array(value.data);
    return null;
}

function isEmptyPayload(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    const bytes = byteArray(value);
    if (bytes) return bytes.length === 0;
    return false;
}

// X5 firmware versions have returned the response payload as body, data,
// {data: ...}, or a Buffer-like object. Prefer a non-empty payload and unwrap
// those containers before decoding so a successful response is not parsed as ''.
function payloadValue(response) {
    let current = response;
    for (let depth = 0; depth < 5; depth++) {
        if (typeof current === 'string' || byteArray(current)) return current;
        if (!current || typeof current !== 'object') return current;
        let fallback;
        const keys = ['body', 'data', 'content', 'result', 'response'];
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (!Object.prototype.hasOwnProperty.call(current, key)) continue;
            const candidate = current[key];
            if (fallback === undefined) fallback = candidate;
            if (!isEmptyPayload(candidate)) {
                current = candidate;
                break;
            }
            if (i === keys.length - 1) current = fallback;
        }
        if (current === response) return '';
    }
    return current;
}

function utf8Decode(value) {
    if (typeof value === 'string') return value;
    const bytes = byteArray(value);
    if (!bytes) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') {
            try { return JSON.stringify(value); } catch (_) { return String(value); }
        }
        return String(value);
    }
    let result = '';
    for (let i = 0; i < bytes.length;) {
        const first = bytes[i];
        if (first < 0x80) {
            result += String.fromCharCode(first);
            i += 1;
        } else if (first < 0xe0 && i + 1 < bytes.length) {
            result += String.fromCharCode(((first & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
            i += 2;
        } else if (first < 0xf0 && i + 2 < bytes.length) {
            result += String.fromCharCode(((first & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | ((bytes[i + 2] & 0x3f)));
            i += 3;
        } else if (i + 3 < bytes.length) {
            const codePoint = ((first & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) |
                ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f);
            const adjusted = codePoint - 0x10000;
            result += String.fromCharCode(0xd800 + (adjusted >> 10), 0xdc00 + (adjusted & 0x3ff));
            i += 4;
        } else {
            i += 1;
        }
    }
    return result;
}

function timeoutValues(timeout, fallbackMs) {
    const ms = Number(timeout || fallbackMs);
    return { ms, native: ms > 1000 ? Math.ceil(ms / 1000) : ms };
}

function runRequest(options, filename) {
    return new Promise((resolve, reject) => {
        const http = getHttp();
        if (!http || typeof http.request !== 'function') {
            reject(new Error('X5 HTTP API is unavailable'));
            return;
        }

        const timeout = timeoutValues(options.timeout, filename ? 30000 : 15000);
        let finished = false;
        let timer = null;
        const complete = (fn, value) => {
            if (finished) return;
            finished = true;
            if (timer) clearTimeout(timer);
            fn(value);
        };

        const requestHeaders = normalizeHeaders(options.headers);
        const params = {
            url: options.url,
            method: options.method || 'GET',
            // X5 firmware variants disagree on the option name; send both aliases.
            headers: requestHeaders,
            header: requestHeaders,
            data: options.data,
            timeout: timeout.native
        };
        if (filename) params.filename = filename;

        try {
            Promise.resolve(http.request(params)).then(
                value => complete(resolve, value),
                error => complete(reject, new Error(String(error)))
            );
        } catch (error) {
            complete(reject, error);
        }

        timer = setTimeout(() => complete(reject, new Error(`HTTP timeout: ${options.url}`)), timeout.ms + 5000);
    });
}

function responseStatus(response) {
    return Number(response && (response.status || response.statusCode) || 0);
}

function responseHeaders(response) {
    return response && response.headers || {};
}

export async function request(options) {
    const response = await runRequest(options);
    return {
        body: utf8Decode(payloadValue(response)),
        status: responseStatus(response),
        statusCode: Number(response && (response.statusCode || response.status) || 0),
        headers: responseHeaders(response)
    };
}

function nativeJmDownloader() {
    try {
        return custom && custom.jm && typeof custom.jm.downloadImage === 'function'
            ? custom.jm
            : null;
    } catch (_) {
        return null;
    }
}

export async function download(options) {
    if (!options.outPath) throw new Error('download requires outPath');

    // X5 firmware accepts the request but ignores filename/outPath. The
    // bundled custom.jm native client writes the binary response itself and
    // is the reliable path on the translation pen.
    const jm = nativeJmDownloader();
    if (jm) {
        const timeout = timeoutValues(options.timeout, 30000);
        const timeoutSec = Math.max(10, Math.ceil(timeout.ms / 1000));
        // Source-specific code owns CDN fallback; disable the native module's stale host list.
        const result = await Promise.resolve(jm.downloadImage(
            String(options.url || ''), String(options.outPath), timeoutSec, 0
        ));
        if (!result || result.ok !== true) {
            const message = result && result.message ? result.message : 'native JM download failed';
            throw new Error(message);
        }
        return {
            status: 200,
            statusCode: 200,
            headers: {},
            size: Number(result.size || 0)
        };
    }

    const response = await runRequest(options, options.outPath);
    return {
        status: responseStatus(response),
        statusCode: Number(response && (response.statusCode || response.status) || 0),
        headers: responseHeaders(response),
        size: Number(response && (response.size || response.length) || 0)
    };
}

export default { request, download };
