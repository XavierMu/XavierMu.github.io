# 部署到 GitHub Pages

目标地址：**https://xaviermu.github.io**

---

## 先说一件事：仓库名必须是这个

GitHub 的规则是：**仓库叫 `XavierMu.github.io`，站点就部署在根路径 `https://xaviermu.github.io`**。

你原来那个 Hexo 博客用的正是这个仓库名（`git@github.com:XavierMu/XavierMu.github.io.git`）。

这意味着：**新站点会覆盖旧博客**。

### 三个选择

**A. 覆盖旧站（推荐，最简单）**

直接往 `XavierMu.github.io` 推。旧 Hexo 站会被替换掉。

「推上去不等于立刻生效」不是问题——GitHub Pages 有历史，但更实际的做法是：先在本地确认无误，再推。

旧内容不会丢失，因为它还在你自己的 `E:\Projects\Hexo-Blog` 目录里。

**B. 另起仓库，用二级路径**

仓库叫别的名字（如 `blog`），地址变成 `https://xaviermu.github.io/blog`。

需要改两处配置：

```js
// astro.config.mjs
export default defineConfig({
  site: 'https://xaviermu.github.io',
  base: '/blog',        // 新增
  ...
});
```

```ts
// src/data/site.ts
url: 'https://xaviermu.github.io',
base: '/blog',          // 需要配合改链接生成逻辑
```

而且所有内部链接都要加 `/blog` 前缀，改动面较大。

**C. 先推 Draft 分支验证**

推到 `draft` 分支，用 Vercel/Netlify 预览，确认后再合并到主仓库。多一层保险，但要多一个账号。

> 我的建议是 **A**。你的旧博客内容已在本地，且新站只有 3 篇是从旧站迁移的，风险可控。

---

## 前置检查（已替你完成）

| 检查项 | 状态 |
|---|---|
| `astro.config.mjs` 的 `site` | ✅ `https://xaviermu.github.io` |
| `src/data/site.ts` 的 `url` | ✅ 同上 |
| `public/robots.txt` 的 sitemap 地址 | ✅ 同上 |
| `packageManager` 字段 | ✅ `pnpm@10.26.0`（与 CI 一致） |
| 本地 git 仓库 | ✅ 已初始化，`main` 分支，1 次提交 |
| 构建验证 | ✅ 12 页，无错误无警告 |
| 占位符残留 | ✅ 无 `example.com` / `yourname` |

---

## 步骤一：在 GitHub 创建仓库

1. 打开 https://github.com/new
2. **Repository name** 填：`XavierMu.github.io`
   - 大小写不限，但**必须**是 `<你的用户名>.github.io` 这个格式
3. 选择 **Public**（Pages 免费版要求公开仓库）
4. **不要**勾选 "Add a README file"、"Add .gitignore"、"Choose a license"
   - 勾了会导致远程已有提交，和你本地的提交冲突，需要额外处理
5. 点 **Create repository**

如果是往**已有的** `XavierMu.github.io` 仓库推，跳过这步。

---

## 步骤二：关联远程并推送

在 `E:\Projects\Blog` 下执行：

```powershell
# 关联远程（如果之前没配过）
git remote add origin https://github.com/XavierMu/XavierMu.github.io.git

# 推送主分支
git push -u origin main
```

### 可能遇到的问题

**问题 1：远程已有内容，推送被拒**

```powershell
# 如果远程仓库里已有旧文件，且你确定要覆盖
git push -u origin main --force
```

> ⚠️ `--force` 会**永久覆盖**远程的 `main` 分支。如果那个仓库里还有你想保留的东西，先 clone 一份备份。

**问题 2：认证失败**

GitHub 从 2021 年起不再支持密码认证。你需要 **Personal Access Token**：

1. 打开 https://github.com/settings/tokens
2. **Generate new token (classic)**
3. 勾选 `repo` 权限，有效期自选
4. 生成后**立即复制**（只显示一次）
5. 推送时，用户名填 `XavierMu`，密码位置粘贴 token

