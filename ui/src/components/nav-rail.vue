<template>
    <div class="rail">
        <div class="rail-top">
            <div class="rail-button" @click="$emit('back')">
                <image class="rail-icon" :src="require('../assets/back.png?base64')" />
            </div>
            <text class="rail-label">{{ label }}</text>
        </div>
        <slot />
    </div>
</template>

<script>
export default {
    name: 'NavRail',
    props: { label: { type: String, default: '杩斿洖' } }
}
</script>

<style lang="less" scoped>
@import "../styles/tokens.less";
.rail { width: 52px; height: 234px; padding: 12px 9px; background-color: @panel; justify-content: space-between; align-items: center; }
.rail-top { width: 52px; align-items: center; }
.rail-button { width: 46px; height: 46px; border-radius: 12px; background-color: @panel2; align-items: center; justify-content: center; }
.rail-button:active { background-color: @scanDark; }
.rail-icon { width: 22px; height: 22px; }
.rail-label { margin-top: 7px; color: @muted; font-size: 11px; line-height: 15px; text-align: center; }
</style>
