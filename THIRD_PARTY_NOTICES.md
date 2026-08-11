# Third-party notices

## Doge comic network edition (doge-reader)

This application references and adapts the online library UI, comic-source integration, JM request/cache flow, and parts of the reader interaction from **Doge comic network edition (doge-reader)**.

- Upstream project: `adogecheems/doge-reader`
- Upstream repository: <https://github.com/adogecheems/doge-reader>
- Upstream author: `adogecheems`
- Upstream license: GNU Affero General Public License v3.0 (GNU AGPLv3)
- Local reference source: `doge-comic-net-main/`

This is not an official upstream build and does not represent the upstream author. X5 adaptation, 800x258 landscape layout, Falcon native file/HTTP APIs, favorites/history interaction, low-memory paging, image caching, and WebP-to-JPEG processing are modifications made in this project.

## WebP native module

`ui/libs/libjsapi_webp.so` is built in CI from `native/webp2jpg/` for the Youdao X5 ARMv7 hard-float/glibc runtime. It is not copied from the precompiled Doge library. The build downloads the decoder-only sources from libwebp 1.4.0 and the JPEG writer header from stb; see `native/webp2jpg/DEPENDENCIES.md` and the corresponding license files in this repository.

## Other included components

- **libwebp 1.4.0**: WebP decoder sources from the WebM Project, under the BSD 3-Clause license. See `LICENSE-LIBWEBP`.
- **stb_image_write.h**: JPEG writer by Sean Barrett, distributed under its public-domain/MIT dual-license notice. See `LICENSE-STB-IMAGE-WRITE`.
- `aiot-vue-cli/`: its `package.json` identifies the bundled build tool as MIT; its original notices are not replaced by this project.
- `tools/build.sh` and the vendored build work from `langningchen/miniapp`: the files retain their GPLv3 copyright and license headers.
- Original template code by `wang-lu-yuan`: the original MIT license text is preserved in `LICENSE-MIT`.

## License boundary

This project is released as GNU Affero General Public License v3.0 (GNU AGPLv3); the complete text is in `LICENSE`. The app exposes the same attribution and license information under Settings -> Doge comic network edition and About -> License and sources.

Third-party components remain subject to their respective licenses. This notice does not reduce any upstream copyright or license rights.
