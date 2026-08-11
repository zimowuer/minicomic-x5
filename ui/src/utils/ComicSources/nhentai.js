import { absoluteUrl, cacheUrls, firstMatch, requestText, stripHtml } from './helpers';

const BASE = 'https://nhentai.net';

async function nhRequest(url, headers) {
    try { return await requestText(url, headers); }
    catch (error) {
        if (/HTTP 403/.test(error.message || '')) throw new Error('nHentai 要求浏览器验证，当前网络暂时无法访问');
        throw error;
    }
}

function parseCards(html) {
    const results = [];
    const links = /<a[^>]+href=["']\/g\/(\d+)\/?["'][^>]*>([\s\S]*?)(?=<a[^>]+href=["']\/g\/|$)/gi;
    let match;
    while ((match = links.exec(html))) {
        const block = match[2];
        const cover = firstMatch(block, /<img[^>]+(?:data-src|src)=["']([^"']+)/i);
        const name = stripHtml(firstMatch(block, /<div[^>]+class=["'][^"']*caption[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, `nHentai ${match[1]}`));
        if (!results.some(item => item.id === match[1])) results.push({
            id: match[1], name, author: 'nHentai', description: '', cover: absoluteUrl(cover, BASE)
        });
    }
    return results;
}

const source = {
    key: 'nhentai', name: 'nHentai', imageHeaders: { Referer: `${BASE}/` },
    async search(keyword, page) {
        if (/^\d+$/.test(keyword.trim())) return { items: [await this.comic(keyword.trim())], total: 1 };
        const html = await nhRequest(`${BASE}/search/?q=${encodeURIComponent(keyword)}&page=${page}`, { Referer: `${BASE}/` });
        const items = parseCards(html);
        const last = Number(firstMatch(html, /class=["'][^"']*last[^"']*["'][^>]+href=["'][^"']*page=(\d+)/i, '1'));
        return { items, total: Math.max(items.length, last * 25) };
    },
    async comic(id) {
        const html = await nhRequest(`${BASE}/g/${id}/`, { Referer: `${BASE}/` });
        const titleBlock = firstMatch(html, /<h1[^>]+class=["']title["'][^>]*>([\s\S]*?)<\/h1>/i, `nHentai ${id}`);
        const name = stripHtml(titleBlock);
        const cover = absoluteUrl(firstMatch(html, /id=["']cover["'][\s\S]*?<img[^>]+(?:data-src|src)=["']([^"']+)/i), BASE);
        return { id: String(id), name, author: 'nHentai', description: '', cover, chapters: [{ id: String(id), name: '正文' }] };
    },
    async chapter(id) {
        const html = await nhRequest(`${BASE}/g/${id}/`, { Referer: `${BASE}/g/${id}/` });
        const urls = [];
        const regex = /<img[^>]+(?:data-src|src)=["']([^"']*\/galleries\/\d+\/\d+t\.(?:jpg|png|gif|webp))/gi;
        let match;
        while ((match = regex.exec(html))) {
            let url = absoluteUrl(match[1], BASE).replace(/:\/\/t\d*\./, '://i.').replace(/(\d+)t\.(jpg|png|gif|webp)$/i, '$1.$2');
            if (!urls.includes(url)) urls.push(url);
        }
        if (!urls.length) throw new Error('无法解析 nHentai 图片列表');
        return urls;
    },
    async cacheChapter(id, progress) { return cacheUrls(this.key, id, await this.chapter(id), this.imageHeaders, progress); }
};

export default source;
