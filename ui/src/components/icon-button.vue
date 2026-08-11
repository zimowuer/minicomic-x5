<template>
    <div class="icon-button" :class="{ 'icon-button-active': active }" @click="$emit('click')">
        <image class="icon" :src="icon" />
        <text v-if="label" class="label" :class="{ 'label-active': active }">{{ label }}</text>
    </div>
</template>
<script>
export default {
    name: 'IconButton',
    props: { icon: { type: String, required: true }, label: { type: String, default: '' }, active: { type: Boolean, default: false } }
}
</script>
<style lang="less" scoped>
@import "../styles/tokens.less";
.icon-button { width: 52px; min-height: 50px; border-radius: 12px; background-color: @panel2; align-items: center; justify-content: center; }
.icon-button:active { background-color: @scanDark; }
.icon-button-active { background-color: @scanDark; border-width: 1px; border-style: solid; border-color: @scan; }
.label-active { color: @scan; }
.icon { width: 21px; height: 21px; }
.label { margin-top: 3px; color: @paper; font-size: 9px; line-height: 12px; text-align: center; }
</style>
