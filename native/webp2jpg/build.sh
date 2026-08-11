#!/usr/bin/env bash
# Build the X5 ARMv7 WebP decoder module with the X5 glibc toolchain.
# Dependencies are downloaded by CI into native/vendor; no prebuilt Doge .so is used.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEBP_DIR="${WEBP_DIR:-$ROOT/native/vendor/libwebp-1.4.0}"
STB_DIR="${STB_DIR:-$ROOT/native/vendor}"
OUT_DIR="$ROOT/ui/libs"
BUILD_DIR="$ROOT/native/webp2jpg/build/x5-glibc"

if [[ -n "${CROSS_TOOLCHAIN_PREFIX:-}" ]]; then
  CROSS="${CROSS_TOOLCHAIN_PREFIX}"
else
  compiler="$(find -L "$ROOT/jsapi/toolchains" "$ROOT/tools" -type f -name 'arm-buildroot-linux-gnueabihf-gcc' -print -quit 2>/dev/null || true)"
  if [[ -z "$compiler" ]]; then
    echo "X5 ARMv7 glibc compiler not found" >&2
    exit 1
  fi
  CROSS="${compiler%gcc}"
fi
CC="${CROSS}gcc"
STRIP="${CROSS}strip"
READELF="${CROSS}readelf"

[[ -x "$CC" ]] || { echo "compiler is not executable: $CC" >&2; exit 1; }
[[ -d "$WEBP_DIR/src" ]] || { echo "libwebp source not found: $WEBP_DIR" >&2; exit 1; }
[[ -f "$STB_DIR/stb_image_write.h" ]] || { echo "stb_image_write.h not found: $STB_DIR" >&2; exit 1; }

