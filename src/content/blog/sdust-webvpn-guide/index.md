---
title: SDUST WebVPN 使用教程：在校外直接用校内地址
description: 从安装到配置的完整步骤，以及最容易踩的那个坑——系统代理和环境变量是两套东西。
pubDate: 2026-11-09
tags: [工具, 网络, 教程]
---

学校用的是**网瑞达 WebVPN**（clientless 反向代理），所有资源都会被改写成
`https://webvpn.sdust.edu.cn/https/<hex>/<path>` 这种形式，只能在门户里一个个点开。

在校外写代码时这很别扭：`git clone` 要手动复制改写后的地址，`pip install` 校内源要改
index-url，页面里的链接、302 跳转全是 webvpn 前缀，登录态过期还得重新输入。

[SDUST WebVPN 本地透明代理](/projects/sdust-webvpn)就是为解决这个而写的。这篇文章讲怎么用。

## 它做了什么

在本机跑一个 HTTP(S) 代理，工作流程很短：

```
浏览器 / 命令行工具
        │  原始地址：https://gitlab.sdust.edu.cn/xxx
        ▼
   ┌─────────────┐
   │  本地代理    │  是否命中白名单？
   └──────┬──────┘
          │ 命中：改写成 /https/<hex>/<path> 转发
          ▼
   webvpn.sdust.edu.cn  →  校内真实资源
          │
          ▼  响应返回时，链接 / Location / Cookie 还原成原始地址
```

站外流量直连，速度不受影响。HTTPS 需要做中间人解密（否则无法改写页面里的链接），
所以程序会生成一个本地 CA 证书。

## 安装

只有便携版，**不需要安装、不需要管理员权限**。

