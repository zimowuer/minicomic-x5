<template>
    <div class="screen">
        <NavRail label="退出" @back="exitApp">
            <div class="rail-actions">
                <IconButton :icon="require('../../assets/setting.png?base64')" label="设置" @click="go('setting')" />
                <IconButton class="rail-gap" :icon="require('../../assets/info.png?base64')" label="关于" @click="go('info')" />
            </div>
        </NavRail>
        <div class="home">
            <div class="home-header">
                <div class="brand-copy">
                    <text class="brand-kicker">YOUDAO X5 · 800×258</text>
                    <text class="brand-title">横格漫画</text>
                </div>
                <text class="header-note">本地优先 · 进度自动保存 · 四页分片低内存渲染</text>
            </div>
            <div class="home-content">
                <div class="recent-column">
                    <text class="section-label">最近阅读</text>
                    <ComicCover v-if="recent.length" :node="recent[0].node" :title="nodeTitle(recent[0].node)" :meta="recent[0].time" @click="open(recent[0].node)" />
                    <div v-else class="recent-empty" @click="go('filemanager')">
                        <text class="recent-empty-title">还没有阅读记录</text>
                        <text class="recent-empty-copy">打开本地漫画开始阅读</text>
                    </div>
                    <div v-if="recent.length > 1" class="mini-recent" @click="open(recent[1].node)">
                        <text class="mini-recent-title">{{ nodeTitle(recent[1].node) }}</text>
                        <text class="mini-recent-arrow">继续 ›</text>
                    </div>
                </div>
                <div class="action-grid">
                    <ActionTile title="本地漫画" desc="浏览 /userdisk/Favorite" :icon="require('../../assets/folder.png?base64')" @click="go('filemanager')" />
                    <ActionTile class="tile-left" title="联网书库" desc="搜索、缓存后阅读" :icon="require('../../assets/books.png?base64')" @click="go('network')" />
                    <ActionTile class="tile-top" title="阅读历史" desc="按上次位置继续" :icon="require('../../assets/history.png?base64')" @click="go('history')" />
                    <ActionTile class="tile-left-top" title="我的收藏" desc="保存常看的漫画" :icon="require('../../assets/love.png?base64')" @click="go('favorite')" />
                    <div class="scan-status">
                        <div class="scan-line"></div>
                        <text class="scan-copy">X5 横屏模式已启用</text>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import NavRail from '../../components/nav-rail.vue';
import IconButton from '../../components/icon-button.vue';
import ActionTile from '../../components/action-tile.vue';
import ComicCover from '../../components/comic-cover.vue';
import Storage from '../../utils/Storage/Storage.js';
const storage = new Storage();
export default {
    name: 'index',
    components: { NavRail, IconButton, ActionTile, ComicCover },
    data() { return { recent: [] }; },
    methods: {
        go(page) { $falcon.navTo(page); },
        exitApp() { this.$page.finish(); },
        open(node) { $falcon.navTo('reader', { node: JSON.stringify(node) }); },
        nodeTitle(node) { return node.name || String(node.path || '未命名漫画').split('/').pop(); },
        onShow() { storage.getAllItems('history').then(items => { this.recent = items.slice(-2).reverse(); }); }
    }
}
</script>
<style lang="less" scoped>
@import "../../styles/common.less";
.home { width: 600px; height: 234px; padding: 12px 16px; background-color: @ink; }
.home-header { width: 600px; height: 45px; flex-direction: row; align-items: center; justify-content: space-between; }
.brand-copy { width: 280px; }
.brand-kicker { color: @scan; font-size: 10px; line-height: 13px; }
.brand-title { color: @paper; font-size: 24px; line-height: 28px; font-weight: bold; }
.header-note { width: 300px; color: @muted; font-size: 11px; line-height: 16px; text-align: right; }
.home-content { width: 600px; height: 185px; flex-direction: row; }
.recent-column { width: 200px; height: 185px; }
.section-label { height: 22px; color: @muted; font-size: 11px; line-height: 17px; }
.recent-empty { width: 165px; height: 58px; padding: 18px 14px; border-radius: 13px; background-color: @panel; }
.recent-empty:active { background-color: @panel2; }
.recent-empty-title { color: @paper; font-size: 15px; line-height: 20px; font-weight: bold; }
.recent-empty-copy { margin-top: 7px; color: @scan; font-size: 11px; line-height: 15px; }
.mini-recent { width: 175px; height: 22px; margin-top: 8px; padding: 8px 10px; border-radius: 10px; background-color: @panel; flex-direction: row; justify-content: space-between; }
.mini-recent:active { background-color: @panel2; }
.mini-recent-title { width: 150px; color: @paper; font-size: 11px; line-height: 15px; overflow: hidden; text-overflow: ellipsis; }
.mini-recent-arrow { color: @scan; font-size: 10px; line-height: 15px; }
.action-grid { width: 400px; height: 185px; flex-direction: row; flex-wrap: wrap; }
.tile-left { margin-left: 10px; }
.tile-top { margin-top: 8px; }
.tile-left-top { margin-left: 10px; margin-top: 8px; }
.scan-status { width: 380px; height: 25px; margin-top: 7px; padding-left: 9px; border-radius: 8px; background-color: @panel; flex-direction: row; align-items: center; }
.scan-line { width: 28px; height: 2px; background-color: @scan; }
.scan-copy { margin-left: 8px; color: @muted; font-size: 10px; line-height: 14px; }
.rail-actions { height: 112px; justify-content: space-between; }
.rail-gap { margin-top: 8px; }
</style>
