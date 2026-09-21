<template>
    <div class="screen">
        <NavRail label="閫€鍑? @back="exitApp">
            <div class="rail-actions">
                <IconButton :icon="require('../../assets/setting.png?base64')" label="璁剧疆" @click="go('setting')" />
                <IconButton class="rail-gap" :icon="require('../../assets/info.png?base64')" label="鍏充簬" @click="go('info')" />
            </div>
        </NavRail>
        <div class="home">
            <div class="home-header">
                <div class="brand-copy">
                    <text class="brand-kicker">YOUDAO X5 路 800脳258</text>
                    <text class="brand-title">妯牸婕敾</text>
                </div>
                <text class="header-note">鏈湴浼樺厛 路 杩涘害鑷姩淇濆瓨 路 鍥涢〉鍒嗙墖浣庡唴瀛樻覆鏌?/text>
            </div>
            <div class="home-content">
                <div class="recent-column">
                    <text class="section-label">鏈€杩戦槄璇?/text>
                    <ComicCover v-if="recent.length" :node="recent[0].node" :title="nodeTitle(recent[0].node)" :meta="recent[0].time" @click="open(recent[0].node)" />
                    <div v-else class="recent-empty" @click="go('filemanager')">
                        <text class="recent-empty-title">杩樻病鏈夐槄璇昏褰?/text>
                        <text class="recent-empty-copy">鎵撳紑鏈湴婕敾寮€濮嬮槄璇?/text>
                    </div>
                    <div v-if="recent.length > 1" class="mini-recent" @click="open(recent[1].node)">
                        <text class="mini-recent-title">{{ nodeTitle(recent[1].node) }}</text>
                        <text class="mini-recent-arrow">缁х画 鈥?/text>
                    </div>
                </div>
                <div class="action-grid">
                    <ActionTile title="鏈湴婕敾" desc="娴忚 /userdisk/Favorite" :icon="require('../../assets/folder.png?base64')" @click="go('filemanager')" />
                    <ActionTile class="tile-left" title="鑱旂綉涔﹀簱" desc="鎼滅储銆佺紦瀛樺悗闃呰" :icon="require('../../assets/books.png?base64')" @click="go('network')" />
                    <ActionTile class="tile-top" title="闃呰鍘嗗彶" desc="鎸変笂娆′綅缃户缁? :icon="require('../../assets/history.png?base64')" @click="go('history')" />
                    <ActionTile class="tile-left-top" title="鎴戠殑鏀惰棌" desc="淇濆瓨甯哥湅鐨勬极鐢? :icon="require('../../assets/love.png?base64')" @click="go('favorite')" />
                    <div class="scan-status">
                        <div class="scan-line"></div>
                        <text class="scan-copy">X5 妯睆妯″紡宸插惎鐢?/text>
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
        nodeTitle(node) { return node.name || String(node.path || '鏈懡鍚嶆极鐢?).split('/').pop(); },
        onShow() { storage.getAllItems('history').then(items => { this.recent = items.slice(-2).reverse(); }); }
    }
}
</script>
<style lang="less" scoped>
@import "../../styles/common.less";
.home { width: 698px; height: 234px; padding: 12px 16px; background-color: @ink; }
.home-header { width: 698px; height: 45px; flex-direction: row; align-items: center; justify-content: space-between; }
.brand-copy { width: 280px; }
.brand-kicker { color: @scan; font-size: 10px; line-height: 13px; }
.brand-title { color: @paper; font-size: 24px; line-height: 28px; font-weight: bold; }
.header-note { width: 350px; color: @muted; font-size: 11px; line-height: 16px; text-align: right; }
.home-content { width: 698px; height: 185px; flex-direction: row; }
.recent-column { width: 230px; height: 185px; }
.section-label { height: 22px; color: @muted; font-size: 11px; line-height: 17px; }
.recent-empty { width: 190px; height: 58px; padding: 18px 14px; border-radius: 13px; background-color: @panel; }
.recent-empty:active { background-color: @panel2; }
.recent-empty-title { color: @paper; font-size: 15px; line-height: 20px; font-weight: bold; }
.recent-empty-copy { margin-top: 7px; color: @scan; font-size: 11px; line-height: 15px; }
.mini-recent { width: 198px; height: 22px; margin-top: 8px; padding: 8px 10px; border-radius: 10px; background-color: @panel; flex-direction: row; justify-content: space-between; }
.mini-recent:active { background-color: @panel2; }
.mini-recent-title { width: 150px; color: @paper; font-size: 11px; line-height: 15px; overflow: hidden; text-overflow: ellipsis; }
.mini-recent-arrow { color: @scan; font-size: 10px; line-height: 15px; }
.action-grid { width: 468px; height: 185px; flex-direction: row; flex-wrap: wrap; }
.tile-left { margin-left: 10px; }
.tile-top { margin-top: 8px; }
.tile-left-top { margin-left: 10px; margin-top: 8px; }
.scan-status { width: 450px; height: 25px; margin-top: 7px; padding-left: 9px; border-radius: 8px; background-color: @panel; flex-direction: row; align-items: center; }
.scan-line { width: 28px; height: 2px; background-color: @scan; }
.scan-copy { margin-left: 8px; color: @muted; font-size: 10px; line-height: 14px; }
.rail-actions { height: 112px; justify-content: space-between; }
.rail-gap { margin-top: 8px; }
</style>
