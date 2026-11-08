# 个人站点

基于 [Astro](https://astro.build) 的极简个人网站：文章、项目、关于。

## 快速开始

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # 输出到 dist/
pnpm preview      # 预览生产构建
```

要求 Node >= 22.23.4。

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
│  ├─ Toc.astro                目录（滚动高亮）
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
| `--width-prose` | `68ch`（约 638px） | 正文列宽，中英文混排约 34 字/行 |
| `--width-aside` | `200px` | 右侧栏（目录 / 联系信息） |
| `--gap-aside` | `64px` | 正文与右栏间距 |

- **≥1280px**：正文 + 右栏两栏，整组在容器内**精确居中**；
- **<1280px**：右栏隐藏，正文单栏居中；
- 文章与项目的右栏是自动生成的目录，至少 2 个 h2 才显示；
- 列表页与首页不走这套栅格，它们本身就是满宽布局。

目录的高亮由 `Toc.astro` 内的 `IntersectionObserver` 驱动，无额外依赖。

## 写一篇新文章

在 `src/content/blog/` 下新建 `.md`，文件名即 URL：

```yaml
---
title: 标题
description: 一句话摘要（120 字以内）
pubDate: 2026-11-08
tags: [分布式]
---
```

字段写错或类型不对，构建会直接报错——这是 schema 存在的意义。

## 加一个项目

在 `src/content/projects/` 下新建 `.md`：

```yaml
---
title: 项目名
description: 一句话说明
year: 2026
role: 独立开发
stack: [Go, Raft]
repo: https://github.com/...
featured: true      # 是否进首页
order: 1            # 首页排序
---
```

## 个性化

改 `src/data/site.ts`：标题、简介、导航项、社交链接都在这里。
改 `src/styles/tokens.css`：配色、字号、间距。

## 上线前

1. `astro.config.mjs` 里把 `site` 改成实际域名（影响 RSS、sitemap、canonical）；
2. `src/data/site.ts` 里把 `url` 同步改成同样的域名；
3. `public/robots.txt` 里的 sitemap 地址也要改；
4. 仓库 Settings → Pages → Source 选 **GitHub Actions**。

若部署到 `username.github.io/<repo>`（非根路径），还需要在 `astro.config.mjs` 加 `base: '/repo'`。

## 从 Hexo 迁移

已有 3 篇文章从旧 Hexo 站迁移而来（`scripts/` 下有完整工具链）：

```bash
node scripts/list-hexo.mjs        # 列出 Hexo 全部文章与元数据
node scripts/migrate-hexo.mjs     # 转换选定文章（改脚本内 PICK 列表）
node scripts/normalize-content.mjs # 按写作规范整理
```

迁移做了这些转换：

| Hexo | Astro |
|---|---|
| `categories` / `tags` | 合并为 `tags` |
| frontmatter 无 `date` | 从 `db.json` 取，按 UTC+8 还原为本地日期 |
| `{% img /image/x.png "说明" %}` | `![说明](./assets/x.png)` |
| `<!-- more -->` | 删除（摘要改为 frontmatter 的 `description`） |
| 裸 `/image/...` 路径 | 相对路径 `./assets/...` |
| 旧站绝对链接 | 映射为站内链接 |

**图片按 Astro 范式处理**：放进文章的 `assets/` 目录，用相对路径引用，构建时由 `astro:assets` 自动完成——
PNG/JPEG 转 WebP（本次 20.4 MB → 2.8 MB）、注入 `width`/`height` 消除布局偏移、`loading="lazy"`、内容哈希文件名。

### 写作规范

迁移脚本会强制执行以下规范，新写文章也建议遵守：

- **标题层级**：从 `##` 起，不跳级（`##` → `###` → `####`）
- **标题内不加粗**：`## **标题**` 是冗余的，`##` 本身已经强调
- **中英文之间加空格**：`使用 Windows 系统`，不是 `使用Windows系统`
- **专有名词不拆分**：`微PE`、`TVBox`、`Clash Verge` 保持连写
- **图片文件名用语义化英文**：`win-setup-language.png`，不要 `语言选择.png`（避免 URL 编码）
- **图片必须带 alt 文本**：截图用一句说明这张图在讲什么

## 验证脚本

```bash
node scripts/verify.mjs           # 主题切换、死链、h1、移动端溢出
node scripts/verify-migrated.mjs  # 迁移文章：图片优化、标题层级、Hexo 残留
node scripts/verify-toc.mjs       # 目录：条目、锚点、滚动高亮、窄屏隐藏
node scripts/shoot.mjs            # 截图到 .tmp/shots/
```

前三个依赖 `pnpm preview` 已在 4322 端口运行；截图脚本还需要 Playwright 的 Chromium。

## 后续可做

- 补充 `about` 页的真实信息（当前是占位）
- 站点标题、作者、GitHub 用户名仍在 `src/data/site.ts` 里，需替换
- 视需要迁移 Hexo 其余文章（改 `scripts/migrate-hexo.mjs` 的 `PICK` 即可）

