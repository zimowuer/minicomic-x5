<template>
    <div class="screen">
        <NavRail label="返回" @back="back" />
        <div class="settings-page">
            <div class="settings-header"><div><text class="page-kicker">READER TUNING</text><text class="page-title">阅读设置</text></div><text class="saved">更改会立即保存</text></div>
            <div v-if="loading" class="settings-loading"><text class="muted">正在读取设置…</text></div>
            <div v-else class="settings-grid">
                <div class="setting-wide">
                    <div class="setting-copy"><text class="setting-title">默认页面宽度</text><text class="setting-desc">{{ scaleText }}% · 越小可同时看到更多页面</text></div>
                    <slider class="scale-slider" :min="60" :max="100" :step="5" :value="scalePercent" active-color="#56d6d2" background-color="#29404d" @change="onScaleChange"></slider>
                </div>
                <div class="setting-card">
                    <div class="setting-copy"><text class="setting-title">自动隐藏工具栏</text><text class="setting-desc">获得完整 800px 阅读宽度</text></div>
                    <ToggleSwitch :value="hidableSidebar" @change="setHidable" />
                </div>
                <div class="setting-card setting-left">
                    <div class="setting-copy"><text class="setting-title">调试信息</text><text class="setting-desc">显示分片、偏移和缩放</text></div>
                    <ToggleSwitch :value="isDebug" @change="setDebug" />
                </div>
                <div class="attribution-card" @click="openLicense">
                    <div class="setting-copy attribution-copy"><text class="setting-title">Doge 漫画网络版</text><text class="setting-desc">借鉴 Doge 漫画网络版的书库与缓存流程 · 查看出处与许可证</text></div>
                    <text class="attribution-action">查看 ›</text>
                </div>
            </div>
        </div>
        <AppToast />
    </div>
</template>
<script>
import NavRail from '../../components/nav-rail.vue';
import ToggleSwitch from '../../components/toggle-switch.vue';
import AppToast from '../../components/app-toast.vue';
import Storage from '../../utils/Storage/Storage.js';
const storage = new Storage();
export default {
    name: 'setting', components: { NavRail, ToggleSwitch, AppToast },
    data() { return { loading: true, scale: 1, hidableSidebar: false, isDebug: false }; },
    computed: { scalePercent() { return Math.round(this.scale * 100); }, scaleText() { return String(Math.round(this.scale * 100)); } },
    async created() {
        this.scale = await storage.get('scale');
        this.hidableSidebar = await storage.get('hidableSidebar');
        this.isDebug = await storage.get('isDebug');
        this.loading = false;
    },
    methods: {
        back() { this.$page.finish(); },
        sliderValue(event) { return event && event.detail ? event.detail.value : Number(event); },
        onScaleChange(event) { this.scale = this.sliderValue(event) / 100; storage.set('scale', this.scale); },
        setHidable(value) { this.hidableSidebar = value; storage.set('hidableSidebar', value); },
        setDebug(value) { this.isDebug = value; storage.set('isDebug', value); },
        openLicense() { $falcon.navTo('license'); }
    }
}
</script>
<style lang="less" scoped>
@import "../../styles/common.less";
.settings-page { width: 694px; height: 232px; padding: 13px 18px; background-color: @ink; }
.settings-header { width: 694px; height: 53px; flex-direction: row; align-items: center; justify-content: space-between; }
.saved { color: @muted; font-size: 11px; line-height: 16px; }
.settings-loading { width: 694px; height: 175px; align-items: center; justify-content: center; }
.settings-grid { width: 694px; height: 175px; flex-direction: row; flex-wrap: wrap; }
.setting-wide { width: 670px; height: 50px; padding: 10px 12px; border-radius: 12px; background-color: @panel; flex-direction: row; align-items: center; justify-content: space-between; }
.setting-card { width: 315px; height: 44px; margin-top: 9px; padding: 10px 12px; border-radius: 12px; background-color: @panel; flex-direction: row; align-items: center; justify-content: space-between; }
.setting-left { margin-left: 10px; }
.setting-copy { width: 245px; }
.attribution-card { width: 670px; height: 44px; margin-top: 9px; padding: 10px 12px; border-radius: 12px; background-color: @panel; flex-direction: row; align-items: center; justify-content: space-between; }
.attribution-card:active { background-color: @panel2; }
.attribution-copy { width: 570px; }
.attribution-action { color: @scan; font-size: 11px; line-height: 16px; font-weight: bold; }
.setting-title { color: @paper; font-size: 14px; line-height: 19px; font-weight: bold; }
.setting-desc { margin-top: 3px; color: @muted; font-size: 10px; line-height: 14px; }
.scale-slider { width: 310px; height: 32px; }
</style>
