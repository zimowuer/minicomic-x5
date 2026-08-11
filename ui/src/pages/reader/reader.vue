<template>
    <div class="reader-screen">
        <NavRail v-show="showControls" :label="progressLabel" @back="back">
            <div v-if="reader" class="reader-tools">
                <IconButton class="tool-gap" :icon="require('../../assets/back.png?base64')" label="上段" @click="previous" />
                <IconButton class="tool-gap" :icon="require('../../assets/next.png?base64')" label="下段" @click="next" />
                <IconButton class="tool-gap" :icon="require('../../assets/menu.png?base64')" label="调节" @click="menuOpen = true" />
            </div>
        </NavRail>
        <div v-if="loading" class="reader-loading" :style="stageStyle"><text class="loading-kicker">PREPARING PAGES</text><text class="loading-title">正在装订漫画…</text></div>
        <div v-else-if="loadError" class="reader-error" :style="stageStyle">
            <text class="error-kicker">OPEN FAILED</text>
            <text class="error-title">漫画打开失败</text>
            <text class="error-copy">{{ loadError }}</text>
            <div class="error-button" @click="back"><text class="error-button-text">返回书库</text></div>
        </div>
        <div v-else-if="reader" class="reader-stage" :style="stageStyle">
            <scroller class="reader-scroller" :style="stageStyle" show-scrollbar="true" over-scroll="30px" over-fling="30px" @scroll="setOffset">
                <div ref="start" class="reader-start" :style="contentStyle" @click="toggleControls">
                    <div v-if="reader.segment.length === 0" class="reader-empty" :style="emptyStyle"><text class="reader-empty-title">没有可显示的图片</text><text class="reader-empty-copy">请确认文件夹中包含 JPG、PNG、GIF 或 BMP</text></div>
                    <div v-else class="reader-images">
                        <JmImage v-for="url in reader.segment" :key="url" :url="url" :width="pageWidth" />
                    </div>
                    <div class="segment-end">
                        <text class="segment-copy">第 {{ reader.index + 1 }} / {{ segmentCount }} 段</text>
                        <div v-if="reader.index < reader.getSegmentCount() - 1" class="next-button" @click="next"><text class="next-text">继续下一段 ›</text></div>
                    </div>
                </div>
            </scroller>
        </div>
        <div v-show="showControls" class="favorite-rail">
            <div v-if="reader && !loading" class="favorite-action" @click="favorite">
                <IconButton :icon="require('../../assets/love.png?base64')" :label="isFavorite ? '取消' : '收藏'" :active="isFavorite" />
            </div>
        </div>
        <div v-if="menuOpen && reader" class="menu-mask" @click="menuOpen = false"></div>
        <div v-if="menuOpen && reader" class="reader-menu">
            <div class="menu-header"><div><text class="menu-kicker">PAGE RAIL</text><text class="menu-title">阅读调节</text></div><div class="menu-close" @click="menuOpen = false"><text class="menu-close-text">×</text></div></div>
            <div class="menu-row"><div class="menu-copy"><text class="menu-label">页面宽度</text><text class="menu-value">{{ Math.round(reader.scale * 100) }}%</text></div><slider class="menu-slider" :min="60" :max="100" :step="5" :value="Math.round(reader.scale * 100)" active-color="#56d6d2" background-color="#29404d" @change="scaleChange"></slider></div>
            <div class="menu-row"><div class="menu-copy"><text class="menu-label">阅读分段</text><text class="menu-value">{{ reader.index + 1 }} / {{ segmentCount }}</text></div><slider class="menu-slider" :min="1" :max="segmentCount" :step="1" :value="reader.index + 1" active-color="#ffbf5b" background-color="#29404d" @change="progressChange"></slider></div>
            <div class="menu-actions"><div class="menu-action" @click="previous"><text class="menu-action-text">‹ 上一段</text></div><div class="menu-action menu-action-next" @click="next"><text class="menu-action-text">下一段 ›</text></div></div>
        </div>
        <div v-if="isDebug && reader" class="debug"><text class="debug-text">段 {{ reader.index + 1 }}/{{ reader.getSegmentCount() }} · 偏移 {{ reader.offset }} · 宽度 {{ pageWidth }}</text></div>
        <AppToast />
    </div>
