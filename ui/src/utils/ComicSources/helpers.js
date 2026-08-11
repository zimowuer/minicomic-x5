import http from '../x5-http';
import fs from '../x5-fs';
import { convertWebpFile, isWebpFile, isWebpUrl } from '../ImageConverter/ImageConverter';

export const WEB_UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/138.0.0.0 Mobile Safari/537.36';
const CACHE_ROOT = '/userdisk/Favorite/DogeComicCache';

async function ensureDirectory(path) {
    if (await fs.exists(path)) return;
    const created = await fs.mkdir(path);
    if (!created && !(await fs.exists(path))) throw new Error(`Cannot create cache directory: ${path}`);
}

async function verifyDownload(response, path, index) {
    const status = response && (response.status || response.statusCode);
    if (status && (status < 200 || status >= 300)) throw new Error(`Image ${index} download failed: HTTP ${status}`);
    if (!(await fs.exists(path))) throw new Error(`Image ${index} was not saved: ${path}`);
    const stat = await fs.stat(path);
    if (!stat || stat.size < 1024) throw new Error(`Image ${index} is not a valid image: ${path}`);
}

function responseHeader(response, name) {
    const headers = response && response.headers;
    if (!headers) return '';
    const target = name.toLowerCase();
    if (typeof headers.get === 'function') return headers.get(name) || headers.get(target) || '';
    const keys = Object.keys(headers);
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].toLowerCase() === target) return headers[keys[i]];
    }
    return '';
}

function redirectUrl(location, currentUrl) {
    location = String(location || '').trim();
    if (/^https?:\/\//i.test(location)) return location;
    const origin = currentUrl.match(/^https?:\/\/[^/]+/i);
    if (!origin) return location;
    if (location[0] === '/') return origin[0] + location;
    return currentUrl.replace(/[^/]*(?:\?.*)?$/, '') + location;
}

async function removeInvalidCache(path) {
    if (!(await fs.exists(path))) return;
    const stat = await fs.stat(path);
    if (!stat || stat.size < 1024) await fs.rm(path);
}

async function downloadImage(url, outPath, headers, index) {
    let currentUrl = url;
    for (let redirect = 0; redirect < 5; redirect++) {
        const response = await http.download({
            url: currentUrl, method: 'GET', outPath,
            headers: { 'User-Agent': WEB_UA, ...(headers || {}) }, timeout: 30000
        });
        const status = Number(response && (response.status || response.statusCode));
        if ([301, 302, 303, 307, 308].indexOf(status) !== -1) {
            const location = responseHeader(response, 'location');
            if (!location) throw new Error(`Image ${index} redirect has no Location header`);
            currentUrl = redirectUrl(location, currentUrl);
            continue;
        }
        await verifyDownload(response, outPath, index);
        return response;
    }
    throw new Error(`Image ${index} has too many redirects`);
}

export function decodeHtml(value) {
    const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    return String(value || '').replace(/&#(x?[0-9a-f]+);|&([a-z]+);/gi, (all, number, name) => {
        if (number) return String.fromCharCode(parseInt(number.replace(/^x/i, ''), /^x/i.test(number) ? 16 : 10));
        return entities[name.toLowerCase()] || all;
    });
}

