<template>
    <div class="screen">
        <NavRail label="返回" @back="back">
            <IconButton :icon="require('../../assets/delete.png?base64')" label="清空" @click="clear" />
        </NavRail>
        <div class="list-page">
            <div class="list-header">
                <div><text class="page-kicker">READING LOG</text><text class="page-title">阅读历史</text></div>
            </div>
            <div v-if="items.length === 0" class="empty"><text class="empty-title">还没有阅读记录</text><text class="empty-copy">打开漫画后会自动保存阅读位置</text></div>
            <scroller v-else class="list-scroller" scroll-y="true" show-scrollbar="true"
                over-scroll="28px" over-fling="28px">
                <div class="reverse-list">
                    <div v-if="networkItems.length" class="history-group">
                        <div class="group-header"><text class="group-title">网络下载</text><text class="group-count">{{ networkItems.length }} 条</text></div>
                        <LibraryRow v-for="item in networkItems" :key="item.node.path" kind="网"
                            :title="nodeTitle(item.node)" :subtitle="item.node.path" :meta="item.time" accent @click="open(item.node)" />
                    </div>
                    <div v-if="localItems.length" class="history-group">
                        <div class="group-header"><text class="group-title">本地阅读</text><text class="group-count">{{ localItems.length }} 条</text></div>
                        <LibraryRow v-for="item in localItems" :key="item.node.path" kind="续"
                            :title="nodeTitle(item.node)" :subtitle="item.node.path" :meta="item.time" @click="open(item.node)" />
                    </div>
                </div>
            </scroller>
        </div>
        <AppToast />
    </div>
</template>
<script>
import NavRail from '../../components/nav-rail.vue';
import IconButton from '../../components/icon-button.vue';
import LibraryRow from '../../components/library-row.vue';
import AppToast from '../../components/app-toast.vue';
import Storage from '../../utils/Storage/Storage.js';
const storage = new Storage();
export default {
    name: 'history', components: { NavRail, IconButton, LibraryRow, AppToast },
    data() { return { items: [] }; },
    computed: {
        displayItems() { return this.items.slice().reverse(); },
        networkItems() { return this.displayItems.filter(item => item.node && item.node.type === 'network'); },
        localItems() { return this.displayItems.filter(item => item.node && item.node.type !== 'network'); }
    },
    methods: {
        back() { this.$page.finish(); },
        nodeTitle(node) { return node.name || String(node.path || '未命名漫画').split('/').pop(); },
        open(node) { $falcon.navTo('reader', { node: JSON.stringify(node) }); },
        clear() { storage.clearItems('history').then(() => { this.items = []; $falcon.trigger('comic-toast', { text: '阅读历史已清空' }); }); },
        onShow() { storage.getAllItems('history').then(items => { this.items = items; }); }
    }
}
</script>
<style lang="less" scoped>
@import "../../styles/common.less";
.list-page { width: 694px; height: 258px; padding: 13px 18px; background-color: @ink; }
.list-header { width: 694px; height: 53px; flex-direction: row; align-items: center; justify-content: space-between; }
.list-scroller { width: 694px; height: 175px; }
.reverse-list { width: 694px; padding-top: 3px; padding-bottom: 18px; }
.history-group { width: 694px; }
.group-header { width: 670px; height: 25px; padding: 0 10px; flex-direction: row; align-items: center; justify-content: space-between; }
.group-title { color: @scan; font-size: 11px; line-height: 15px; font-weight: bold; }
.group-count { color: @muted; font-size: 9px; line-height: 13px; }
</style>
