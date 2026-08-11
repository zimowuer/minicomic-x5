<template>
    <div class="screen">
        <NavRail label="返回" @back="back" />
        <div class="info-page">
            <div class="info-left">
                <image class="app-icon" :src="require('../../assets/app_icon.png?base64')" />
                <div class="info-brand"><text class="page-kicker">X5 COMIC READER</text><text class="info-title">横格漫画</text><text class="info-copy">为 800×258 横屏重新设计的漫画阅读器</text></div>
            </div>
            <div class="info-right">
                <div class="info-row"><text class="info-key">版本</text><text class="info-value">1.0.0</text></div>
                <div class="info-row"><text class="info-key">阅读</text><text class="info-value">本地 / 在线缓存 / 历史恢复</text></div>
                <div class="info-row"><text class="info-key">参考</text><text class="info-value">Doge 漫画网络版</text></div>
                <div class="license-button" @click="license"><text class="license-button-text">查看 AGPLv3 许可与来源说明</text><text class="license-arrow">›</text></div>
            </div>
        </div>
    </div>
</template>
<script>
import NavRail from '../../components/nav-rail.vue';
export default { name: 'info', components: { NavRail }, methods: { back() { this.$page.finish(); }, license() { $falcon.navTo('license'); } } }
</script>
<style lang="less" scoped>
@import "../../styles/common.less";
.info-page { width: 694px; height: 232px; padding: 13px 18px; background-color: @ink; flex-direction: row; }
.info-left { width: 310px; height: 232px; flex-direction: row; align-items: center; }
.app-icon { width: 86px; height: 86px; border-radius: 20px; }
.info-brand { width: 205px; margin-left: 16px; }
.info-title { margin-top: 3px; color: @paper; font-size: 25px; line-height: 31px; font-weight: bold; }
.info-copy { margin-top: 10px; color: @muted; font-size: 11px; line-height: 17px; }
.info-right { width: 364px; height: 210px; padding-top: 8px; }
.info-row { width: 364px; height: 38px; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: @line; flex-direction: row; align-items: center; }
.info-key { width: 68px; color: @scan; font-size: 11px; line-height: 16px; }
.info-value { width: 290px; color: @paper; font-size: 12px; line-height: 16px; }
.license-button { width: 340px; height: 47px; margin-top: 11px; padding: 0 12px; border-radius: 11px; background-color: @panel; flex-direction: row; align-items: center; justify-content: space-between; }
.license-button:active { background-color: @panel2; }
.license-button-text { color: @paper; font-size: 12px; line-height: 17px; }
.license-arrow { color: @scan; font-size: 24px; line-height: 28px; }
</style>
