import jm from '../JMComic/JMComic';
import nhentai from './nhentai';
import htmanga from './htmanga';
import ehentai from './ehentai';
import hitomi from './hitomi';
import picacg from './picacg';
import { downloadComic } from './helpers';

const jmSource = {
    key: 'jm', name: '禁漫',
    search: (keyword, page) => /^(?:jm)?\d+$/i.test(keyword.trim())
        ? jm.comic(keyword.replace(/^jm/i, '')).then(comic => ({
            items: [{ id: comic.id, name: comic.name, author: comic.author, description: comic.description, cover: comic.cover }], total: 1
        }))
        : jm.search(keyword, page),
    comic: id => jm.comic(id),
    chapter: id => jm.chapter(id),
    cacheChapter: (id, progress) => jm.cacheChapter(id, progress),
    download: (comic, progress) => jm.download(comic, progress),
    hotTags: () => jm.hotTags()
};

const sources = [jmSource, picacg, ehentai, htmanga, nhentai, hitomi];

for (let i = 0; i < sources.length; i++) {
    if (!sources[i].download) {
        const source = sources[i];
        source.download = (comic, progress) => downloadComic(source, comic, progress);
    }
}

export function findSource(key) { return sources.find(source => source.key === key) || jmSource; }
export default sources;
