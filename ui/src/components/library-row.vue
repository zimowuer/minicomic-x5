<template>
    <div class="row" @click="$emit('click')">
        <div class="kind" :class="kindClass"><text class="kind-text">{{ kind }}</text></div>
        <div class="row-copy">
            <text class="row-title">{{ title }}</text>
            <text class="row-subtitle">{{ subtitle }}</text>
        </div>
        <text class="row-meta">{{ meta }}</text>
        <text class="chevron">&gt;</text>
    </div>
</template>
<script>
export default {
    name: 'LibraryRow',
    props: {
        kind: { type: String, default: '书' },
        title: { type: String, required: true },
        subtitle: { type: String, default: '' },
        meta: { type: String, default: '' },
        accent: { type: Boolean, default: false }
    },
    computed: { kindClass() { return this.accent ? 'kind-accent' : 'kind-normal'; } }
}
</script>
<style lang="less" scoped>
@import "../styles/tokens.less";
.row { width: 670px; height: 44px; margin-bottom: 7px; padding: 7px 10px; border-radius: 11px; background-color: @panel; flex-direction: row; align-items: center; }
.row:active { background-color: @panel2; }
.kind { width: 40px; height: 40px; border-radius: 10px; align-items: center; justify-content: center; }
.kind-normal { background-color: @panel2; }
.kind-accent { background-color: @scanDark; }
.kind-text { color: @scan; font-size: 13px; font-weight: bold; }
.row-copy { width: 473px; padding-left: 12px; }
.row-title { color: @paper; font-size: 15px; line-height: 19px; font-weight: bold; text-overflow: ellipsis; overflow: hidden; }
.row-subtitle { margin-top: 2px; color: @muted; font-size: 10px; line-height: 13px; text-overflow: ellipsis; overflow: hidden; }
.row-meta { width: 125px; color: @muted; font-size: 11px; line-height: 15px; text-align: right; }
.chevron { width: 20px; color: @scan; font-size: 24px; line-height: 28px; text-align: right; }
</style>
