# 个人站点

基于 [Astro](https://astro.build) 的极简个人网站：文章、项目、关于。

- 线上地址：https://xaviermu.github.io
- 仓库：https://github.com/XavierMu/XavierMu.github.io

## 快速开始

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # 输出到 dist/
pnpm preview      # 预览生产构建
```

要求 Node >= 22.23.4，pnpm 10。

## 目录

```
src/
├─ content/
│  ├─ blog/          *.md      文章
│  ├─ projects/      *.md      项目
│  └─ pages/         *.md      单页（关于）
├─ content.config.ts           frontmatter schema（字段校验）
├─ data/
│  ├─ site.ts                  站点配置：标题、简介、导航、社交链接
│  └─ series.ts                系列定义：标题、简介、配色、短标签
├─ layouts/
│  ├─ Base.astro               全站骨架
│  ├─ Detail.astro             详情页骨架：章节目录 + 正文 + 本页目录
│  └─ Post.astro               文章页（套用 Detail）
├─ components/
│  ├─ Header.astro / Footer.astro
│  ├─ PostList.astro / ProjectCard.astro
│  ├─ PageHeader.astro / Icon.astro
│  ├─ SeriesCard.astro         系列卡片（顶边一条系列色）
│  ├─ SeriesNav.astro          文章页左栏的系列章节导航
│  ├─ SearchModal.astro        全站搜索模态框
│  └─ Toc.astro                目录（滚动高亮）
├─ utils/
│  ├─ toc.ts                   从渲染后 HTML 提取标题
│  └─ tone.ts                  由系列 / 标签 / 标题派生出稳定的色调
├─ pages/
│  ├─ index.astro              首页
│  ├─ blog/index.astro         文章列表
│  ├─ blog/[...slug].astro     文章详情
│  ├─ blog/tag/[tag].astro     标签页
│  ├─ series/index.astro       系列列表
│  ├─ series/[id].astro        系列详情（章节列表）
│  ├─ projects/                项目列表与详情
│  ├─ about.astro / 404.astro / search.astro
│  └─ rss.xml.ts               RSS
└─ styles/
   ├─ tokens.css               设计变量（颜色/字体/间距）
   └─ global.css               基础样式 + 正文排版
```

## 版面规则

视觉语言：近黑前景色、发丝级分隔线、等宽小标签（kicker）、64px 背景网格、
56px 半透明顶栏、6px 控件圆角、1280px 内容宽度。

所有**长文页面**共用一套栅格，尺寸变量集中在 `tokens.css`：

| 变量 | 值 | 用途 |
|---|---|---|
| `--width-container` | `1280px` | 页面容器，与顶栏同宽 |
| `--width-prose` | `42rem`（672px） | 正文列最大行宽，约 42 个汉字一行 |
| `--width-rail` | `220px` | 详情页左栏（系列目录 / 本篇文章 / 项目信息） |
| `--width-toc` | `200px` | 详情页右栏（本页目录） |
| `--width-aside` | `220px` | 索引页右侧栏（归档 / 标签 / 项目 / 关于） |
| `--gap-aside` | `48px` | 正文与右栏间距 |
| `--nav-height` | `56px` | 顶栏高度，sticky 偏移也用它 |

详情页**每个都带左栏**，左右留白由栅格自动均分：

| 情形 | 宽屏栅格（≥1280px） |
|---|---|
| 普通文章 | 左栏：本篇文章 · 正文 · 右栏：本页目录 |
| 属于某系列的文章 | 左栏：系列章节 + 本篇文章 · 正文 · 右栏：本页目录 |
| 项目详情 | 左栏：项目信息 + 链接 · 正文 · 右栏：本页目录 |

- 三轨宽度固定（220 / `1fr` / 200），正文在自己的 `1fr` 轨道里 `margin-inline: auto` 居中，
  所以 `220 + 672 + 200` 之后剩下的空间永远左右各一半——1440px 下是 70px / 70px；
- 左栏宽度固定，不能让正文居中后左栏跟着缩，否则「左右均匀」会随视口漂移；
- 正文列在任何断点都不超过 `--width-prose`，多出来的空间留白，不撑满；
- **<1280px**：左栏与右栏一起隐藏（三轨需要约 1200px 才放得下），正文单栏居中；
  原本只存在于左栏的信息（发布/更新/阅读、项目年份/技术栈/链接）在头部保留一份，
  ≥1280px 时头部那份再隐藏——任何宽度下都只有一份，不会重复也不会丢；
- 目录至少 2 个 h2 才显示；
- 归档 / 标签 / 项目 / 关于走左对齐列，避免与 `/blog` 这类满宽页切换时标题横向跳动。

栅格本身定义在 `global.css` 的 `.detail-grid` / `.detail-main` / `.detail-aside`，
左栏容器 `.detail-rail` 在 `Detail.astro`，页面里不要再重复声明。

> 详情页的 H1 位于第二列，不再是容器左边缘；`scripts/verify-gutter.mjs` 因此改为
> 比较「首列」（详情页取左栏、索引页取 H1）与 logo 的左边缘。

### 顶栏

- 高度 `--nav-height`（56px），**半透明**：`color-mix(in srgb, var(--bg) 85%, transparent)`
  + `backdrop-filter: blur(20px) saturate(1.6)`。正文从下面透出来一层，细节被糊掉，
  文字仍然清晰。不支持 `backdrop-filter` 的环境退回实心底色（`@supports not` 兜底），
  否则半透明会糊成一片。
- 右侧动作顺序：搜索（`min-width: 9.5rem`，看起来像个输入框，`/` 键标贴右）→ 社交
  （`site.social`：GitHub / RSS）→ 主题 → 菜单。≤720px 时搜索收成 2rem 图标。
- **≤880px**：文字导航整列收进 `<details>` 汉堡面板，图标动作留在栏内（320px 也放得下）。
  面板 `position: absolute` 挂在 `.site-header` 下沿并**铺满剩余视口高度**
  （`height: calc(100dvh - 100%)`；不要写死 `100dvh - var(--nav-height)`，顶栏的 1px
  下边框算在 border-box 里，`top: 100%` 实际落在 55px，底部会露 1px）。
  面板顶部是 6 条导航，底部用 `margin-top: auto` 压一行站点简介 + 「关于本站」。
  原生 details 只管开合，「点空白 / Esc 关闭」由 `Header.astro` 里的一小段脚本补上；
  作者样式写了 `display` 就必须自己补 `.menu:not([open]) .menu-panel { display: none }`，
  否则浏览器对 closed details 的隐藏会被盖掉。
- 详情页左右栏的 `sticky top` 必须等于「顶栏高 + `.site-main` 上内边距（`--space-7`）」，
  与栏目的自然位置重合；写小了页面一滚动栏目会先滑 17px 再吸住，看着像抖一下。

### 中文字体与字距

字体栈**先拉丁后中文**：`-apple-system / Segoe UI` 优先吃掉 ASCII，
`PingFang SC / HarmonyOS Sans SC / MiSans / Source Han Sans SC / 微软雅黑` 兜住汉字。
混在一条栈里如果中文在前，标题中的英文会被中文字体接管，字形明显发糊。

标题的 `letter-spacing` 默认取 `--tracking-cjk`（0）：汉字是满格方块，
拉丁字体那套 −0.02em 的紧排会把中文笔画挤到一起。负字距只留给纯拉丁/数字元素。

顶栏与页脚的字标（「慕」）是唯一例外：走衬线栈
（`Source Han Serif SC / Noto Serif SC / STZhongsong / Songti SC / SimSun`），
字号也放大到 `1.35rem`，再用 `-webkit-text-stroke: 0.35px` 补一层极细描边——
宋体在 20px 上下横画偏细，不补描边会比旁边的导航字还轻，看着像没加粗。

> 注意：不要在全局用 `:lang(zh) h1` 这类选择器覆盖组件字距——组件里的
> `.post-title[data-astro-cid-x]` 带 scoped 属性，优先级更高，覆盖会被静默忽略。
> 要在源头（组件自己的样式里）给对值。

### 主要设计变量

| 类别 | 变量 |
|---|---|
| 文字层级 | `--fg` / `--fg-muted` / `--fg-faint`（三级均过 WCAG AA） |
| 分隔线 | `--line-faint` / `--line` / `--line-strong` |
| 圆角 | `--radius`（控件 6px）/ `--radius-card`（卡片 10px）/ `--radius-surface`（窗口 14px） |
| 序号 | `--text-2xs` 11px … `--text-3xl` 34px，首屏用 `--text-display`（40–56px 自适应） |
| 系列配色 | `--tone-{blue,green,violet,amber,rose}` + 对应 `-bg`，深浅主题各一套 |

全局可复用的类：`.btn` / `.btn--primary` / `.tag` / `.badge` / `.card` /
`.kicker` / `.display` / `.link-arrow` / `.section-head` / `.series-chip` / `.tone-*`。

**正文链接与系列标识是站内仅有的彩色**，其余界面保持无彩色。

## 首页与列表

### 首页分区

首页由四段组成，顺序固定：**最近文章 → 系列 → 项目 → 概览**。每段顶部是一条
发丝线（`.section` 的 `border-top`），标题上方是带两位编号的 kicker
（`01 RECENT` / `02 SERIES` / `03 PROJECTS` / `04 OVERVIEW`），编号用 `--line-strong`
压淡，只做定位用、不抢视线。

### 文章列表（`PostList.astro`）

两列：内容列 → 悬停才出现的箭头。日期不再单独占一列，
而是并进标题上方那行等宽元信息：

```
2026.11.11 · 24 分钟 · ROOT 01 · 更新
```

系列代码取该篇的 `--tone` 颜色，是列表里唯一的彩色。**「更新」只是淡字**，
不做成描边徽标——几乎每篇都改过，徽标会在列表里连成一片噪音。

| Prop | 默认 | 说明 |
|---|---|---|
| `posts` | — | 文章集合 |
| `showTags` / `showDescription` | `true` | 是否显示标签行 / 摘要 |

### 项目卡片（`ProjectCard.astro`）

卡片只靠排版分层：标题 + 年份、简介、角色/状态、技术栈、底部一条发丝线隔开的链接行。
配色由**标题**哈希派生，不用 `stack[0]`——两个项目的首个技术栈常常相同，
相邻卡片会撞成同一个颜色。

### 标签页

标签不是单行药丸，而是等宽方格（`.tag-tile`）：`#标签` + 篇数 + 底部 3px 色条，
色条长度 = 该标签篇数 / 最多篇数。只有八九个标签时，单行 chip 会剩下半屏空白，
方格能均匀铺满，也让"哪个标签写得最多"一眼可比。

### 配色派生（`src/utils/tone.ts`）

没有指定系列的内容也要有稳定的视觉标识，用 FNV-1a 哈希把字符串映射到
五种色调之一：

| 函数 | 输入 | 用途 |
|---|---|---|
| `visualFor(seriesId, fallback)` | 系列 id，回退字符串 | 系列用自身配色，其余按字符串哈希 |
| `visualForPost(post)` | 第一个标签，没有则文章 id | 列表里的系列代码颜色 |

色调只做强调，不铺底色：系列卡片用一条 2px 顶边，列表里用系列代码的文字颜色。

## 搜索


全站常驻的**搜索模态框**（`SearchModal.astro`，挂在 `Base.astro` 上）：

- 任意页面按 <kbd>/</kbd> 或 <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> 唤起，不用跳页；
- 首次打开时才懒加载 Pagefind 运行时，不拖慢首屏；
- <kbd>↑</kbd><kbd>↓</kbd> 选择、<kbd>Enter</kbd> 打开、<kbd>Esc</kbd> 关闭，点背景也关；
- 结果用站点自己的样式渲染（不用 Pagefind 默认皮肤），摘要高亮命中词。

`/search` 页保留为**降级入口**：无 JS 时可用，也可以直接把链接发给别人。

> 模态框里的结果节点是脚本 `innerHTML` 注入的，**不带 Astro 的 `data-astro-cid` 属性**，
> 所以它们的样式必须写在 `:global()` 里，否则完全不生效。

## 系列（Series）

把相关的文章按一条主线串起来，在文章页左侧给出章节列表。

- 系列定义在 `src/data/series.ts`：标题、简介、`tone`（配色）、`code`（短标签）；
- 文章通过 frontmatter 的 `series` + `seriesOrder` 归属到系列；
- `/series` 列出全部系列与不属于任何系列的独立文章；
- `/series/<id>` 是该系列的章节总览；
- 属于系列的文章，详情页左栏会出现章节导航（当前章高亮 + 进度条 + 上一章/下一章）。

新增一个系列：在 `series.ts` 里加一条定义，再把相关文章标上 `series: <id>` 即可，
组件不用改。

## 写一篇新文章

在 `src/content/blog/` 下新建目录（目录名即 URL），放一个 `index.md`：

```yaml
---
title: 标题
description: 一句话摘要（120 字以内）
pubDate: 2026-11-08
tags: [分布式]
series: network        # 可选：所属系列 id（见 src/data/series.ts）
seriesOrder: 3         # 可选：系列内第几章，从 1 开始
---
```

图片放在同目录的 `assets/` 下，用相对路径引用：

```markdown
![说明](./assets/screenshot.png)
```

构建时由 `astro:assets` 自动转 WebP、注入宽高、加懒加载。

字段写错或类型不对，构建会直接报错——这是 schema 存在的意义。

### 写作规范

- **标题从 `##` 起**，不跳级（`##` → `###` → `####`）
- **标题内不加粗**：`##` 本身已是强调
- **中英文之间加空格**：`使用 Windows 系统`
- **专有名词不拆**：`微PE`、`TVBox`、`Clash Verge` 保持连写
- **图片名用语义化英文**：`win-setup-language.png`，避免 URL 编码
- **图片必须有 alt**：一句话说明这张图在讲什么

## 加一个项目

在 `src/content/projects/` 下新建 `.md`：

```yaml
---
title: 项目名
description: 一句话说明
year: 2026
role: 独立开发
status: 维护中
stack: [Go, Raft]
repo: https://github.com/...
featured: true      # 是否进首页
order: 1            # 首页排序
---
```

## 个性化

- `src/data/site.ts`：标题、首屏 badge、简介、导航项、社交链接、界面文案
- `src/data/series.ts`：系列的名称、简介、配色与短标签
- `src/styles/tokens.css`：配色、字号、间距、圆角、阴影、网格、系列色调

顶栏的「搜索」不占导航名额（`site.nav` 里仍保留，页脚会用它），
右侧渲染成一个按钮，点开的是全站共用的搜索模态框。

## 部署

推送到 `master` 分支即自动部署（`.github/workflows/deploy.yml`）：

```bash
git add -A
git commit -m "新增文章：xxx"
git push
```

约 1–2 分钟后生效。推送前建议本地跑一次 `pnpm build` 提前发现问题。

仓库 Settings → Pages → Source 需选 **GitHub Actions**。

> 若本机 SSH 的 22 端口被代理软件拦截，可在 `~/.ssh/config` 里让 github.com 走 443：
>
> ```
> Host github.com
>     HostName ssh.github.com
>     Port 443
>     User git
> ```

## 验证脚本

```bash
node scripts/verify.mjs         # 主题切换、死链、h1、正文 Markdown 残留、移动端溢出
node scripts/verify-toc.mjs     # 目录：条目、锚点、滚动高亮、窄屏隐藏
node scripts/verify-gutter.mjs  # 滚动条留白：各页「首列」左边缘是否与 logo 一致
node scripts/verify-search.mjs  # 搜索模态框：唤起、键盘导航、跳转、关闭、重置
node scripts/shoot.mjs          # 截图到 .tmp/shots/
```

前三个依赖 `pnpm preview` 已在 4322 端口运行；截图脚本还需要 Playwright 的 Chromium。

> 已知：`verify.mjs` 会报 `sdust-webvpn-guide` 里有 Markdown 残留 `**`。
> 原因是 `**山东科技大学（SDUST）**` 这类加粗紧贴中文时 CommonMark 不识别，
> 属于文章内容的写法问题，改写法即可（在 `**` 前后留空格或改用 HTML `<strong>`）。
