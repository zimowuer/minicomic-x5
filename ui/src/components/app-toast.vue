<template>
    <div v-show="show" class="toast"><text class="toast-text">{{ text }}</text></div>
</template>
<script>
export default {
    name: 'AppToast',
    data() { return { show: false, text: '', timer: null }; },
    created() {
        this.handler = event => {
            this.text = event && event.data ? event.data.text : '';
            this.show = true;
            clearTimeout(this.timer);
            this.timer = setTimeout(() => { this.show = false; }, 1600);
        };
        $falcon.on('comic-toast', this.handler);
    },
    beforeDestroy() { clearTimeout(this.timer); $falcon.off('comic-toast', this.handler); }
}
</script>
<style lang="less" scoped>
@import "../styles/tokens.less";
.toast { position: fixed; left: 230px; bottom: 12px; width: 340px; height: 42px; border-radius: 12px; background-color: @paper; align-items: center; justify-content: center; z-index: 30; }
.toast-text { color: @ink; font-size: 13px; line-height: 18px; font-weight: bold; }
</style>
