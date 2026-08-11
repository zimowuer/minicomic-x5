# 横格漫画 · 有道翻译笔 X5 漫画阅读器

漫画阅读器的大部分功能实现参考并迁移自 **Doge 漫画网络版 / doge-reader**（作者 `adogecheems`，上游仓库：<https://github.com/adogecheems/doge-reader>），其 README 声明使用 **GNU Affero General Public License v3.0**。本项目对迁移代码进行了 X5 分辨率、低内存分片、界面、存储和错误处理适配；doge漫画网络版仓库：https://github.com/GuaiRenGR/doge-comic-net   应用内“设置 → Doge 漫画网络版”也提供了出处入口。

> 当前构建目标仅为 X5：ARMv7、glibc。仓库中的 `ui/libs/libjsapi_webp.so` 也是该架构的原生模块，请勿直接把同一个包用于 A6P、P5 或其他架构设备。

## 功能

- 浏览 `/userdisk/Favorite` 下的图片和漫画文件夹
- 支持单张图片、连续图片文件夹阅读
- JPG、JPEG、PNG、GIF、BMP 图片识别
- 每次只渲染 4 页，降低 X5 的内存压力
- 阅读段落、滚动偏移和缩放比例自动保存
- 最近阅读、完整历史、收藏与一键清空
- 60%～100% 页面宽度调节
- 可隐藏左侧工具轨，使用完整 800px 阅读宽度
- 联网漫画搜索、章节缓存和整本下载
- 内置横屏虚拟键盘，无需依赖系统输入法
- WebP 图片通过 ARMv7 原生模块转换为 JPEG
- JM 图片分块还原显示

## X5 界面适配

界面没有沿用手机竖屏布局，而是针对 800×258 的极宽屏幕重新组织：

- 左侧工具轨外宽 70px，右侧内容区外宽 730px
- 使用固定像素宽高，符合 Falcon UI 对 `scroller` 和 `image` 的限制
- 使用单类选择器和 Falcon UI 支持的 LESS/CSS 子集
- 首页采用“翻译笔扫描线”视觉语言，使用石墨黑、扫描青和页码琥珀配色
- 列表、设置、虚拟键盘和阅读调节面板都按 258px 屏高压缩排布

## 漫画目录格式

把漫画复制到：

```text
/userdisk/Favorite/
```

推荐每部漫画使用一个单独文件夹，图片名使用自然顺序：

```text
/userdisk/Favorite/
└── 示例漫画/
    ├── 001.jpg
    ├── 002.jpg
    ├── 003.png
    └── 004.jpg
```

文件夹中超过约 80% 的条目为支持的图片格式时，会在本地书库中标记为漫画并直接打开。普通文件夹可以继续进入浏览；单张图片也可以直接阅读。

## 操作说明

### 首页与书库

- 左上角：退出或返回
- 左侧按钮：首页、设置、关于、清空等页面操作
- 本地书库：点击漫画文件夹或图片开始阅读
- 联网书库：点击输入框或“键盘”按钮打开内置键盘

### 阅读器

- 右上角收藏：点按加入收藏，再点一次取消收藏
- 上段 / 下段：每段最多 4 张图片
- 调节：设置页面宽度和快速跳转段落
- 若启用“自动隐藏工具栏”，点击漫画区域可显示或隐藏左侧工具轨
- 返回时会保存当前段落、滚动位置和手动缩放比例

## 本地构建

### 环境

- Node.js 18+
- pnpm 10.12.4

### 仅打包 UI

已安装依赖时可直接执行：

```bash
pnpm -C ui package
```

生成文件位于：

```text
ui/8001749644971193.1_0_0.amr
```

首次构建先安装依赖：

```bash
pnpm install -C ui
pnpm -C ui package
```

构建器可能提示未静态找到 `storage`、`fs`、`http`、`webp`。前三项由词典笔运行环境提供，`webp` 对应的 X5 原生库已放在 `ui/libs/libjsapi_webp.so`；只要最终显示“打包成功”，该提示不是前端编译错误。

### 完整 X5 构建

Linux 或 GitHub Actions 中可使用 `tools/build.sh`。需要先把 X5 的 ARMv7 glibc 工具链解压到 `jsapi/toolchains/`，并把 X5 `versionInfo` 解压到 `jsapi/`，然后执行：

```bash
./tools/build.sh -a
```

最终安装包会复制到 `dist/`。仓库中的 GitHub Actions 已改为只构建 X5，避免把 ARMv7 WebP 原生库装进错误架构的包。

## 安装到 X5

设备已具备 ADB 和 `miniapp_cli` 使用条件时：

```bash
adb push ui/8001749644971193.1_0_0.amr /userdisk/Favorite/x5-comic-reader.amr
adb shell "miniapp_cli install /userdisk/Favorite/x5-comic-reader.amr"
```

安装完成后可从设备桌面启动“横格漫画”。不同系统版本的 ADB 获取方式和安装权限可能不同，请以设备当前环境为准。

## 联网功能说明

联网漫画源和站点接口可能随时变化，也可能受到地区网络、账号、证书或站点风控影响。哔咔源需要用户自己的账号；登录令牌和阅读记录保存在设备本地。请遵守所在地法律、站点规则和内容授权要求，本项目不提供或托管漫画内容。

## 目录结构

```text
├── ui/
│   ├── src/pages/          # 首页、文件、阅读、历史、收藏、联网、设置等页面
│   ├── src/components/     # X5 横屏组件
│   ├── src/utils/          # 阅读器、文件管理、存储和漫画源
│   ├── libs/               # X5 ARMv7 原生 WebP 模块
│   └── assets/             # 图标和 AGPLv3 文本
├── doge-comic-net-main/    # 用户提供的参考项目
├── jsapi/                  # 原生 JSAPI 构建工程
├── tools/build.sh          # 完整交叉编译与打包脚本
└── 知识.txt                # Falcon UI/词典笔开发约束资料
```

## 来源与许可

漫画阅读器的大部分功能实现参考并迁移自 **Doge 漫画网络版 / doge-reader**（作者 `adogecheems`），其 README 声明使用 **GNU Affero General Public License v3.0**。本项目对迁移代码进行了 X5 分辨率、低内存分片、界面、存储和错误处理适配。

模板与构建脚本还包含 `langningchen/miniapp`、`penosext/miniapp` 等项目的工作成果；相关文件中保留了原有版权和许可说明。

本项目整体按 **GNU Affero General Public License v3.0** 发布，完整文本见根目录 `LICENSE` 和应用内“许可与来源”页面。
