<template>
    <div class="cover-card" @click="$emit('click')">
        <image v-if="cover" class="cover" resize="cover" :src="cover" />
        <div v-else class="cover-fallback"><text class="fallback-mark">漫</text></div>
        <div class="cover-copy">
            <text class="cover-title">{{ title }}</text>
            <text class="cover-meta">{{ meta }}</text>
        </div>
    </div>
</template>
<script>
export default {
    name: 'ComicCover',
    props: {
        node: { type: Object, required: true },
        title: { type: String, default: '' },
        meta: { type: String, default: '继续阅读' }
    },
    data() { return { cover: '' }; },
    created() {
        if (this.node.cover) this.cover = this.node.cover;
        else if (this.node.type === 'file' && this.node.path) this.cover = `file://${this.node.path}`;
    }
}
</script>
<style lang="less" scoped>
@import "../styles/tokens.less";
.cover-card { width: 202px; height: 78px; padding: 8px; border-radius: 13px; background-color: @panel; flex-direction: row; }
.cover-card:active { background-color: @panel2; }
.cover { width: 56px; height: 78px; border-radius: 8px; }
.cover-fallback { width: 56px; height: 78px; border-radius: 8px; background-color: @scanDark; align-items: center; justify-content: center; }
.fallback-mark { color: @scan; font-size: 24px; font-weight: bold; }
.cover-copy { width: 135px; padding: 9px 0 0 11px; }
.cover-title { color: @paper; font-size: 14px; line-height: 19px; font-weight: bold; text-overflow: ellipsis; }
.cover-meta { margin-top: 8px; color: @scan; font-size: 10px; line-height: 14px; }
</style>
