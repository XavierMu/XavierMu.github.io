---
title: SDUST WebVPN 本地透明代理
description: 在校外用校内原始地址直接访问学校资源，无需打开 WebVPN 门户、无需手动点改写链接。
year: 2026
role: 独立开发
status: 维护中
stack: [Tauri 2, Rust, Windows]
repo: https://github.com/XavierMu/sdust-webvpn-desktop
guide: sdust-webvpn-guide
featured: true
order: 1
---

学校用的是**网瑞达 WebVPN**（clientless 反向代理）：所有资源都被改写成
`https://webvpn.sdust.edu.cn/https/<hex>/<path>` 这种形式，只能在门户里点着用。

于是校外的日常开发就变得很别扭——`git clone` 要手动复制改写后的地址，
`pip install` 校内源要改 index-url，页内跳转全是 webvpn 前缀，登录态过期还要重新输入。

这个项目做的事：**在本机跑一个代理，把命中白名单的请求自动改写成 WebVPN 形式并转发，
再把响应里的链接、Location、Set-Cookie 还原成原始地址**。站外流量直连，不影响速度。

## 核心思路

```
浏览器 / 命令行工具
        │  原始地址：https://gitlab.sdust.edu.cn/xxx
        ▼
   ┌─────────────┐
   │  本地代理    │  白名单命中？
   └──────┬──────┘
          │ 是：改写成 /https/<hex>/<path> 转发
          ▼
   webvpn.sdust.edu.cn  →  校内真实资源
          │
          ▼  响应原路返回，链接 / Location / Cookie 还原
```

HTTPS 需要做中间人解密，否则无法改写页面里的链接，因此项目会生成本地 CA 证书。

## 特性

- **透明代理**：白名单命中走 WebVPN，其余直连；支持 PAC 与全局两种模式
- **浏览器开箱即用**：浏览器读 Windows 系统代理，无需额外配置
- **命令行可接管**：勾选后接管 `HTTP_PROXY` / `HTTPS_PROXY`（仅全局模式）
- **完整协议改写**：HTML 链接、CSS/JS 里的绝对地址、`Location`、`Set-Cookie`
- **登录态保活**：过期自动重登，不用手动输密码

## 能力边界

这部分我写得比较明确，因为它决定了什么时候不该用它：

| 场景 | 支持情况 |
|---|---|
| 浏览器访问校内站点 | ✅ 开箱即用，读写系统代理 |
| `git` / `pip` / `npm` / `curl` | ⚠️ 需勾选「同时设置命令行代理环境变量」，且仅全局模式 |
| SSH、数据库连接、任意 TCP/UDP | ❌ WebVPN 本身只代理 HTTP(S) |

> 第三条是硬限制，不是实现问题。WebVPN 的反向代理模型决定了它只能处理 HTTP(S)。

## 技术栈

- **Tauri 2** — 桌面外壳，体积小，内存占用低
- **Rust** — 代理内核、请求改写、CA 证书管理
- **Windows 10/11 x64** — 目前只支持这个平台

## 已知限制

- 只支持 Windows，暂未适配 macOS / Linux
- 安装便携版需要手动信任本地 CA 证书
- 部分使用 WebSocket 的校内应用可能无法正常工作

## 为什么做这个

学校的 WebVPN 设计上是给人「点着用」的，不是给开发工具用的。每次在校外写代码都要
在门户和终端之间来回切换、手动改地址，一个月下来浪费的时间很可观。

与其抱怨，不如写个代理把这一层磨平。

---

源码与详细信息：[github.com/XavierMu/sdust-webvpn-desktop](https://github.com/XavierMu/sdust-webvpn-desktop)
