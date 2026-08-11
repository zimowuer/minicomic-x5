<template>
    <div class="screen">
        <NavRail label="返回" @back="back">
            <IconButton :icon="require('../../assets/menu.png?base64')" label="键盘" @click="openKeyboard('keyword')" />
        </NavRail>
        <div class="network-page">
            <div class="network-header">
                <div><text class="page-kicker">ONLINE CACHE</text><text class="page-title">联网书库</text></div>
                <div class="network-status">
                    <text v-for="(line, index) in statusLines" :key="index" class="network-status-line">{{ line }}</text>
                </div>
            </div>
            <scroller class="source-scroller" scroll-direction="horizontal" scroll-x="true" show-scrollbar="false">
                <div class="source-row">
                    <div v-for="source in sources" :key="source.key" :class="sourceClass(source.key)" @click="selectSource(source.key)"><text :class="sourceTextClass(source.key)">{{ source.name }}</text></div>
                </div>
            </scroller>
            <div v-if="activeSource.requiresLogin && !activeSource.isLogged" class="login-area">
                <div class="login-fields">
                    <div class="field" @click="openKeyboard('account')"><text :class="account ? 'field-value' : 'field-placeholder'">{{ account || '哔咔邮箱' }}</text></div>
                    <div class="field field-left" @click="openKeyboard('password')"><text :class="password ? 'field-value' : 'field-placeholder'">{{ password ? passwordMask : '哔咔密码' }}</text></div>
                    <div class="login-button" @click="loginPicacg"><text class="login-button-text">{{ busy ? '登录中' : '登录' }}</text></div>
                </div>
                <div class="login-hint"><text class="login-hint-title">此漫画源需要账号</text><text class="login-hint-copy">凭据仅用于请求登录令牌，令牌保存到设备本地。</text></div>
            </div>
            <div v-else-if="comic" class="detail-area">
                <image class="detail-cover" resize="cover" :src="comic.cover" />
                <div class="detail-main">
                    <text class="detail-title">{{ comic.name }}</text>
                    <text class="detail-meta">{{ comic.author || '未知作者' }} · {{ comic.chapters.length }} 章</text>
                    <text class="detail-desc">{{ comic.description || '暂无简介' }}</text>
                    <div class="detail-buttons"><div class="detail-button-primary" @click="readChapter(comic.chapters[0])"><text class="detail-button-text">开始阅读</text></div><div class="detail-button" @click="downloadComic"><text class="detail-button-text">下载全部</text></div><div class="detail-button" @click="comic = null"><text class="detail-button-text">返回结果</text></div></div>
                </div>
                <scroller class="chapter-scroller" scroll-y="true" over-scroll="28px" over-fling="28px" scroll-with-animation="true" show-scrollbar="true">
                    <div class="chapter-list"><div class="chapter" v-for="(chapter, index) in comic.chapters" :key="chapter.id" @click="readChapter(chapter)"><text class="chapter-index">{{ index + 1 }}</text><text class="chapter-name">{{ chapter.name }}</text></div></div>
                </scroller>
            </div>
            <div v-else class="search-area">
                <div class="search-row">
                    <div class="search-field" @click="openKeyboard('keyword')"><text :class="keyword ? 'search-value' : 'search-placeholder'">{{ keyword || '漫画名、作者或 JM 号' }}</text></div>
                    <div class="search-button" @click="search(true)"><text class="search-button-text">{{ busy ? '连接中' : '搜索' }}</text></div>
                </div>
                <div v-if="hotTags.length && results.length === 0" class="hot-row">
                    <div class="hot-tag" v-for="tag in hotTags.slice(0, 6)" :key="tag" @click="useTag(tag)"><text class="hot-tag-text">{{ tag }}</text></div>
                </div>
                <div v-if="results.length === 0 && !hotTags.length" class="network-empty"><text class="network-empty-title">输入关键词开始搜索</text><text class="network-empty-copy">X5 没有系统键盘，点输入框会打开内置键盘</text></div>
                <scroller v-if="results.length" class="result-scroller" scroll-y="true" over-scroll="28px" over-fling="28px" scroll-with-animation="true" show-scrollbar="true">
                    <div class="result-list">
                        <LibraryRow v-for="item in results" :key="item.id" kind="网" :title="item.name" :subtitle="item.author || item.description" :meta="String(item.id)" accent @click="openComic(item.id)" />
                        <div v-if="hasMore" class="more-button" @click="search(false)"><text class="more-text">加载更多结果</text></div>
                    </div>
                </scroller>
            </div>
        </div>
        <div v-if="keyboardVisible" class="keyboard">
            <div class="keyboard-head">
                <div class="keyboard-field"><text class="keyboard-label">{{ activeLabel }}</text><text class="keyboard-value">{{ activeInput === 'password' ? passwordMask : activeValue }}</text></div>
                <div class="keyboard-done" @click="keyboardVisible = false"><text class="keyboard-done-text">完成</text></div>
            </div>
            <div class="key-row" v-for="(row, rowIndex) in keyboard" :key="rowIndex">
                <div class="key" v-for="key in row" :key="key" @click="appendKey(key)"><text class="key-text">{{ displayKey(key) }}</text></div>
            </div>
            <div class="command-row">
                <div class="command-key" @click="backspace"><text class="command-text">退格</text></div>
                <div class="command-key command-left" @click="keyboardUppercase = !keyboardUppercase"><text class="command-text">大小写</text></div>
                <div class="space-key" @click="appendKey(' ')"><text class="command-text">空格</text></div>
                <div class="command-key command-left" @click="clearInput"><text class="command-text">清空</text></div>
            </div>
        </div>
        <AppToast />
    </div>