</template>
<script>
import NavRail from '../../components/nav-rail.vue';
import IconButton from '../../components/icon-button.vue';
import JmImage from '../../components/jm-image.vue';
import AppToast from '../../components/app-toast.vue';
import ComicReader from '../../utils/ComicReader/ComicReader.js';
import Storage from '../../utils/Storage/Storage.js';
const storage = new Storage();
const SCREEN_HEIGHT = 258;
export default {
    name: 'reader', components: { NavRail, IconButton, JmImage, AppToast },
    data() { return { loading: true, loadError: '', reader: null, hidableSidebar: false, showControls: true, menuOpen: false, isDebug: false, isFavorite: false, favoriteBusy: false, scrollTimer: null }; },
    computed: {
        stageWidth() { return this.showControls ? 660 : 800; },
        stageStyle() { return { width: this.stageWidth, height: SCREEN_HEIGHT }; },
        pageWidth() { return Math.round(this.stageWidth * (this.reader ? this.reader.scale : 1)); },
        contentStyle() { return { width: this.stageWidth, minHeight: SCREEN_HEIGHT, alignItems: this.reader && this.reader.scale < 1 ? 'center' : 'flex-start' }; },
        emptyStyle() { return { width: this.stageWidth }; },
        segmentCount() { return this.reader ? Math.max(1, this.reader.getSegmentCount()) : 1; },
        progressLabel() { return this.reader ? `${this.reader.index + 1}/${this.reader.getSegmentCount() || 1}` : '阅读'; }
    },
    async created() {
        try {
            this.hidableSidebar = await storage.get('hidableSidebar');
            this.isDebug = await storage.get('isDebug');
            this.showControls = !this.hidableSidebar;
            const node = JSON.parse(this.$page.options.node);
            this.reader = new ComicReader(node, { scale: await storage.get('scale') });
            const [progress, isFavorite] = await Promise.all([
                storage.getItem(node),
                storage.hasItem(node, 'favorite')
            ]);
            this.isFavorite = isFavorite;
            if (progress) this.reader.setProgress(progress);
            await this.reader.load();
            this.loading = false;
            this.go(this.reader.getOffset());
        } catch (error) {
            this.loadError = error && error.message ? error.message : String(error);
            this.reader = null;
            this.menuOpen = false;
            this.loading = false;
            $falcon.trigger('comic-toast', { text: `打开失败：${this.loadError}` });
        }
    },
    methods: {
        eventValue(event) { return event && event.detail ? event.detail.value : Number(event); },
        onShow() {
            if (!this.$page.$npage) return;
            this.backHandler = () => this.back();
            this.$page.$npage.setSupportBack(false);
            this.$page.$npage.on('backpressed', this.backHandler);
        },
        onHide() {
            this.save();
            if (!this.$page.$npage || !this.backHandler) return;
            this.$page.$npage.setSupportBack(true);
            this.$page.$npage.off('backpressed', this.backHandler);
        },
        onUnload() { clearTimeout(this.scrollTimer); this.save(); },
        async save() { if (this.reader) await storage.addItem(this.reader.node, this.reader.getProgress()); },
        back() { this.save().then(() => this.$page.finish()); },
        async favorite() {
            if (!this.reader || this.favoriteBusy) return;
            this.favoriteBusy = true;
            try {
                const wasFavorite = this.isFavorite;
                const success = wasFavorite
                    ? await storage.removeItem(this.reader.node, 'favorite')
                    : await storage.addItem(this.reader.node, this.reader.getProgress(), 'favorite');
                if (!success) {
                    $falcon.trigger('comic-toast', { text: wasFavorite ? '取消收藏失败' : '收藏失败' });
                    return;
                }
                this.isFavorite = !wasFavorite;
                $falcon.trigger('comic-toast', { text: this.isFavorite ? '已加入收藏' : '已取消收藏' });
            } finally {
                this.favoriteBusy = false;
            }
        },
        toggleControls() { if (this.hidableSidebar && !this.menuOpen) this.showControls = !this.showControls; },
        setOffset(event) { if (this.reader && event && event.contentOffset) this.reader.setOffset(event.contentOffset.y); },
        go(offset) {
            clearTimeout(this.scrollTimer);
            this.scrollTimer = setTimeout(() => {
                if (this.$refs.start && this.$page.$dom) this.$page.$dom.scrollToElement(this.$refs.start, { offset: offset || 0 });
            }, 30);
        },
        previous() { if (!this.reader || this.reader.index <= 0) return; this.reader.prev(); this.menuOpen = false; this.go(0); },
        next() { if (!this.reader || this.reader.index >= this.reader.getSegmentCount() - 1) return; this.reader.next(); this.menuOpen = false; this.go(0); },
        scaleChange(event) { if (!this.reader) return; const value = this.eventValue(event) / 100; this.reader.scale = value; this.reader.manualScaled = true; this.go(this.reader.getOffset()); },
        progressChange(event) { if (!this.reader) return; this.reader.go(this.eventValue(event) - 1); this.menuOpen = false; this.go(0); }
    }
}
</script>
<style lang="less" scoped>
@import "../../styles/common.less";
.reader-screen { width: 800px; height: 258px; flex-direction: row; background-color: #000000; }
.reader-stage { height: 258px; background-color: #000000; }
.reader-scroller { height: 258px; background-color: #000000; }
.reader-start { background-color: #000000; }
.reader-images { flex-direction: column; align-items: center; }
.reader-loading { height: 258px; background-color: @ink; align-items: center; justify-content: center; }
.reader-error { height: 258px; background-color: @ink; align-items: center; justify-content: center; }
.error-kicker { color: @danger; font-size: 10px; line-height: 14px; }
.error-title { margin-top: 5px; color: @paper; font-size: 20px; line-height: 26px; font-weight: bold; }
.error-copy { width: 590px; margin-top: 5px; color: @muted; font-size: 10px; line-height: 14px; text-align: center; overflow: hidden; text-overflow: ellipsis; }
.error-button { width: 120px; height: 34px; margin-top: 10px; border-radius: 9px; background-color: @scanDark; align-items: center; justify-content: center; }
.error-button-text { color: @scan; font-size: 11px; line-height: 15px; font-weight: bold; }
.loading-kicker { color: @scan; font-size: 10px; line-height: 15px; }
.loading-title { margin-top: 7px; color: @paper; font-size: 21px; line-height: 28px; font-weight: bold; }
.reader-empty { width: 730px; height: 210px; align-items: center; justify-content: center; }
.reader-empty-title { color: @paper; font-size: 19px; line-height: 25px; }
.reader-empty-copy { margin-top: 7px; color: @muted; font-size: 11px; line-height: 16px; }
.segment-end { width: 100%; height: 70px; align-items: center; justify-content: center; background-color: @ink; }
.segment-copy { color: @muted; font-size: 10px; line-height: 15px; }
.next-button { width: 150px; height: 34px; margin-top: 6px; border-radius: 9px; background-color: @scanDark; align-items: center; justify-content: center; }
.next-text { color: @scan; font-size: 12px; line-height: 17px; font-weight: bold; }
.reader-tools { height: 188px; justify-content: space-between; }
.tool-gap { margin-top: 4px; }
.favorite-rail { width: 52px; height: 234px; padding: 12px 9px; background-color: @panel; align-items: center; }
.favorite-action { width: 52px; height: 54px; }
.menu-mask { position: fixed; left: 0; top: 0; width: 800px; height: 258px; background-color: rgba(0, 0, 0, 0.55); z-index: 20; }
.reader-menu { position: fixed; right: 0; top: 0; width: 330px; height: 230px; padding: 14px 16px; background-color: @panel; z-index: 21; }
.menu-header { width: 330px; height: 45px; flex-direction: row; align-items: center; justify-content: space-between; }
.menu-kicker { color: @scan; font-size: 9px; line-height: 12px; }
.menu-title { color: @paper; font-size: 19px; line-height: 24px; font-weight: bold; }
.menu-close { width: 36px; height: 36px; border-radius: 10px; background-color: @panel2; align-items: center; justify-content: center; }
.menu-close-text { color: @paper; font-size: 23px; line-height: 27px; }
.menu-row { width: 330px; height: 55px; flex-direction: row; align-items: center; justify-content: space-between; }
.menu-copy { width: 95px; }
.menu-label { color: @paper; font-size: 12px; line-height: 16px; }
.menu-value { margin-top: 2px; color: @muted; font-size: 10px; line-height: 14px; }
.menu-slider { width: 222px; height: 30px; }
.menu-actions { width: 330px; height: 42px; margin-top: 5px; flex-direction: row; }
.menu-action { width: 155px; height: 42px; border-radius: 10px; background-color: @panel2; align-items: center; justify-content: center; }
.menu-action-next { margin-left: 10px; background-color: @scanDark; }
.menu-action-text { color: @paper; font-size: 12px; line-height: 17px; font-weight: bold; }
.debug { position: fixed; top: 4px; right: 8px; width: 330px; height: 22px; background-color: rgba(7, 16, 23, 0.82); align-items: center; justify-content: center; z-index: 10; }
.debug-text { color: @amber; font-size: 9px; line-height: 13px; }
</style>
