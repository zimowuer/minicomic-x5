<template>
    <div :style="{ width: width, height: displayHeight }">
        <image v-if="segments <= 1" resize="stretch" :style="{ width: width, height: displayHeight }" :src="url"
            @load="onLoad" />
        <div v-else :style="{ width: width, height: displayHeight }">
            <image ref="source" class="source" :src="url" @load="onLoad" />
            <canvas ref="canvas" :width="pixelWidth" :height="pixelHeight"
                :style="{ width: width, height: displayHeight }" />
        </div>
    </div>
</template>

<script>
import { md5 } from '../utils/JMComic/crypto';

function imageInfo(url) {
    const online = url.match(/\/media\/photos\/(\d+)\/([^/?]+)/);
    if (online) return { chapterId: online[1], picture: online[2].replace(/\.[^.]+$/, '') };
    // Legacy .jpg caches are still scrambled; new .jpeg files are recombined natively.
    const local = url.match(/\/\d{3}_(\d+)_(.+)\.jpg$/i);
    return local ? { chapterId: local[1], picture: local[2] } : null;
}

function segmentation(info) {
    if (!info || Number(info.chapterId) < 220980) return 0;
    const id = Number(info.chapterId);
    if (id < 268850) return 10;
    const divisor = id > 421926 ? 8 : 10;
    const last = md5(`${info.chapterId}${info.picture}`).slice(-1).charCodeAt(0);
    return (last % divisor) * 2 + 2;
}

export default {
    name: 'JmImage',
    props: {
        url: { type: String, required: true },
        width: { required: true }
    },
    data() {
        return { naturalWidth: 100, naturalHeight: 142, segments: segmentation(imageInfo(this.url)) };
    },
    computed: {
        pixelWidth() { return Math.max(1, Math.round(Number(this.width))); },
        pixelHeight() { return Math.max(1, Math.round(this.pixelWidth * this.naturalHeight / this.naturalWidth)); },
        displayHeight() { return this.pixelHeight; }
    },
    methods: {
        onLoad(event) {
            const size = event.size || (event.detail && event.detail.size) || {};
            this.naturalWidth = size.naturalWidth || 1;
            this.naturalHeight = size.naturalHeight || 1;
            if (this.segments > 1) setTimeout(() => this.draw(), 0);
        },
        draw() {
            const canvas = this.$refs.canvas;
            const ctx = typeof createCanvasContext === 'function' ? createCanvasContext(canvas) : canvas.getContext('2d');
            const block = Math.floor(this.naturalHeight / this.segments);
            const remainder = this.naturalHeight % this.segments;
            let targetY = 0;
            for (let i = this.segments - 1; i >= 0; i--) {
                const sourceY = i * block;
                const sourceHeight = block + (i === this.segments - 1 ? remainder : 0);
                const targetHeight = sourceHeight * this.pixelHeight / this.naturalHeight;
                ctx.drawImage(this.$refs.source, 0, sourceY, this.naturalWidth, sourceHeight,
                    0, targetY, this.pixelWidth, targetHeight);
                targetY += targetHeight;
            }
        }
    }
};
</script>

<style scoped>
.source {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
}
</style>