更方便的方式是装 GitHub CLI：

```powershell
winget install --id GitHub.cli
gh auth login
```

之后 `git push` 会自动用凭据。

---

## 步骤三：开启 GitHub Pages

推送后，`.github/workflows/deploy.yml` 会自动触发构建。但**首次需要手动指定 Pages 的数据源**：

1. 打开仓库的 **Settings** → 左侧 **Pages**
2. **Build and deployment** → **Source** 选 **GitHub Actions**（不是 "Deploy from a branch"）
3. 保存

如果没做这步，工作流会报错：`Get Pages site failed. Please verify that the repository has Pages enabled`。

---

## 步骤四：确认部署成功

1. 打开仓库的 **Actions** 标签页
2. 应该看到一个叫 **Deploy to GitHub Pages** 的工作流正在运行
3. 点进去，确认两个 job（`build` 和 `deploy`）都是绿色对勾
4. 首次部署约 1–2 分钟

成功后访问 **https://xaviermu.github.io**

### 如果构建失败

| 错误 | 原因 | 处理 |
|---|---|---|
| `ERR_PNPM_OUTDATED_LOCKFILE` | lockfile 与依赖不一致 | 本地跑 `pnpm install` 后提交新的 lockfile |
| `Get Pages site failed` | Pages 未启用 | 回到步骤三 |
| `No files were found in dist` | 构建没产出 | 本地跑 `pnpm build` 确认能产出 `dist/` |
| `frozen-lockfile` 失败 | CI 的 pnpm 版本与 lockfile 不匹配 | 已在 `package.json` 固定 `packageManager`，应不会发生 |

---

## 日常更新流程

改完内容后：

```powershell
cd E:\Projects\Blog

git add -A
git commit -m "新增文章：xxx"
git push
```

推送到 `main` 后，Actions 会自动重新构建并部署，约 1–2 分钟生效。

**建议**：每次推之前先本地跑一次 `pnpm build`，能提前发现语法或 schema 错误，避免 CI 失败。

---

## 关于旧博客的遗留问题

你原来 Hexo 站的 URL 是 `https://womuule.github.io/2024/03/20/Clash-Verge使用教程/` 这种格式。

新站的 URL 是 `https://xaviermu.github.io/blog/clash-verge-tutorial/`。

**旧链接全部失效了**。如果有人收藏过你的文章，点进去会 404。

如果在意这一点，有两种补救：

**方案一：加跳转页**

在 `public/` 下建静态 HTML 做重定向。但旧 URL 有几十条，逐条写很麻烦。

**方案二：接受它**

个人站的旧链接流量通常很小，而且你在新站里有搜索和归档，找得到。

**注意**：`womuule.github.io` 这个域名和 `xaviermu.github.io` 不是同一个。如果旧站还在别处运行，那是另一回事；如果旧站就是 `XavierMu.github.io`，那么推上去旧站就没了，旧 URL 自然也就无从谈起。

---

## 可选：绑定自定义域名

如果你有自己的域名：

1. 在 `public/` 下新建文件 `CNAME`，内容就一行：`你的域名`
2. 域名商处添加 DNS 记录：
   - **A 记录**指向 `185.199.108.153`、`185.199.109.153`、`185.199.110.153`、`185.199.111.153`
   - 或 **CNAME** 指向 `xaviermu.github.io`
3. 在仓库 Settings → Pages 里填 Custom domain，勾选 **Enforce HTTPS**

同时要把 `astro.config.mjs` 和 `site.ts` 里的 `site`/`url` 改成新域名——否则 RSS 和 sitemap 里的链接还是旧地址。

**不需要备案**：只有服务器在中国大陆才需要，GitHub Pages 不需要。

---

## 参考链接

- 你的 GitHub：https://github.com/XavierMu
- 原博客：https://xaviermu.github.io/
- 原仓库：https://github.com/XavierMu/XavierMu.github.io
- GitHub Pages 文档：https://docs.github.com/pages
