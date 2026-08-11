import http from '../x5-http';
import fs from '../x5-fs';
import { aesEcbDecryptBase64, md5 } from './crypto';
import { convertWebpFile } from '../ImageConverter/ImageConverter';

const BUILT_IN_DOMAINS = ['www.cdntwice.org', 'www.cdnsha.org', 'www.cdnaspa.cc', 'www.cdnntr.cc'];
const DOMAIN_URLS = [
    'https://rup4a04-c02.tos-cn-hongkong.bytepluses.com/newsvr-2025.txt',
    'https://rup4a04-c01.tos-ap-southeast-1.bytepluses.com/newsvr-2025.txt'
];
const DOMAIN_SECRET = 'diosfjckwpqpdfjkvnqQjsik';
const FALLBACK_IMAGE_DOMAINS = [
    'https://cdn-msp2.jmdanjonproxy.vip',
    'https://cdn-msp.jmapiproxy3.cc'
];
const DEFAULT_IMAGE_DOMAIN = FALLBACK_IMAGE_DOMAINS[FALLBACK_IMAGE_DOMAINS.length - 1];
let imageDomain = DEFAULT_IMAGE_DOMAIN;
let appVersion = '2.0.11';
const AUTH_KEY = '18comicAPPContent';
const DATA_KEY = '185Hcomic3PAPP7R';
const UA = 'Mozilla/5.0 (Linux; Android 10; K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.0.0 Mobile Safari/537.36';
const CACHE_ROOT = '/userdisk/Favorite/DogeComicCache/JM';

async function ensureDirectory(path) {
    if (await fs.exists(path)) return;
    const created = await fs.mkdir(path);
    if (!created && !(await fs.exists(path))) throw new Error(`Cannot create cache directory: ${path}`);
}

async function verifyDownload(response, path, index) {
    const status = response && (response.status || response.statusCode);
    if (status && (status < 200 || status >= 400)) {
        throw new Error(`Image ${index} download failed: HTTP ${status}`);
    }
    if (!(await fs.exists(path))) throw new Error(`Image ${index} was not saved: ${path}`);
    const stat = await fs.stat(path);
    if (!stat || !stat.size) throw new Error(`Image ${index} is empty: ${path}`);
}

function headers(time) {
    return {
        Accept: '*/*', Authorization: 'Bearer', Origin: 'https://localhost', Referer: 'https://localhost/',
        token: md5(`${time}${AUTH_KEY}`), tokenparam: `${time},${appVersion}`, 'user-agent': UA,
        'X-Requested-With': 'com.example.app'
    };
}

function normalizeId(id) { return String(id || '').replace(/^jm/i, ''); }

function segmentation(chapterId, picture) {
    const id = Number(chapterId);
    if (id < 220980) return 0;
    if (id < 268850) return 10;
    const divisor = id > 421926 ? 8 : 10;
    const last = md5(`${chapterId}${String(picture).replace(/\.[^.]+$/, '')}`).slice(-1).charCodeAt(0);
    return (last % divisor) * 2 + 2;
}

export function imageUrl(name, chapterId) { return `${imageDomain}/media/photos/${chapterId}/${name}`; }
export function coverUrl(id) { return `${imageDomain}/media/albums/${normalizeId(id)}_3x4.jpg`; }

class JMComicClient {
    constructor() {
        this.domainIndex = 0;
        this.domains = BUILT_IN_DOMAINS.slice();
        this.refreshingDomains = null;
        this.domainsInitialized = false;
        this.imageDomainInitialized = false;
        this.imageDomains = FALLBACK_IMAGE_DOMAINS.slice();
    }

    parseBody(body, label) {
        if (typeof body !== 'string') return body;
        const text = body.replace(/^\uFEFF/, '').trim();
        if (!text) throw new Error(`${label}\u8fd4\u56de\u4e86\u7a7a\u54cd\u5e94`);
        if (text[0] === '<') throw new Error(`${label}\u8fd4\u56de\u4e86 HTML \u9875\u9762`);
        try { return JSON.parse(text); }
        catch (_) { throw new Error(`${label}\u8fd4\u56de\u7684\u6570\u636e\u4e0d\u662f JSON`); }
    }

    async refreshDomains() {
        if (this.refreshingDomains) return this.refreshingDomains;
        this.refreshingDomains = this.fetchDomains();
        try { return await this.refreshingDomains; }
        finally { this.refreshingDomains = null; }
    }