1. 到 [Releases](https://github.com/XavierMu/sdust-webvpn-desktop/releases) 下载
   `SDUST-WebVPN-<版本>-portable.zip`
2. 解压到任意文件夹（不要放在 Program Files 之类需要提权的目录）
3. 双击 `SDUST WebVPN.exe`

**运行环境**：Windows 10/11 x64。Win11 自带 WebView2；Win10 一般随 Edge 已装，
缺了的话装一次 [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)。

不需要 Node.js，也不需要装 .NET 运行时。

> **便携的含义**：数据目录跟着 exe 走。第一次运行会在 exe 旁边生成 `state\` 和 `.secrets\`。
> 换个文件夹就是一份全新配置，想共用配置就把 exe 放进已有 `state\` 的文件夹。

## 首次配置

程序打开后会弹一个「两步开始」的引导。核心是这三步：

### 1. 填账号

在「账号与证书」里填账号和密码，点「保存并登录」。

![账号与证书卡片：账号、密码、保存并登录，下面一行是安装根证书](./assets/webvpn-account-cert.png)

账号可以是职工号、学号、邮箱或别名。密码用 Windows DPAPI 加密后存在
`.secrets\creds.dpapi`，只有同一个 Windows 用户能解密——不会上传到任何地方，
本程序没有自建后端，只和学校 WebVPN 通信。

### 2. 装根证书

第一次点「开启系统代理」时会提示安装根证书。

这是必须的：HTTPS 流量要改写页面内容，就必须解密。程序用本地 CA（ECDSA P-256）
按站点签发证书，装到**当前用户**的证书库。私钥只留在 `state\ca\`。

装完程序会回读校验一次，确认真的装进去了。

### 3. 开启系统代理

点「开启系统代理」，默认走 **PAC 模式**。

![连接卡片：开启系统代理按钮、模式下拉、本地端口，下面是两个勾选框](./assets/webvpn-connect.png)

这时浏览器已经可以用了——直接访问 `https://my.sdust.edu.cn` 这类校内原始地址即可。

## 命令行工具为什么不通

**这是最容易卡住的一步。**

勾了「开启系统代理」之后，浏览器能上校内站点了，但 `git clone` 还是超时。

原因：**Windows 系统代理和 `HTTP_PROXY` 环境变量是两套完全独立的东西**。

- 程序接管的是**系统代理**（注册表 `HKCU\...\Internet Settings`）
- 但 `git`、`curl`、`pip` 这些命令行工具**根本不读它**
- 它们读的是环境变量 `HTTP_PROXY` / `HTTPS_PROXY`

Windows 设置界面里那个「系统代理」开关，只对走 WinINET/WinHTTP 的程序有效——
浏览器、Electron 应用之类。

### 解决

在程序界面里勾上「**同时设置命令行代理环境变量**」，然后把模式切到「**全局**」。

![模式下拉展开：PAC — 按名单分流（默认）/ 全局 — 全部走 WebVPN，正下方就是命令行代理环境变量勾选框](./assets/webvpn-mode-global.png)

两个条件缺一不可：

| 条件 | 说明 |
|---|---|
| 勾选环境变量选项 | 写 `HKCU\Environment` |
| 模式设为全局 | PAC 模式下这两个变量不会被设置 |

**为什么 PAC 模式不行**：PAC 是浏览器侧的机制（一个 JS 脚本决定请求走不走代理），
命令行程序无法使用。所以 PAC 模式下，git/pip 实际是**直连**的，根本没经过 WebVPN。

**还有一个细节**：环境变量只对**新开的终端**生效。已经开着的终端要关掉重开。

## 分流规则

由白名单（命中走 WebVPN）和黑名单（命中直连，优先级更高）决定，都没命中就直连。

支持的写法：

```
sdust.edu.cn          含所有子域
*.example.com         通配
10.0.0.0/8            网段
192.168.1.5           单个 IP
*                     全部
```

注意两点：

- **名单只在 PAC 模式下生效**。全局模式除 `webvpn.sdust.edu.cn`、`localhost`、
  `127.0.0.0/8` 外，全部经 WebVPN 出去
- 保存后立即生效，不用重启浏览器（程序会换 `AutoConfigURL` 的版本号触发重新拉取）

## 用不了的东西

WebVPN 是 clientless 反向代理，所有东西都封装在 443 的 HTTP 里，**没有 TCP 隧道**。
下面这些在原理上就不可能，怎么设置都没用：

| ❌ 用不了 | 原因 |
|---|---|
| SSH / SFTP、`git@` 形式的仓库地址 | 非 HTTP |
| MySQL / PostgreSQL / Redis / MongoDB | 同上 |
| RDP / VNC | 同上 |
| FTP / BT / 其它私有 TCP、UDP | 同上 |
| VS Code Remote-SSH、JetBrains Gateway | 依赖 SSH |
| `ping` / `traceroute` | ICMP，代理完全不涉及 |
| 游戏、语音 | UDP |

这些只能走学校提供的网页版终端。

## 几个补充

**Node.js 的 `fetch` 默认不读代理环境变量**，要设 `NODE_USE_ENV_PROXY=1`（Node 24+），
或改用 `undici` 的 `ProxyAgent`。老的 `node-fetch`、`axios` 一般会读。

**全局模式下命令行访问站外地址也会绕一圈**（能用但慢）。如果介意，用 PAC 模式让浏览器走，
命令行单独用 `git config http.proxy` 按需指定。

**退出时会还原系统代理**。关窗口只是隐藏到托盘，核心继续跑；要让系统代理恢复原状，
用托盘右键的「关闭系统代理」或直接退出程序。

## 和翻墙软件冲突

本程序和 Clash、v2rayN 这类同样依赖系统代理的软件**互斥**——它们抢的是同一个开关。

解决办法：把翻墙软件切到 **TUN / 虚拟网卡模式**，然后把 `*.sdust.edu.cn` 和学校地址段
设为直连。这样两套机制不打架。

## 出问题了怎么办

界面里有个「状态检查」功能，一键体检六项：控制接口、会话、核心、系统代理归属、根证书、
学校直连。

![状态检查弹窗：六项逐条给出结论，带 → 的是修法](./assets/webvpn-status-check.png)

它会告诉你具体哪一项不对、怎么修。比猜要快得多。

---

**项目地址**：[github.com/XavierMu/sdust-webvpn-desktop](https://github.com/XavierMu/sdust-webvpn-desktop)
（MIT 许可）

> 仅供本校师生在校外访问学校已授权的资源使用。请遵守学校网络使用规定与相关法律法规。
