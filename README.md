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
│  └─ projects/      *.md      项目
├─ content.config.ts           frontmatter schema（字段校验）
├─ data/site.ts                站点配置：标题、简介、导航、社交链接
├─ layouts/
│  ├─ Base.astro               全站骨架
│  ├─ Detail.astro             详情页骨架：正文居中 + 右侧目录
│  └─ Post.astro               文章页（套用 Detail）
├─ components/
│  ├─ Header.astro / Footer.astro
│  ├─ PostList.astro / ProjectCard.astro
│  ├─ PageHeader.astro / Icon.astro
│  └─ Toc.astro                目录（滚动高亮）
├─ utils/toc.ts                从渲染后 HTML 提取标题
├─ pages/
│  ├─ index.astro              首页
│  ├─ blog/index.astro         文章列表
│  ├─ blog/[...slug].astro     文章详情
│  ├─ blog/tag/[tag].astro     标签页
│  ├─ projects/                项目列表与详情
│  ├─ about.astro / 404.astro
│  └─ rss.xml.ts               RSS
└─ styles/
   ├─ tokens.css               设计变量（颜色/字体/间距）
   └─ global.css               基础样式 + 正文排版
```

## 版面规则

所有**长文页面**（文章详情、项目详情、关于）共用一套栅格，尺寸变量集中在 `tokens.css`：

| 变量 | 值 | 用途 |
|---|---|---|
| `--width-container` | `1080px` | 页面容器，与顶栏同宽 |
| `--width-aside` | `200px` | 右侧栏（目录 / 联系信息） |
| `--gap-aside` | `40px` | 正文与右栏间距 |

- **≥1280px**：正文填满剩余宽度 + 右栏，左右边缘与顶栏对齐；
- **<1280px**：右栏隐藏，正文单栏居中；
- 文章与项目的右栏是自动生成的目录，至少 2 个 h2 才显示；
- 列表页与首页不走这套栅格，它们本身就是满宽布局。

目录的高亮由 `Toc.astro` 内的 `IntersectionObserver` 驱动，无额外依赖。

## 写一篇新文章

在 `src/content/blog/` 下新建目录（目录名即 URL），放一个 `index.md`：

```yaml
---
title: 标题
description: 一句话摘要（120 字以内）
pubDate: 2026-11-08
tags: [分布式]
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

- `src/data/site.ts`：标题、简介、导航项、社交链接
- `src/styles/tokens.css`：配色、字号、间距

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
node scripts/verify.mjs       # 主题切换、死链、h1、移动端溢出
node scripts/verify-toc.mjs   # 目录：条目、锚点、滚动高亮、窄屏隐藏
node scripts/shoot.mjs        # 截图到 .tmp/shots/
```

前两个依赖 `pnpm preview` 已在 4322 端口运行；截图脚本还需要 Playwright 的 Chromium。