mkdir -p "$OUT_DIR" "$BUILD_DIR" "$ROOT/native/webp2jpg/build"
rm -f "$BUILD_DIR"/*.o "$BUILD_DIR"/libjsapi_webp.so "$BUILD_DIR"/webp2jpg-armv7

# Keep this list explicit: it is the decoder-only subset of libwebp 1.4.0.
WEBP_SOURCES=(
  "$WEBP_DIR/src/dec/alpha_dec.c"
  "$WEBP_DIR/src/dec/buffer_dec.c"
  "$WEBP_DIR/src/dec/frame_dec.c"
  "$WEBP_DIR/src/dec/idec_dec.c"
  "$WEBP_DIR/src/dec/io_dec.c"
  "$WEBP_DIR/src/dec/quant_dec.c"
  "$WEBP_DIR/src/dec/tree_dec.c"
  "$WEBP_DIR/src/dec/vp8_dec.c"
  "$WEBP_DIR/src/dec/vp8l_dec.c"
  "$WEBP_DIR/src/dec/webp_dec.c"
  "$WEBP_DIR/src/dsp/alpha_processing.c"
  "$WEBP_DIR/src/dsp/cpu.c"
  "$WEBP_DIR/src/dsp/dec.c"
  "$WEBP_DIR/src/dsp/dec_clip_tables.c"
  "$WEBP_DIR/src/dsp/filters.c"
  "$WEBP_DIR/src/dsp/lossless.c"
  "$WEBP_DIR/src/dsp/rescaler.c"
  "$WEBP_DIR/src/dsp/upsampling.c"
  "$WEBP_DIR/src/dsp/yuv.c"
  "$WEBP_DIR/src/dsp/alpha_processing_neon.c"
  "$WEBP_DIR/src/dsp/dec_neon.c"
  "$WEBP_DIR/src/dsp/filters_neon.c"
  "$WEBP_DIR/src/dsp/lossless_neon.c"
  "$WEBP_DIR/src/dsp/rescaler_neon.c"
  "$WEBP_DIR/src/dsp/upsampling_neon.c"
  "$WEBP_DIR/src/dsp/yuv_neon.c"
  "$WEBP_DIR/src/utils/bit_reader_utils.c"
  "$WEBP_DIR/src/utils/color_cache_utils.c"
  "$WEBP_DIR/src/utils/filters_utils.c"
  "$WEBP_DIR/src/utils/huffman_utils.c"
  "$WEBP_DIR/src/utils/palette.c"
  "$WEBP_DIR/src/utils/quant_levels_dec_utils.c"
  "$WEBP_DIR/src/utils/random_utils.c"
  "$WEBP_DIR/src/utils/rescaler_utils.c"
  "$WEBP_DIR/src/utils/thread_utils.c"
  "$WEBP_DIR/src/utils/utils.c"
)

TARGET_FLAGS=(
  -mcpu=cortex-a7 -mfpu=neon-vfpv4 -mfloat-abi=hard
  -DWEBP_USE_THREAD=0 -DWEBP_HAVE_NEON=1
  -Os -fPIC -ffunction-sections -fdata-sections -fno-strict-aliasing
  -I"$WEBP_DIR" -I"$STB_DIR" -I"$ROOT/jsapi/iot-miniapp-sdk/include"
)

compile_object() {
  local source="$1"
  local object="$2"
  "$CC" "${TARGET_FLAGS[@]}" -fvisibility=hidden -c "$source" -o "$object"
}

module_objects=()
compile_object "$ROOT/native/webp2jpg/module.c" "$BUILD_DIR/module.o"
module_objects+=("$BUILD_DIR/module.o")
compile_object "$ROOT/native/webp2jpg/convert.c" "$BUILD_DIR/convert.o"
module_objects+=("$BUILD_DIR/convert.o")
for source in "${WEBP_SOURCES[@]}"; do
  object="$BUILD_DIR/$(basename "$source" .c).o"
  compile_object "$source" "$object"
  module_objects+=("$object")
done

# The miniapp runtime supplies QuickJS, stdio and allocation symbols. Keep the
# module self-contained and allow those runtime symbols to remain undefined.
"$CC" "${TARGET_FLAGS[@]}" -shared -nostdlib -static-libgcc \
  -Wl,--gc-sections -Wl,--unresolved-symbols=ignore-all \
  -Wl,-soname,libjsapi_webp.so "${module_objects[@]}" -o "$BUILD_DIR/libjsapi_webp.so"
"$STRIP" --strip-unneeded "$BUILD_DIR/libjsapi_webp.so"
cp "$BUILD_DIR/libjsapi_webp.so" "$OUT_DIR/libjsapi_webp.so"

# Also emit a standalone diagnostic converter; it is not packaged into the app.
cli_objects=()
compile_object "$ROOT/native/webp2jpg/main.c" "$BUILD_DIR/main.o"
cli_objects+=("$BUILD_DIR/main.o")
compile_object "$ROOT/native/webp2jpg/convert.c" "$BUILD_DIR/convert-cli.o"
cli_objects+=("$BUILD_DIR/convert-cli.o")
for source in "${WEBP_SOURCES[@]}"; do
  object="$BUILD_DIR/cli-$(basename "$source" .c).o"
  compile_object "$source" "$object"
  cli_objects+=("$object")
done
"$CC" "${TARGET_FLAGS[@]}" -static -pthread -Wl,--gc-sections "${cli_objects[@]}" -lm -o "$BUILD_DIR/webp2jpg-armv7"
"$STRIP" --strip-unneeded "$BUILD_DIR/webp2jpg-armv7"
cp "$BUILD_DIR/webp2jpg-armv7" "$ROOT/native/webp2jpg/build/webp2jpg-armv7"

"$READELF" -h "$OUT_DIR/libjsapi_webp.so" | grep -E 'Class:|Machine:|Flags:'
"$READELF" -d "$OUT_DIR/libjsapi_webp.so" | grep -E 'SONAME|NEEDED' || true
"$READELF" -Ws "$OUT_DIR/libjsapi_webp.so" | grep -E 'custom_init_jsapis' | head -n 1
ls -l "$OUT_DIR/libjsapi_webp.so" "$BUILD_DIR/webp2jpg-armv7"
