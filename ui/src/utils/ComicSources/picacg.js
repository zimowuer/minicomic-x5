import http from '../x5-http';
import { hmacSha256 } from '../JMComic/crypto';
import { cacheUrls, WEB_UA } from './helpers';
import Storage from '../Storage/Storage';

const API = 'https://picaapi.picacomic.com';
const API_KEY = 'C69BAF41DA5ABD1FFEDC6D2FEA56B';
const HMAC_KEY = '~d}$Q7$eIni=V)9\\RK/P.RM4;9[7|@/CA}b~OW!3?EV`:<>M7pddUBL5n|0/*Cn';
const storage = new Storage();

function nonce() {
    let value = '';
    for (let i = 0; i < 32; i++) value += Math.floor(Math.random() * 16).toString(16);
    return value;
}

function mediaUrl(media) {
    if (!media || !media.fileServer || !media.path) return '';
    const server = String(media.fileServer).replace(/^http:/i, 'https:').replace(/\/$/, '');
    // storage-b redirects /static/tobs/... to /static/...; miniapp http drops Location.
    const path = String(media.path).replace(/^\/+/, '').replace(/^tobs\//i, '');
    return `${server}/static/${path}`;
}

const source = {
    key: 'picacg', name: '哔咔', token: '', requiresLogin: true,
    get isLogged() { return !!this.token; },
    async init() { this.token = (await storage._get('picacgToken')) || ''; },
    signedHeaders(method, path) {
        const time = String(Math.floor(Date.now() / 1000));
        const requestNonce = nonce();
        const signature = hmacSha256(HMAC_KEY, `${path}${time}${requestNonce}${method}${API_KEY}`.toLowerCase());
        return {
            'api-key': API_KEY, accept: 'application/vnd.picacomic.com.v1+json', 'app-channel': '3',
            authorization: this.token, time, nonce: requestNonce, 'app-version': '2.2.1.3.3.4',
            'app-uuid': 'defaultUuid', 'image-quality': 'original', 'app-platform': 'android',
            'app-build-version': '45', 'Content-Type': 'application/json; charset=UTF-8',
            'user-agent': 'okhttp/3.8.1', version: 'v1.4.1', Host: 'picaapi.picacomic.com', signature
        };
    },
    async request(method, path, data) {
        const response = await http.request({
            url: `${API}/${path}`, method: method.toUpperCase(), headers: this.signedHeaders(method.toUpperCase(), path),
            data: data ? JSON.stringify(data) : undefined, timeout: 15000
        });
        const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
        const status = response.status || response.statusCode;
        if (status && status !== 200) throw new Error((body && body.message) || `HTTP ${status}`);
        if (!body || body.message !== 'success') throw new Error((body && body.message) || '哔咔请求失败');
        return body.data;
    },
    async login(email, password) {
        const data = await this.request('POST', 'auth/sign-in', { email, password });
        this.token = data.token;
        await storage._set('picacgToken', this.token);
        return true;
    },
    ensureLogin() { if (!this.token) throw new Error('请先登录哔咔账号'); },
    async search(keyword, page) {
        this.ensureLogin();
        const data = await this.request('POST', `comics/advanced-search?page=${page}`, { keyword, sort: 'dd' });
        const comics = data.comics || {};
        return {
            items: (comics.docs || []).map(item => ({
                id: item._id, name: item.title || '未命名漫画', author: item.author || '未知作者',
                description: (item.tags || []).join(' · '),
                cover: mediaUrl(item.thumb)
            })), total: Number(comics.total || (comics.pages || 1) * 20)
        };
    },
    async comic(id) {
        this.ensureLogin();
        const data = await this.request('GET', `comics/${id}`);
        const item = data.comic;
        const chapters = [];
        let page = 1;
        do {
            const eps = await this.request('GET', `comics/${id}/eps?page=${page}`);
            const epData = eps.eps || {};
            (epData.docs || []).forEach(ep => chapters.push({ id: JSON.stringify({ comicId: id, order: ep.order }), name: ep.title }));
            if (page >= Number(epData.pages || 1)) break;
            page++;
        } while (true);
        return {
            id, name: item.title, author: item.author || '未知作者', description: item.description || '',
            cover: mediaUrl(item.thumb),
            chapters: chapters.length ? chapters.reverse() : [{ id: JSON.stringify({ comicId: id, order: 1 }), name: '正文' }]
        };
    },
    async chapter(chapterId) {
        this.ensureLogin();
        const chapter = JSON.parse(chapterId);
        const urls = [];
        let page = 1;
        do {
            const data = await this.request('GET', `comics/${chapter.comicId}/order/${chapter.order}/pages?page=${page}`);
            const pages = data.pages || {};
            (pages.docs || []).forEach(item => {
                const url = mediaUrl(item.media);
                if (url) urls.push(url);
            });
            if (page >= Number(pages.pages || 1)) break;
            page++;
        } while (true);
        return urls;
    },
    imageHeaders: { 'User-Agent': WEB_UA },
    async cacheChapter(id, progress) { return cacheUrls(this.key, String(id).slice(0, 60), await this.chapter(id), this.imageHeaders, progress); }
};

export default source;
