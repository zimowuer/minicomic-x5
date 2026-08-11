<template>
    <div class="screen">
        <NavRail label="返回" @back="back">
            <IconButton :icon="require('../../assets/delete.png?base64')" label="清空" @click="clear" />
        </NavRail>
        <div class="list-page">
            <div class="list-header">
                <div><text class="page-kicker">PINNED BOOKS</text><text class="page-title">我的收藏</text></div>
                <text class="count">{{ items.length }} 本</text>
            </div>
            <div v-if="items.length === 0" class="empty"><text class="empty-title">收藏夹是空的</text><text class="empty-copy">阅读时点按右上角“收藏”即可加入</text></div>
            <scroller v-else class="list-scroller" show-scrollbar="true">
                <div class="reverse-list">
                    <LibraryRow v-for="item in displayItems" :key="item.node.path" kind="藏"
                        :title="nodeTitle(item.node)" :subtitle="item.node.path" :meta="item.time" accent @click="open(item.node)" />
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
    name: 'favorite', components: { NavRail, IconButton, LibraryRow, AppToast },
    data() { return { items: [] }; },
    computed: { displayItems() { return this.items.slice().reverse(); } },
    methods: {
        back() { this.$page.finish(); },
        nodeTitle(node) { return node.name || String(node.path || '未命名漫画').split('/').pop(); },
        open(node) { $falcon.navTo('reader', { node: JSON.stringify(node) }); },
        clear() { storage.clearItems('favorite').then(() => { this.items = []; $falcon.trigger('comic-toast', { text: '收藏已清空' }); }); },
        onShow() { storage.getAllItems('favorite').then(items => { this.items = items; }); }
    }
}
</script>
<style lang="less" scoped>
@import "../../styles/common.less";
.list-page { width: 694px; height: 232px; padding: 13px 18px; background-color: @ink; }
.list-header { width: 694px; height: 53px; flex-direction: row; align-items: center; justify-content: space-between; }
.count { color: @muted; font-size: 11px; line-height: 16px; }
.list-scroller { width: 694px; height: 175px; }
.reverse-list { width: 694px; padding-top: 3px; }
</style>
