const defaults = {
    scale: 0.65,
    hidableSidebar: false,
    isDebug: false,
    readingMode: 'continuous'
};

const writeQueues = Object.create(null);

function enqueueWrite(key, task) {
    const previous = writeQueues[key] || Promise.resolve();
    const current = previous.then(task, task);
    writeQueues[key] = current.catch(() => false);
    return current;
}

function nowText() {
    const now = new Date();
    const pad = value => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function nodeKey(node) {
    if (!node) return '';
    return String(node.path || node.id || node.name || '');
}

function getStorageApi() {
    try {
        if (typeof $falcon === 'undefined' || !$falcon.jsapi) return null;
        return $falcon.jsapi.storage || null;
    } catch (error) {
        return null;
    }
}

function hasApiError(result) {
    if (!result || typeof result !== 'object') return false;
    if (Object.prototype.hasOwnProperty.call(result, 'error')) {
        return Number(result.error) !== 0;
    }
    if (Object.prototype.hasOwnProperty.call(result, 'code')) {
        return Number(result.code) !== 0;
    }
    return false;
}

function unwrapValue(result) {
    if (hasApiError(result)) return null;
    if (result && typeof result === 'object' && Object.prototype.hasOwnProperty.call(result, 'value')) {
        return result.value;
    }
    if (result && typeof result === 'object' && Object.prototype.hasOwnProperty.call(result, 'data')) {
        return result.data;
    }
    return result;
}

export default class Storage {
    async _get(key) {
        try {
            const api = getStorageApi();
            if (!api) return null;

            let result;
            if (typeof api.getItem === 'function') {
                result = await api.getItem({ key });
            } else if (typeof api.getStorage === 'function') {
                result = await api.getStorage({ key });
            } else {
                return null;
            }

            const value = unwrapValue(result);
            if (value === undefined || value === null || value === '') return null;
            return typeof value === 'string' ? JSON.parse(value) : value;
        } catch (error) {
            return null;
        }
    }

    async _set(key, value) {
        try {
            const api = getStorageApi();
            if (!api) return false;
            const data = JSON.stringify(value);

            let result;
            if (typeof api.setItem === 'function') {
                result = await api.setItem({ key, value: data });
            } else if (typeof api.setStorage === 'function') {
                result = await api.setStorage({ key, data });
            } else {
                return false;
            }
            return !hasApiError(result);
        } catch (error) {
            return false;
        }
    }

    async addItem(node, progress, target = 'history') {
        return enqueueWrite(target, async () => {
            const key = nodeKey(node);
            let items = await this.getAllItems(target);
            items = items.filter(item => nodeKey(item.node) !== key);
            items.push({ node, progress: progress || {}, time: nowText() });
            if (items.length > 80) items = items.slice(items.length - 80);
            return this._set(target, items);
        });
    }

    async removeItem(node, target = 'history') {
        return enqueueWrite(target, async () => {
            const key = nodeKey(node);
            const items = (await this.getAllItems(target)).filter(item => nodeKey(item.node) !== key);
            return this._set(target, items);
        });
    }

    async getItem(node, target = 'history') {
        const key = nodeKey(node);
        const item = (await this.getAllItems(target)).find(entry => nodeKey(entry.node) === key);
        return item ? item.progress : null;
    }

    async hasItem(node, target = 'history') {
        const key = nodeKey(node);
        return (await this.getAllItems(target)).some(entry => nodeKey(entry.node) === key);
    }

    async clearItems(target = 'history') { return enqueueWrite(target, () => this._set(target, [])); }

    async getAllItems(target = 'history') {
        const value = await this._get(target);
        return Array.isArray(value) ? value : [];
    }

    async set(key, value) {
        if (Object.prototype.hasOwnProperty.call(defaults, key)) {
            return enqueueWrite(`setting:${key}`, () => this._set(key, value));
        }
        return false;
    }

    async get(key) {
        if (!Object.prototype.hasOwnProperty.call(defaults, key)) return null;
        const value = await this._get(key);
        if (value !== null) return value;
        await this._set(key, defaults[key]);
        return defaults[key];
    }
}
