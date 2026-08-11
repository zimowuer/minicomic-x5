<template>
    <div class="toggle" @click="change">
        <div :class="trackClass"></div>
        <div :class="thumbClass"></div>
    </div>
</template>
<script>
export default {
    name: 'ToggleSwitch',
    props: { value: { type: Boolean, default: false } },
    computed: {
        trackClass() { return this.value ? 'track-on' : 'track-off'; },
        thumbClass() { return this.value ? 'thumb-on' : 'thumb-off'; }
    },
    methods: { change() { this.$emit('change', !this.value); } }
}
</script>
<style lang="less" scoped>
@import "../styles/tokens.less";
.toggle { position: relative; width: 48px; height: 30px; }
.track-off { position: absolute; left: 0; top: 3px; width: 48px; height: 24px; border-radius: 12px; background-color: @line; }
.track-on { position: absolute; left: 0; top: 3px; width: 48px; height: 24px; border-radius: 12px; background-color: @scanDark; }
.thumb-off { position: absolute; left: 3px; top: 2px; width: 26px; height: 26px; border-radius: 13px; background-color: @muted; }
.thumb-on { position: absolute; left: 19px; top: 2px; width: 26px; height: 26px; border-radius: 13px; background-color: @scan; }
</style>
