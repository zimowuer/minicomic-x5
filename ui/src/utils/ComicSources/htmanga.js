import { absoluteUrl, cacheUrls, firstMatch, requestText, stripHtml } from './helpers';

const BASE = 'https://www.wnacg.com';

const source = {
    key: 'htmanga', name: '绅士漫画', imageHeaders: { Referer: `${BASE}/` },
    async search(keyword, page) {
        let url = `${BASE}/search/?q=${encodeURIComponent(keyword)}&f=_all&s=create_time_DESC&syn=yes`;
        if (page > 1) url += `&p=${page}`;
        const html = await requestText(url);
        const items = [];
        const regex = /href=["'][^"']*photos-index[^"']*-aid-(\d+)\.html["']([\s\S]*?)(?=href=["'][^"']*photos-index|$)/gi;
        let match;
        while ((match = regex.exec(html))) {
            const block = match[2];
            const cover = absoluteUrl(firstMatch(block, /<img[^>]+(?:data-original|src)=["']([^"']+)/i), BASE);
            let name = stripHtml(firstMatch(block, /title=["']([^"']+)/i));
            if (!name) name = stripHtml(firstMatch(block, /<div[^>]+class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, `绅士漫画 ${match[1]}`));
            if (!items.some(item => item.id === match[1])) items.push({ id: match[1], name, author: '绅士漫画', description: '', cover });
        }
        return { items, total: items.length + (items.length ? page * 20 : 0) };
    },
    async comic(id) {
        const html = await requestText(`${BASE}/photos-index-page-1-aid-${id}.html`);
        const name = stripHtml(firstMatch(html, /<div[^>]+class=["'][^"']*userwrap[^"']*["'][\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/i, `绅士漫画 ${id}`));
        const cover = absoluteUrl(firstMatch(html, /class=["'][^"']*uwthumb[^"']*["'][\s\S]*?<img[^>]+src=["']([^"']+)/i), BASE);
        const description = stripHtml(firstMatch(html, /class=["'][^"']*uwconn[^"']*["'][\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i));
        return { id: String(id), name, author: '绅士漫画', description, cover, chapters: [{ id: String(id), name: '正文' }] };
    },
    async chapter(id) {
        const html = await requestText(`${BASE}/photos-gallery-aid-${id}.html`);
        const urls = [];
        const regex = /(?:https?:)?\/\/([\w.-]+\/[\w./%\[\]()-]+\.(?:jpg|jpeg|png|gif|bmp))/gi;
        let match;
        while ((match = regex.exec(html))) {
            const url = `https://${match[1]}`;
            if (!urls.includes(url) && !/logo|avatar|cover/i.test(url)) urls.push(url);
        }
        if (!urls.length) throw new Error('无法解析绅士漫画图片列表');
        return urls;
    },
    async cacheChapter(id, progress) { return cacheUrls(this.key, id, await this.chapter(id), this.imageHeaders, progress); }
};

export default source;