export function stripHtml(value) {
    return decodeHtml(String(value || '').replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

export function absoluteUrl(url, base) {
    if (!url) return '';
    url = decodeHtml(url).replace(/^\/\//, 'https://');
    if (/^https?:\/\//i.test(url)) return url;
    const origin = base.match(/^https?:\/\/[^/]+/i)[0];
    return origin + (url[0] === '/' ? url : `/${url}`);
}

export async function requestText(url, headers = {}) {
    const response = await http.request({
        url, method: 'GET', headers: { 'User-Agent': WEB_UA, ...headers }, timeout: 15000
    });
    const status = response.status || response.statusCode;
    if (status && (status < 200 || status >= 400)) throw new Error(`HTTP ${status}`);
    const body = typeof response.body === 'string' ? response.body : String(response.body || '');
    if (/^\s*<!doctype html/i.test(body) && /cloudflare|just a moment|captcha/i.test(body)) {
        throw new Error('站点要求浏览器验证');
    }
    return body;
}

function safePart(value) { return String(value).replace(/[\\/:*?"<>|]/g, '_').slice(0, 80); }

export async function cacheUrls(sourceKey, chapterId, urls, headers, onProgress) {
    if (!urls.length) throw new Error('This chapter contains no images');
    const outDir = `${CACHE_ROOT}/${safePart(sourceKey)}/${safePart(chapterId)}`;
    await ensureDirectory(outDir);
    const local = [];
    for (let i = 0; i < urls.length; i++) {
        const sourceName = urls[i].split('/').pop().split('?')[0] || `${i + 1}.jpg`;
        const webp = isWebpUrl(urls[i]);
        let ext = sourceName.match(/\.(jpe?g|png)$/i);
        ext = ext ? ext[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
        const prefix = `${outDir}/${String(i + 1).padStart(4, '0')}`;
        const convertedPath = `${prefix}.jpeg`;
        let path = webp ? convertedPath : `${prefix}.${ext}`;
        let response = null;
        await removeInvalidCache(path);
        await removeInvalidCache(convertedPath);
        if (!webp && path !== convertedPath && await fs.exists(convertedPath)) path = convertedPath;
        if (webp && !(await fs.exists(path))) {
            const legacyPath = `${prefix}.jpg`;
            const rawPath = await fs.exists(legacyPath) ? legacyPath : `${prefix}.webp`;
            await removeInvalidCache(rawPath);
            if (!(await fs.exists(rawPath))) {
                response = await downloadImage(urls[i], rawPath, headers, i + 1);
            }
            await convertWebpFile(rawPath, path);
        } else if (!(await fs.exists(path))) {
            response = await downloadImage(urls[i], path, headers, i + 1);
        }
        if (!webp && path !== convertedPath && isWebpFile(path)) {
            await convertWebpFile(path, convertedPath);
            path = convertedPath;
        }
        await verifyDownload(response, path, i + 1);
        local.push(`file://${path}`);
        if (onProgress) onProgress(i + 1, urls.length);
    }
    return local;
}

export async function downloadComic(source, comic, onProgress) {
    const outDir = `/userdisk/Favorite/${source.name}-${safePart(comic.name)}`;
    await ensureDirectory(outDir);
    let done = 0;
    const chapterUrls = [];
    for (let i = 0; i < comic.chapters.length; i++) chapterUrls.push(await source.chapter(comic.chapters[i].id));
    const total = chapterUrls.reduce((sum, urls) => sum + urls.length, 0);
    for (let c = 0; c < chapterUrls.length; c++) {
        for (let i = 0; i < chapterUrls[c].length; i++) {
            const url = chapterUrls[c][i];
            const webp = isWebpUrl(url);
            const extMatch = url.split('?')[0].match(/\.(jpe?g|png)$/i);
            const ext = extMatch ? extMatch[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
            const prefix = `${outDir}/${String(c + 1).padStart(3, '0')}_${String(i + 1).padStart(4, '0')}`;
            const convertedPath = `${prefix}.jpeg`;
            let path = webp ? convertedPath : `${prefix}.${ext}`;
            let response = null;
            await removeInvalidCache(path);
            await removeInvalidCache(convertedPath);
            if (!webp && path !== convertedPath && await fs.exists(convertedPath)) path = convertedPath;
            if (webp && !(await fs.exists(path))) {
                const rawPath = `${prefix}.webp`;
                await removeInvalidCache(rawPath);
                response = await downloadImage(url, rawPath, source.imageHeaders, done + 1);
                await convertWebpFile(rawPath, path);
            } else if (!(await fs.exists(path))) {
                response = await downloadImage(url, path, source.imageHeaders, done + 1);
            }
            if (!webp && path !== convertedPath && isWebpFile(path)) {
                await convertWebpFile(path, convertedPath);
                path = convertedPath;
            }
            await verifyDownload(response, path, done + 1);
            done++;
            if (onProgress) onProgress(done, total);
        }
    }
    return outDir;
}

export function firstMatch(text, regex, fallback = '') {
    const match = regex.exec(text);
    return match ? decodeHtml(match[1]) : fallback;
}
