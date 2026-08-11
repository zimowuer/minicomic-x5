# X5 WebP build dependencies

The WebP module is rebuilt for the Youdao X5 ARMv7 hard-float/glibc runtime by
`build.sh`; it does not reuse the precompiled library from Doge.

CI downloads and pins:

- libwebp 1.4.0 decoder sources from the WebM Project release archive;
- `stb_image_write.h` from the upstream stb repository.

The resulting module is linked without a libc dependency so the miniapp runtime
resolves QuickJS, stdio, allocation and loader symbols. The X5 glibc toolchain
is still used for the ARMv7 hard-float ABI and libgcc support.
