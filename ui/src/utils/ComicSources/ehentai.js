import { absoluteUrl, cacheUrls, firstMatch, requestText, stripHtml } from './helpers';

const BASE = 'https://e-hentai.org';
const HEADERS = { Referer: `${BASE}/`, Cookie: 'nw=1' };
const DETAIL_CONCURRENCY = 6;

function parseGalleryCards(html) {
    const items = [];
    const regex = /href=["'](https?:\/\/e-hentai\.org\/g\/(\d+)\/[^"']+)["']([\s\S]*?)(?=href=["']https?:\/\/e-hentai\.org\/g\/|$)/gi;
    let match;
    while ((match = regex.exec(html))) {
        const block = match[3];
        const name = stripHtml(firstMatch(block, /class=["']glink["'][^>]*>([\s\S]*?)<\//i, `E-Hentai ${match[2]}`));
        const cover = absoluteUrl(firstMatch(block, /<img[^>]+(?:data-src|src)=["']([^"']+)/i), BASE);
        if (!items.some(item => item.id === match[1])) items.push({
            id: match[1], name, author: 'E-Hentai', description: `GID ${match[2]}`, cover
        });
    }
    return items;
}

const source = {
    key: 'ehentai', name: 'E-Hentai', imageHeaders: HEADERS,
    async search(keyword, page) {
        const url = `${BASE}/?f_search=${encodeURIComponent(keyword)}${page > 1 ? `&page=${page - 1}` : ''}`;
        const html = await requestText(url, HEADERS);
        const items = parseGalleryCards(html);
        return { items, total: items.length + (items.length ? page * 25 : 0) };
    },
    async comic(id) {
        const link = /^https?:/.test(id) ? id : null;
        if (!link) throw new Error('E-Hentai 需要从搜索结果进入详情');
        const html = await requestText(link, HEADERS);
        if (/Content Warning/.test(html)) throw new Error('站点返回了内容警告页');
        const name = stripHtml(firstMatch(html, /<h1[^>]+id=["']gn["'][^>]*>([\s\S]*?)<\/h1>/i, 'E-Hentai'));
        const subTitle = stripHtml(firstMatch(html, /<h1[^>]+id=["']gj["'][^>]*>([\s\S]*?)<\/h1>/i));
        const style = firstMatch(html, /id=["']gd1["'][\s\S]*?style=["']([^"']+)/i);
        const cover = firstMatch(style, /(https?:\/\/[^)'"\s]+)/i);
        const pages = Number(firstMatch(html, />(\d+) pages</i, '1'));
        return {
            id: link, name, author: 'E-Hentai', description: subTitle, cover,
            chapters: [{ id: `${link}|${pages}`, name: '正文' }]
        };
    },
    async chapter(chapterId, onProgress) {
        const split = chapterId.lastIndexOf('|');
        const link = chapterId.slice(0, split);
        const pages = Number(chapterId.slice(split + 1)) || 1;
        const imagePages = [];
        for (let page = 0; page < Math.ceil(pages / 20); page++) {
            const html = await requestText(`${link}?p=${page}`, HEADERS);
            const regex = /href=["'](https?:\/\/e-hentai\.org\/s\/[^"']+)["']/gi;
            let match;
            while ((match = regex.exec(html))) if (!imagePages.includes(match[1])) imagePages.push(match[1]);
        }
        const images = new Array(imagePages.length);
        let resolved = 0;
        for (let start = 0; start < imagePages.length; start += DETAIL_CONCURRENCY) {
            const end = Math.min(start + DETAIL_CONCURRENCY, imagePages.length);
            const tasks = [];
            for (let i = start; i < end; i++) {
                tasks.push(requestText(imagePages[i], HEADERS).then(html => {
                    images[i] = firstMatch(html, /id=["']img["'][^>]+src=["']([^"']+)/i);
                    resolved++;
                    if (onProgress) onProgress(resolved, imagePages.length);
                }));
            }
            await Promise.all(tasks);
        }
        const urls = images.filter(Boolean);
        if (!urls.length) throw new Error('无法解析 E-Hentai 图片列表');
        return urls;
    },
    async cacheChapter(id, progress) {
        const urls = await this.chapter(id, (done, total) => {
            if (progress) progress(done, total * 2);
        });
        return cacheUrls(this.key, id, urls, this.imageHeaders, (done, total) => {
            if (progress) progress(total + done, total * 2);
        });
    }
};

export default source;