    async fetchDomains() {
        let lastError;
        for (let i = 0; i < DOMAIN_URLS.length; i++) {
            try {
                const response = await http.request({
                    url: DOMAIN_URLS[i], method: 'GET', headers: { 'user-agent': UA }, timeout: 10000
                });
                const status = response.status || response.statusCode;
                if (status && status !== 200) throw new Error(`线路配置 HTTP ${status}`);
                let encrypted = response.body;
                if (typeof encrypted !== 'string') throw new Error('\u7ebf\u8def\u914d\u7f6e\u4e0d\u662f\u6587\u672c');
                encrypted = encrypted.replace(/^\uFEFF/, '').trim();
                if (!encrypted) throw new Error('\u7ebf\u8def\u914d\u7f6e\u8fd4\u56de\u4e86\u7a7a\u54cd\u5e94');
                if (encrypted[0] === '<') throw new Error('\u7ebf\u8def\u914d\u7f6e\u8fd4\u56de\u4e86 HTML \u9875\u9762');
                if (encrypted[0] === '"') encrypted = JSON.parse(encrypted);
                let data;
                if (typeof encrypted === 'object' && encrypted) {
                    data = encrypted;
                } else if (/^\{/.test(String(encrypted))) {
                    data = JSON.parse(encrypted);
                } else {
                    const decoded = aesEcbDecryptBase64(String(encrypted), md5(DOMAIN_SECRET));
                    if (!decoded || !decoded.trim()) throw new Error('\u7ebf\u8def\u914d\u7f6e\u89e3\u5bc6\u540e\u4e3a\u7a7a');
                    data = JSON.parse(decoded);
                }
                const serverList = data && (data.Server || data.server || data.servers || (data.data && (data.data.Server || data.data.server)));
                const domains = (Array.isArray(serverList) ? serverList : []).map(domain => {
                    const value = domain && typeof domain === 'object' ? (domain.url || domain.host || domain.domain) : domain;
                    return String(value || '').replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
                }).filter(Boolean);
                if (!domains.length) throw new Error('\u7ebf\u8def\u914d\u7f6e\u4e2d\u6ca1\u6709\u670d\u52a1\u5668');
                this.domains = domains.concat(BUILT_IN_DOMAINS).filter((domain, index, all) => all.indexOf(domain) === index);
                this.domainIndex = 0;
                await this.updateAppVersion();
                return true;
            } catch (error) { lastError = error; }
        }
        throw new Error(`无法更新 JM 线路：${lastError && lastError.message ? lastError.message : lastError}`);
    }

    async updateAppVersion() {
        try {
            const response = await http.request({
                url: `https://${this.domains[0]}/static/jmapp3apk/version.json`,
                method: 'GET', headers: { 'user-agent': UA }, timeout: 8000
            });
            const data = this.parseBody(response.body, '版本接口');
            if (data && data.version) appVersion = String(data.version);
        } catch (_) { /* 内置版本通常仍可继续请求。 */ }
    }

    async request(path, domainsRefreshed = false) {
        let lastError;
        let refreshError = null;
        if (!this.domainsInitialized) {
            this.domainsInitialized = true;
            try { await this.refreshDomains(); } catch (error) { refreshError = error; }
            domainsRefreshed = true;
        }
        for (let attempt = 0; attempt < this.domains.length; attempt++) {
            const index = (this.domainIndex + attempt) % this.domains.length;
            const time = Math.floor(Date.now() / 1000);
            try {
                const response = await http.request({
                    url: `https://${this.domains[index]}${path}`,
                    method: 'GET', headers: headers(time), timeout: 10000
                });
                console.warn('[JM DIAG]', this.domains[index], path, response.status || response.statusCode, String(response.body || '').slice(0, 180));
                const envelope = this.parseBody(response.body, `线路 ${index + 1}`);
                const status = response.status || response.statusCode;
                if (status && status !== 200) throw new Error((envelope && envelope.errorMsg) || `HTTP ${status}`);
                if (!envelope || typeof envelope.data !== 'string') throw new Error('JM API 返回了无效数据');
                this.domainIndex = index;
                return JSON.parse(aesEcbDecryptBase64(envelope.data, md5(`${time}${DATA_KEY}`)));
            } catch (error) { lastError = error; }
        }
        if (!domainsRefreshed) {
            try {
                await this.refreshDomains();
                return await this.request(path, true);
            } catch (error) { refreshError = error; }
        }
        if (!lastError && refreshError) lastError = refreshError;
        const detail = lastError && lastError.message ? lastError.message : lastError;
        throw new Error(`JM \u7f51\u7edc\u8bf7\u6c42\u5931\u8d25\uff1a${detail || '\u672a\u77e5\u9519\u8bef'}`);
    }

    async search(keyword, page = 1) {
        const query = encodeURIComponent(keyword.trim()).replace(/%20/g, '+');
        const suffix = page > 1 ? `&page=${page}` : '';
        const data = await this.request(`/search?&search_query=${query}&o=mr${suffix}`);
        return {
            items: (data.content || []).map(item => ({
                id: String(item.id), name: item.name || '未命名漫画', author: item.author || '未知作者',
                description: item.description || '', cover: coverUrl(item.id)
            })),
            total: Number(data.total || 0)
        };
    }

    async hotTags() {
        const data = await this.request('/hot_tags?');
        return Array.isArray(data) ? data : [];
    }

    async comic(id) {
        id = normalizeId(id);
        const data = await this.request(`/album?id=${encodeURIComponent(id)}`);
        let chapters = (data.series || []).map((item, index) => ({
            id: String(item.id), name: item.name || `第 ${item.sort || index + 1} 话`
        }));
        if (!chapters.length) chapters = [{ id, name: '正文' }];
        return {
            id, name: data.name || `JM${id}`, author: (data.author || ['未知作者']).join(' / '),
            description: data.description || '', tags: data.tags || [], cover: coverUrl(id), chapters
        };
    }

    async chapter(id) {
        if (!this.imageDomainInitialized) {
            this.imageDomainInitialized = true;
            try {
                const setting = await this.request('/setting?app_img_shunt=1');
                if (setting && setting.img_host) {
                    const remoteDomain = String(setting.img_host).replace(/\/$/, '');
                    this.imageDomains = [remoteDomain].concat(FALLBACK_IMAGE_DOMAINS)
                        .filter((domain, index, all) => all.indexOf(domain) === index);
                    imageDomain = this.imageDomains[0];
                }
            } catch (_) { /* 使用内置图片线路。 */ }
        }
        const data = await this.request(`/chapter?&id=${encodeURIComponent(id)}`);
        return (data.images || []).map(name => imageUrl(name, id));
    }

    imageCandidates(url) {
        const marker = '/media/photos/';
        const offset = String(url).indexOf(marker);
        if (offset < 0) return [url];
        const suffix = String(url).slice(offset);
        return this.imageDomains.map(domain => `${domain}${suffix}`);
    }

    async cacheImage(urls, rawPath, path, segments, index) {
        let lastError;
        for (let attempt = 0; attempt < urls.length; attempt++) {
            try {
                let response = null;
                if (!(await fs.exists(path)) && !(await fs.exists(rawPath))) {
                    response = await http.download({
                        url: urls[attempt], method: 'GET', outPath: rawPath,
                        headers: { Referer: 'https://localhost/', 'User-Agent': UA }, timeout: 30000
                    });
                }
                if (!(await fs.exists(path))) {
                    await verifyDownload(response, rawPath, index);
                    await convertWebpFile(rawPath, path, segments);
                }
                await verifyDownload(null, path, index);
                if (attempt > 0) {
                    imageDomain = this.imageDomains[attempt];
                    this.imageDomains = [imageDomain].concat(this.imageDomains.filter(domain => domain !== imageDomain));
                }
                return path;
            } catch (error) {
                lastError = error;
                if (await fs.exists(rawPath)) await fs.rm(rawPath);
                if (await fs.exists(path)) await fs.rm(path);
            }
        }
        throw new Error(`Image ${index} download failed: ${lastError && lastError.message ? lastError.message : lastError}`);
    }

    async cacheChapter(id, onProgress) {
        const urls = await this.chapter(id);
        if (!urls.length) throw new Error('This chapter contains no images');
        const outDir = `${CACHE_ROOT}/${normalizeId(id)}`;
        await ensureDirectory(outDir);
        const localUrls = [];
        for (let i = 0; i < urls.length; i++) {
            const original = urls[i].split('/').pop().split('?')[0];
            const file = `${String(i + 1).padStart(3, '0')}_${id}_${original}`;
            const rawPath = `${outDir}/${file}`;
            const path = rawPath.replace(/\.webp$/i, '.jpeg');
            const legacyPath = rawPath.replace(/\.webp$/i, '.jpg');
            await this.cacheImage(this.imageCandidates(urls[i]), rawPath, path, segmentation(id, original), i + 1);
            if (legacyPath !== path && await fs.exists(legacyPath)) await fs.rm(legacyPath);
            localUrls.push(`file://${path}`);
            if (onProgress) onProgress(i + 1, urls.length);
        }
        return localUrls;
    }

    async download(comic, onProgress) {
        const safeName = comic.name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 80);
        const outDir = `/userdisk/Favorite/JM${comic.id}-${safeName}`;
        await ensureDirectory(outDir);
        let finished = 0;
        const chapterImages = [];
        for (let i = 0; i < comic.chapters.length; i++) chapterImages.push(await this.chapter(comic.chapters[i].id));
        const total = chapterImages.reduce((sum, images) => sum + images.length, 0);
        for (let c = 0; c < comic.chapters.length; c++) {
            const chapterId = comic.chapters[c].id;
            for (let i = 0; i < chapterImages[c].length; i++) {
                const original = chapterImages[c][i].split('/').pop().split('?')[0];
                const rawPath = `${outDir}/${String(c + 1).padStart(3, '0')}_${chapterId}_${original}`;
                const path = rawPath.replace(/\.webp$/i, '.jpeg');
                const legacyPath = rawPath.replace(/\.webp$/i, '.jpg');
                await this.cacheImage(this.imageCandidates(chapterImages[c][i]), rawPath, path, segmentation(chapterId, original), finished + 1);
                if (legacyPath !== path && await fs.exists(legacyPath)) await fs.rm(legacyPath);
                finished++;
                if (onProgress) onProgress(finished, total);
            }
        }
        return outDir;
    }
}

export default new JMComicClient();
