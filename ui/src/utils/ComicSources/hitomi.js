import { cacheUrls, firstMatch, requestText, stripHtml } from './helpers';

const DOMAIN = 'gold-usergeneratedcontent.net';
const BASE = `https://ltn.${DOMAIN}`;
const HEADERS = { Referer: 'https://hitomi.la/' };
let gg = null;

async function getGg() {
    if (gg) return gg;
    const text = await requestText(`${BASE}/gg.js?_=${Math.floor(Date.now() / 1000)}`, HEADERS);
    const numbers = [];
    const cases = /case (\d+)/g;
    let match;
    while ((match = cases.exec(text))) numbers.push(match[1]);
    gg = {
        numbers,
        b: firstMatch(text, /b:\s*['"](\d+)/, '1'),
        initial: Number(firstMatch(text, /var o = (\d+)/, '1'))
    };
    return gg;
}

function hashNumber(hash) { return parseInt(hash.slice(-1) + hash.slice(-3, -1), 16); }

async function imageUrl(file) {
    const config = await getGg();
    const number = hashNumber(file.hash);
    const bit = config.numbers.includes(String(number)) ? (~config.initial & 1) : config.initial;
    const subdomain = bit === 0 ? 'w1' : 'w2';
    const s = String(number);
    const ext = (file.name.split('.').pop() || 'jpg').replace('webp', 'jpg');
    return `https://${subdomain}.${DOMAIN}/${config.b}/${s}/${file.hash}.${ext}`;
}

const source = {
    key: 'hitomi', name: 'Hitomi', imageHeaders: { Referer: 'https://hitomi.la/' },
    async search(keyword) {
        const id = String(keyword).match(/\d+/);
        if (!id) throw new Error('词典笔版本的 Hitomi 搜索请输入作品数字 ID');
        const comic = await this.comic(id[0]);
        return { items: [{ id: comic.id, name: comic.name, author: comic.author, description: comic.description, cover: comic.cover }], total: 1 };
    },
    async comic(id) {
        const js = await requestText(`${BASE}/galleries/${id}.js`, HEADERS);
        const start = js.indexOf('{');
        if (start < 0) throw new Error('Hitomi 详情数据格式错误');
        const data = JSON.parse(js.slice(start).replace(/;\s*$/, ''));
        let cover = '';
        try {
            const block = await requestText(`${BASE}/galleryblock/${id}.html`, HEADERS);
            cover = firstMatch(block, /data-srcset=["']\/\/[^/]+([^\s"']+)/i);
            if (cover) cover = `https://atn.${DOMAIN}${cover.replace(/2x.*$/, '').replace('avifbigtn', 'webpbigtn').replace('.avif', '.webp')}`;
        } catch (_) { cover = ''; }
        const files = data.files || [];
        return {
            id: String(id), name: data.title || `Hitomi ${id}`,
            author: (data.artists || []).map(item => item.artist).join(' / ') || '未知作者',
            description: data.language || '', cover,
            chapters: [{ id: JSON.stringify({ id: String(id), files }), name: '正文' }]
        };
    },
    async chapter(chapterId) {
        const data = JSON.parse(chapterId);
        const urls = [];
        for (let i = 0; i < data.files.length; i++) urls.push(await imageUrl(data.files[i]));
        return urls;
    },
    async cacheChapter(id, progress) { return cacheUrls(this.key, String(id).slice(0, 60), await this.chapter(id), this.imageHeaders, progress); }
};

export default source;
