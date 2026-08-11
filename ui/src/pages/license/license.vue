<template>
    <div class="screen">
        <NavRail label="返回" @back="back" />
        <div class="license-page">
            <div class="license-header">
                <div>
                    <text class="page-kicker">OPEN SOURCE</text>
                    <text class="page-title">许可与来源</text>
                </div>
                <text class="license-note">本应用为 X5 适配修改版<br/>Doge 漫画网络版 · AGPLv3<br/>按现状提供，不附带保证</text>
            </div>
            <div class="license-attribution">
                <text class="license-source-title">上游出处 · Doge 漫画网络版 · adogecheems</text>
                <text class="license-source-copy">github.com/adogecheems/doge-reader · GNU AGPLv3</text>
            </div>
            <scroller class="license-scroller" show-scrollbar="true">
                <text class="license-text">{{ license }}</text>
            </scroller>
        </div>
    </div>
</template>
<script>
import fs from '../../utils/x5-fs';
import NavRail from '../../components/nav-rail.vue';

export default {
    name: 'license',
    components: { NavRail },
    data() {
        return { license: '正在读取许可文件…' };
    },
    methods: {
        back() {
            this.$page.finish();
        },
        onShow() {
            fs.readFile(`${$workspace}/assets/license.txt`).then(data => {
                this.license = data;
            }).catch(() => {
                this.license = '本项目的漫画阅读器实现参考 Doge 漫画网络版，并随附 GNU Affero General Public License v3 文本。';
            });
        }
    }
};
</script>
<style lang="less" scoped>
@import "../../styles/common.less";
.license-page { width: 694px; height: 232px; padding: 13px 18px; background-color: @ink; }
.license-header { width: 694px; height: 53px; flex-direction: row; align-items: center; justify-content: space-between; }
.license-note { width: 330px; color: @muted; font-size: 10px; line-height: 15px; text-align: right; }
.license-attribution { width: 670px; height: 31px; padding: 4px 12px 0; background-color: @panel; }
.license-source-title { color: @paper; font-size: 10px; line-height: 14px; }
.license-source-copy { margin-left: 10px; color: @scan; font-size: 9px; line-height: 14px; }
.license-scroller { width: 694px; height: 118px; }
.license-text { width: 680px; padding-bottom: 20px; color: @muted; font-size: 11px; line-height: 16px; }
</style>
