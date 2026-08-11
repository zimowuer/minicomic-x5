<template>
    <div class="screen">
        <NavRail :label="manager.cwd === root ? '主页' : '上一级'" @back="back">
            <IconButton :icon="require('../../assets/home.png?base64')" label="主页" @click="home" />
        </NavRail>
        <div class="file-page">
            <div class="file-header">
                <div class="file-heading">
                    <text class="page-kicker">LOCAL LIBRARY</text>
                    <text class="page-title">本地漫画</text>
                </div>
                <scroller class="path-scroller" scroll-direction="horizontal" show-scrollbar="false">
                    <text class="path">{{ manager.cwd }}</text>
                </scroller>
            </div>
            <div v-if="manager.loading" class="file-state"><text class="state-title">正在扫描文件…</text><text class="state-copy">图片文件夹会自动识别为漫画</text></div>
            <div v-else-if="manager.error" class="file-state"><text class="error-title">无法读取此目录</text><text class="state-copy">请把漫画放入 /userdisk/Favorite</text></div>
            <div v-else-if="manager.nodeList.length === 0" class="file-state"><text class="state-title">这里还没有图片</text><text class="state-copy">支持 JPG、PNG、GIF、BMP</text></div>
            <scroller v-else class="file-scroller" show-scrollbar="true" over-scroll="28px" over-fling="28px">
                <div class="file-list">
                    <LibraryRow v-for="(node, index) in manager.nodeList" :key="node.name"
                        :kind="kind(node)" :title="node.name" :subtitle="description(node)" :meta="node.size || ''"
                        :accent="node.isComic" @click="open(index)" />
                </div>
            </scroller>
        </div>
    </div>
</template>
<script>
import NavRail from '../../components/nav-rail.vue';
import IconButton from '../../components/icon-button.vue';
import LibraryRow from '../../components/library-row.vue';
import FileManager from '../../utils/FileManager/FileManager.js';
const ROOT = '/userdisk/Favorite';
export default {
    name: 'filemanager',
    components: { NavRail, IconButton, LibraryRow },
    data() { return { manager: new FileManager(ROOT), root: ROOT }; },
    methods: {
        kind(node) { return node.isComic ? '漫' : (node.isDir ? '夹' : '图'); },
        description(node) { return node.isComic ? '漫画文件夹 · 点击阅读' : (node.isDir ? '文件夹' : '单张图片'); },
        home() { this.manager.goHome(); },
        back() { if (!this.manager.goBack()) this.$page.finish(); },
        open(index) {
            const node = this.manager.chooseFile(index);
            if (node) $falcon.navTo('reader', { node: JSON.stringify(node) });
        },
        onShow() {
            if (!this.$page.$npage) return;
            this.backHandler = () => this.back();
            this.$page.$npage.setSupportBack(false);
            this.$page.$npage.on('backpressed', this.backHandler);
        },
        onHide() {
            if (!this.$page.$npage || !this.backHandler) return;
            this.$page.$npage.setSupportBack(true);
            this.$page.$npage.off('backpressed', this.backHandler);
        }
    }
}
</script>
<style lang="less" scoped>
@import "../../styles/common.less";
.file-page { width: 694px; height: 232px; padding: 13px 18px; background-color: @ink; }
.file-header { width: 694px; height: 53px; flex-direction: row; align-items: center; justify-content: space-between; }
.file-heading { width: 170px; }
.path-scroller { width: 500px; height: 36px; border-radius: 9px; background-color: @panel; }
.path { padding: 9px 12px; color: @muted; font-size: 11px; line-height: 16px; }
.file-scroller { width: 694px; height: 175px; }
.file-list { width: 694px; padding-top: 3px; }
.file-state { width: 694px; height: 170px; align-items: center; justify-content: center; }
.state-title { color: @paper; font-size: 19px; line-height: 25px; }
.error-title { color: @danger; font-size: 19px; line-height: 25px; }
.state-copy { margin-top: 6px; color: @muted; font-size: 12px; line-height: 17px; }
</style>
