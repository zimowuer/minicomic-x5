<template>
    <div class="tile" @click="$emit('click')">
        <div class="accent"></div>
        <div class="tile-copy">
            <text class="tile-title">{{ title }}</text>
            <text class="tile-desc">{{ desc }}</text>
        </div>
        <image class="tile-icon" :src="icon" />
    </div>
</template>
<script>
export default {
    name: 'ActionTile',
    props: {
        title: { type: String, required: true },
        desc: { type: String, default: '' },
        icon: { type: String, required: true }
    }
}
</script>
<style lang="less" scoped>
@import "../styles/tokens.less";
.tile { width: 220px; height: 64px; border-radius: 12px; background-color: @panel; flex-direction: row; align-items: center; overflow: hidden; }
.tile:active { background-color: @panel2; }
.accent { width: 4px; height: 64px; background-color: @scan; }
.tile-copy { width: 164px; padding-left: 12px; }
.tile-title { color: @paper; font-size: 16px; line-height: 21px; font-weight: bold; }
.tile-desc { margin-top: 2px; color: @muted; font-size: 10px; line-height: 14px; }
.tile-icon { width: 24px; height: 24px; }
</style>
