import custom from 'custom';

function falconScan() {
    try {
        return $falcon && $falcon.jsapi ? $falcon.jsapi.scan : null;
    } catch (_) {
        return null;
    }
}

function customScan() {
    try {
        return custom && custom.scan ? custom.scan : null;
    } catch (_) {
        return null;
    }
}

function hasApiError(result) {
    if (!result || typeof result !== 'object') return false;
    if (result.ok === false || result.success === false) return true;
    if (Object.prototype.hasOwnProperty.call(result, 'error')) return Number(result.error) !== 0;
    if (Object.prototype.hasOwnProperty.call(result, 'code')) return Number(result.code) !== 0;
    return false;
}

async function callFalcon(method, path) {
    const scan = falconScan();
    if (!scan || typeof scan[method] !== 'function') return null;
    try {
        const result = await scan[method]({ path: String(path || '') });
        return hasApiError(result) ? null : result;
    } catch (_) {
        return null;
    }
}

async function callCustom(method, path) {
    const scan = customScan();
    if (!scan || typeof scan[method] !== 'function') return null;
    try {
        const result = await scan[method](String(path || ''));
        return hasApiError(result) ? null : result;
    } catch (_) {
        return null;
    }
}

async function callScan(method, path) {
    const falconResult = await callFalcon(method, path);
    if (falconResult !== null && falconResult !== undefined) return falconResult;
    return callCustom(method, path);
}

function listFromResult(result) {
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.list)) return result.list;
    if (result && result.data && Array.isArray(result.data.list)) return result.data.list;
    return null;
}

function toDirents(list) {
    return list.map(item => {
        const isDir = typeof item.isDirectory === 'function' ? item.isDirectory() : !!item.isDir;
        return {
            name: String(item.name || ''),
            isDirectory() { return isDir; },
            isFile() { return !isDir; }
        };
    });
}

export async function readdir(path, options = {}) {
    const result = await callScan('listDir', path);
    const list = listFromResult(result);
    if (!list) throw new Error(`Cannot read directory: ${path}`);
    const dirents = toDirents(list);
    return options && options.withFileTypes ? dirents : dirents.map(item => item.name);
}

export async function stat(path) {
    const result = await callScan('fileInfo', path);
    const info = result && result.data ? result.data : (result && result.info ? result.info : result);
    if (!info || hasApiError(info) || info.exists === false) throw new Error(`File does not exist: ${path}`);
    const isDir = !!info.isDir;
    return {
        size: Number(info.size || 0),
        mtimeMs: Number(info.mtimeMs || info.mtime || 0) * (info.mtimeMs ? 1 : 1000),
        isDirectory() { return isDir; },
        isFile() { return !isDir; }
    };
}

export async function exists(path) {
    const result = await callScan('exists', path);
    if (typeof result === 'boolean') return result;
    if (result && typeof result.exists === 'boolean') return result.exists;
    if (result && result.data && typeof result.data.exists === 'boolean') return result.data.exists;
    return false;
}

function operationOk(result) {
    if (typeof result === 'boolean') return result;
    if (result && typeof result.ok === 'boolean') return result.ok;
    if (result && result.data && typeof result.data.ok === 'boolean') return result.data.ok;
    return false;
}

export async function mkdir(path) {
    const result = await callScan('mkdirs', path);
    return operationOk(result) || await exists(path);
}

export async function rm(path) {
    if (!(await exists(path))) return true;
    const info = await stat(path);
    const method = info.isDirectory() ? 'rmdir' : 'removeFile';
    return operationOk(await callScan(method, path)) || !(await exists(path));
}

export async function readFile(path) {
    const result = await callCustom('readText', path);
    if (typeof result === 'string') return result;
    throw new Error(`Cannot read file: ${path}`);
}

export default { readdir, stat, exists, mkdir, rm, readFile };
