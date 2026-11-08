---
title: "Clash Verge 使用教程"
description: "Clash Verge 是一款基于 Clash 内核的图形用户界面（GUI）客户端，支持 Windows、Linux、macOS 系统。"
pubDate: 2024-03-20
tags: ["电脑", "科学上网"]
---
**Clash Verge** 是一款基于 **Clash 内核** 的**图形用户界面**（GUI）客户端，支持 **Windows、Linux、macOS** 系统。它功能强大，支持多种代理协议，如 **V2Ray、Trojan、Shadowsocks、ShadowsocksR、Socks** 等，并且具有完善的分流规则管理功能。Clash Verge 的操作方式与 **Clash for Windows** 类似，可以作为该工具的替代方案。

---

## 下载和安装

点击[这里](https://github.com/clash-verge-rev/clash-verge-rev/releases)进入 Clash Verge 的 GitHub 页面，下载适合你系统的安装包：

- **Windows** 用户：下载 `.msi` 或 `.exe` 文件。
- **macOS** 用户：根据电脑的芯片类型（Intel 或 M1/M2），选择相应的 `.dmg` 文件。
- **Linux** 用户：选择适配的安装包进行安装。

按照提示完成安装后，你可以在设置中将界面语言切换为中文以方便使用。

> **提示**：Clash Verge 仅是客户端，需要配合代理节点一起使用。

### 推荐机场

- [魔界.net](https://www.mojie.me/#/register?code=oCmKfVkU)
- [WindyCloud](https://portal.passgfw.top/#/register?code=bjn7QEKe)

---

## 获取订阅地址

在机场购买适合你的套餐后，进入后台复制订阅地址。

![获取订阅链接](./assets/clash-subscription.png)

---

## 配置代理

1. 在 Clash Verge 的**订阅**界面粘贴刚才复制的**订阅地址**。
2. 点击**导入**按钮，导入相应的代理配置。

> **注意**：如果你使用的是自建节点服务器，需要手动编辑并导入配置文件。Clash Verge 支持以下协议：**Shadowsocks (SS)、ShadowsocksR (SSR)、Socks、Snell、V2Ray、Trojan** 等。

![配置代理](./assets/clash-config-proxy.png)

---

## 选择代理模式

Clash Verge 提供三种代理模式，根据需求选择合适的模式：

- **规则模式**（Rule）：根据配置文件中的规则，只有需要代理的网站流量才会通过代理服务器。**（推荐）**
- **全局模式**（Global）：所有流量都会通过代理服务器。
- **直连模式**（Direct）：所有请求直接发送到目的地，不通过代理。

![选择代理模式](./assets/clash-proxy-mode.png)

---

## 选择代理节点

在选择代理节点时，你可以根据目标网站的**服务器位置**或**延迟**来选择最佳的代理节点，以确保访问速度。

![选择代理节点](./assets/clash-select-node.png)

---

## 开启代理

1. 进入**设置**界面。
2. 打开**系统代理**选项，启用代理。

这样，你就可以开始正常访问被墙的网站了。

> **注意**：关机前一定要**关闭系统代理**，否则下次开机时可能无法正常上网。若遇到此问题，重新打开 Clash Verge 并关闭系统代理即可解决。

![开启代理](./assets/clash-enable-proxy.png)

---

## 开始使用

启用系统代理后，你可以开始访问如 **Google**、**YouTube** 等被墙网站。建议首次使用时在**隐私模式**下访问这些网站，以避免浏览器缓存或插件影响代理的正常工作。

---

## 其他设置与建议

- **语言切换**：进入设置，将界面语言切换为中文。
- **内核切换**：在设置中可以切换至 **Clash Meta** 内核，以支持更多类型的节点协议。
- **导入机场订阅**：通过机场后台复制订阅地址，然后在 Clash Verge 中导入即可。
- **默认端口设置**：Clash Verge 使用与 Clash for Windows 相同的默认端口 7890，适用于如 Telegram 等应用的代理设置。
- **Tun 模式**：开启 Tun 模式后会生成虚拟网卡，让所有流量通过代理。

---

通过本教程，你应该已经能够轻松配置和使用 Clash Verge 进行科学上网。根据你的需求选择合适的代理节点和代理模式，享受畅通的网络访问体验！