</template>
<script>
import NavRail from '../../components/nav-rail.vue';
import IconButton from '../../components/icon-button.vue';
import LibraryRow from '../../components/library-row.vue';
import AppToast from '../../components/app-toast.vue';
import sources, { findSource } from '../../utils/ComicSources';
export default {
    name: 'network', components: { NavRail, IconButton, LibraryRow, AppToast },
    data() {
        return {
            sources, sourceKey: 'jm', keyword: '', account: '', password: '', activeInput: 'keyword', keyboardVisible: false, keyboardUppercase: false,
            results: [], comic: null, page: 1, total: 0, busy: false, message: '', hotTags: [],
            keyboard: [
                ['1','2','3','4','5','6','7','8','9','0'],
                ['Q','W','E','R','T','Y','U','I','O','P'],
                ['A','S','D','F','G','H','J','K','L'],
                ['Z','X','C','V','B','N','M','@','.','_','-']
            ]
        };
    },
    async created() {
        try {
            console.warn('[HTTP API DIAG]', !!($falcon && $falcon.jsapi && $falcon.jsapi.http), !!($falcon && $falcon.jsapi && $falcon.jsapi.net),
                $falcon && $falcon.jsapi && $falcon.jsapi.http && typeof $falcon.jsapi.http.request,
                $falcon && $falcon.jsapi && $falcon.jsapi.net && typeof $falcon.jsapi.net.request);
        } catch (error) { console.warn('[HTTP API ERROR]', error && error.message ? error.message : String(error)); }
        for (let index = 0; index < this.sources.length; index++) {
            if (!this.sources[index].init) continue;
            try { await this.sources[index].init(); }
            catch (error) { this.message = `${this.sources[index].name} ??????${error.message || error}`; }
        }
        await this.loadHotTags();
    },
    computed: {
        activeSource() { return findSource(this.sourceKey); },
        hasMore() { return this.results.length < this.total; },
        passwordMask() { return '*'.repeat(this.password.length); },
        statusLines() {
            const value = String(this.message || '联网图片会先缓存，再交给阅读器显示');
            const lines = [];
            for (let offset = 0; offset < value.length; offset += 42) lines.push(value.slice(offset, offset + 42));
            return lines.slice(0, 4);
        },
        activeValue() { return this[this.activeInput] || ''; },
        activeLabel() { return this.activeInput === 'account' ? '哔咔邮箱' : (this.activeInput === 'password' ? '哔咔密码' : '搜索关键词'); }
    },
    methods: {
        back() { if (this.keyboardVisible) this.keyboardVisible = false; else if (this.comic) this.comic = null; else this.$page.finish(); },
        sourceClass(key) { return key === this.sourceKey ? 'source-tab-active' : 'source-tab-normal'; },
        sourceTextClass(key) { return key === this.sourceKey ? 'source-text-active' : 'source-text-normal'; },
        openKeyboard(field) { this.activeInput = field; this.keyboardVisible = true; },
        displayKey(key) { return /^[A-Z]$/.test(key) && !this.keyboardUppercase ? key.toLowerCase() : key; },
        appendKey(key) { if (/^[A-Z]$/.test(key) && !this.keyboardUppercase) key = key.toLowerCase(); if (this[this.activeInput].length < 80) this[this.activeInput] += key; },
        backspace() { this[this.activeInput] = this[this.activeInput].slice(0, -1); },
        clearInput() { this[this.activeInput] = ''; },
        useTag(tag) { this.keyword = tag; this.search(true); },
        async loadHotTags() { this.hotTags = []; if (!this.activeSource.hotTags) return; try { this.hotTags = (await this.activeSource.hotTags()).slice(0, 10); } catch (error) { this.hotTags = []; } },
        selectSource(key) { if (this.busy || key === this.sourceKey) return; this.sourceKey = key; this.results = []; this.comic = null; this.page = 1; this.total = 0; this.message = ''; this.loadHotTags(); },
        async loginPicacg() {
            if (this.busy || !this.account || !this.password) { this.message = '请输入邮箱和密码'; return; }
            this.busy = true; this.message = '正在登录哔咔…';
            try { await this.activeSource.login(this.account, this.password); this.message = '登录成功'; this.activeInput = 'keyword'; }
            catch (error) { this.message = `登录失败：${error.message || error}`; }
            this.busy = false;
        },
        async search(reset) {
            if (this.busy || !this.keyword.trim()) { if (!this.keyword.trim()) this.openKeyboard('keyword'); return; }
            this.busy = true; this.keyboardVisible = false; this.message = `正在连接 ${this.activeSource.name}…`;
            if (reset) { this.page = 1; this.results = []; this.comic = null; }
            try { const data = await this.activeSource.search(this.keyword, this.page); this.results = this.results.concat(data.items || []); this.total = Number(data.total || this.results.length); this.page++; this.message = this.results.length ? `找到 ${this.total} 部漫画` : '没有找到相关漫画'; }
            catch (error) { this.message = error.message || String(error); }
            this.busy = false;
        },
        async openComic(id) {
            if (this.busy) return; this.busy = true; this.message = '正在读取漫画信息…';
            try { this.comic = await this.activeSource.comic(id); this.message = ''; }
            catch (error) { this.message = error.message || String(error); }
            this.busy = false;
        },
        async readChapter(chapter) {
            if (this.busy || !chapter) return; this.busy = true; this.message = `正在缓存《${chapter.name}》…`;
            try {
                const urls = await this.activeSource.cacheChapter(chapter.id, (done, total) => { this.message = `正在缓存 ${done}/${total}`; });
                const node = { type: 'network', path: `${this.sourceKey}:${this.comic.id}/${chapter.id}`, urls, name: this.comic.name, cover: this.comic.cover };
                this.message = ''; $falcon.navTo('reader', { node: JSON.stringify(node) });
            } catch (error) { this.message = error.message || String(error); }
            this.busy = false;
        },
        async downloadComic() {
            if (this.busy || !this.comic) return; this.busy = true; this.message = '正在准备下载…';
            try { const path = await this.activeSource.download(this.comic, (done, total) => { this.message = `下载中 ${done}/${total}`; }); this.message = `下载完成：${path}`; }
            catch (error) { this.message = `下载失败：${error.message || error}`; }
            this.busy = false;
        }
    }
}
</script>
<style lang="less" scoped>
@import "../../styles/common.less";
.network-page { width: 694px; height: 238px; padding: 10px 18px; background-color: @ink; }
.network-header { width: 694px; height: 43px; flex-direction: row; align-items: center; justify-content: space-between; }
.network-status { width: 500px; height: 42px; align-items: flex-end; justify-content: center; }
.network-status-line { width: 500px; color: @muted; font-size: 8px; line-height: 10px; text-align: right; }
.source-scroller { width: 694px; height: 34px; }
.source-row { height: 34px; flex-direction: row; }
.source-tab-normal { height: 28px; margin-right: 7px; padding: 0 11px; border-radius: 8px; background-color: @panel; align-items: center; justify-content: center; }
.source-tab-active { height: 28px; margin-right: 7px; padding: 0 11px; border-radius: 8px; background-color: @scanDark; align-items: center; justify-content: center; }
.source-text-normal { color: @muted; font-size: 10px; line-height: 14px; }
.source-text-active { color: @scan; font-size: 10px; line-height: 14px; font-weight: bold; }
.search-area { width: 694px; height: 157px; }
.search-row { width: 694px; height: 43px; flex-direction: row; }
.search-field { width: 572px; height: 40px; padding: 0 12px; border-radius: 10px; background-color: @panel; justify-content: center; }
.search-value { color: @paper; font-size: 13px; line-height: 18px; }
.search-placeholder { color: @muted; font-size: 12px; line-height: 18px; }
.search-button { width: 90px; height: 40px; margin-left: 8px; border-radius: 10px; background-color: @scanDark; align-items: center; justify-content: center; }
.search-button-text { color: @scan; font-size: 12px; line-height: 17px; font-weight: bold; }
.hot-row { width: 694px; height: 105px; padding-top: 9px; flex-direction: row; flex-wrap: wrap; }
.hot-tag { height: 31px; margin: 0 7px 7px 0; padding: 0 10px; border-radius: 8px; background-color: @panel; align-items: center; justify-content: center; }
.hot-tag-text { color: @amber; font-size: 10px; line-height: 14px; }
.network-empty { width: 694px; height: 105px; align-items: center; justify-content: center; }
.network-empty-title { color: @paper; font-size: 16px; line-height: 21px; }
.network-empty-copy { margin-top: 5px; color: @muted; font-size: 10px; line-height: 15px; }
.result-scroller { width: 694px; height: 112px; }
.result-list { width: 694px; padding-top: 6px; }
.more-button { width: 690px; height: 38px; margin-bottom: 7px; border-radius: 10px; background-color: @scanDark; align-items: center; justify-content: center; }
.more-text { color: @scan; font-size: 11px; line-height: 16px; font-weight: bold; }
.login-area { width: 694px; height: 157px; }
.login-fields { width: 694px; height: 50px; flex-direction: row; align-items: center; }
.field { width: 245px; height: 40px; padding: 0 11px; border-radius: 10px; background-color: @panel; justify-content: center; }
.field-left { margin-left: 8px; }
.field-value { color: @paper; font-size: 11px; line-height: 16px; }
.field-placeholder { color: @muted; font-size: 11px; line-height: 16px; }
.login-button { width: 110px; height: 40px; margin-left: 8px; border-radius: 10px; background-color: @scanDark; align-items: center; justify-content: center; }
.login-button-text { color: @scan; font-size: 12px; line-height: 17px; font-weight: bold; }
.login-hint { width: 670px; height: 76px; margin-top: 9px; padding: 13px 12px; border-radius: 11px; background-color: @panel; }
.login-hint-title { color: @paper; font-size: 14px; line-height: 19px; font-weight: bold; }
.login-hint-copy { margin-top: 4px; color: @muted; font-size: 10px; line-height: 15px; }
.detail-area { width: 694px; height: 157px; flex-direction: row; }
.detail-cover { width: 84px; height: 118px; border-radius: 9px; }
.detail-main { width: 342px; height: 150px; margin-left: 11px; }
.detail-title { color: @paper; font-size: 15px; line-height: 20px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; }
.detail-meta { margin-top: 3px; color: @scan; font-size: 10px; line-height: 14px; }
.detail-desc { height: 42px; margin-top: 4px; color: @muted; font-size: 10px; line-height: 14px; overflow: hidden; }
.detail-buttons { height: 35px; margin-top: 6px; flex-direction: row; }
.detail-button-primary { height: 32px; padding: 0 10px; border-radius: 8px; background-color: @scanDark; align-items: center; justify-content: center; }
.detail-button { height: 32px; margin-left: 6px; padding: 0 10px; border-radius: 8px; background-color: @panel; align-items: center; justify-content: center; }
.detail-button-text { color: @paper; font-size: 10px; line-height: 14px; }
.chapter-scroller { width: 245px; height: 150px; margin-left: 12px; }
.chapter-list { width: 245px; }
.chapter { width: 225px; height: 35px; margin-bottom: 6px; padding: 0 10px; border-radius: 8px; background-color: @panel; flex-direction: row; align-items: center; }
.chapter-index { width: 30px; color: @scan; font-size: 10px; line-height: 14px; }
.chapter-name { width: 185px; color: @paper; font-size: 10px; line-height: 14px; overflow: hidden; text-overflow: ellipsis; }
.keyboard { position: fixed; left: 70px; top: 0; width: 702px; height: 238px; padding: 10px 14px; background-color: @ink; z-index: 40; }
.keyboard-head { width: 702px; height: 42px; flex-direction: row; align-items: center; }
.keyboard-field { width: 602px; height: 36px; padding: 0 11px; border-radius: 9px; background-color: @panel; flex-direction: row; align-items: center; }
.keyboard-label { width: 85px; color: @scan; font-size: 10px; line-height: 14px; }
.keyboard-value { width: 500px; color: @paper; font-size: 12px; line-height: 16px; overflow: hidden; text-overflow: ellipsis; }
.keyboard-done { width: 70px; height: 36px; margin-left: 8px; border-radius: 9px; background-color: @scanDark; align-items: center; justify-content: center; }
.keyboard-done-text { color: @scan; font-size: 11px; line-height: 16px; font-weight: bold; }
.key-row { width: 702px; height: 34px; margin-top: 4px; flex-direction: row; }
.key { flex: 1; height: 34px; margin-right: 4px; border-radius: 7px; background-color: @panel2; align-items: center; justify-content: center; }
.key:active { background-color: @scanDark; }
.key-text { color: @paper; font-size: 11px; line-height: 15px; }
.command-row { width: 702px; height: 34px; margin-top: 4px; flex-direction: row; }
.command-key { width: 88px; height: 34px; border-radius: 7px; background-color: @panel2; align-items: center; justify-content: center; }
.command-left { margin-left: 5px; }
.space-key { width: 410px; height: 34px; margin-left: 5px; border-radius: 7px; background-color: @panel; align-items: center; justify-content: center; }
.command-text { color: @paper; font-size: 10px; line-height: 14px; }
</style>
