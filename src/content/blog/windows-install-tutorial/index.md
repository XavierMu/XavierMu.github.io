---
title: "Windows 系统安装教程：从镜像到第一次进桌面"
description: "官方镜像去哪下、启动盘怎么做、BIOS 怎么改引导顺序、分区怎么选，以及哪几步最容易翻车。"
pubDate: 2024-01-19
updatedDate: 2026-11-09
tags: ["电脑", "搞机"]
---

装系统这件事本身不难，卡人的通常是几个岔路口：镜像从哪下才干净、U 盘里要不要先备份、
BIOS 里那几项到底改哪个、分区那一步敢不敢点下去。

下面按顺序走一遍。全程半小时左右，不含下载镜像的时间。

> 动手前先备份。后面会格式化 U 盘，分区那一步也可能误删硬盘里的东西。

## 下载镜像

去 [ITELLYOU](https://next.itellyou.cn/Original/) 下原版镜像。这个站整理的是微软 MSDN
渠道的 ISO，没有第三方改动，比各种「优化版」「装机版」干净得多。

按需选版本（比如 Windows 11 消费者版），下载对应的 ISO 文件。

![ITELLYOU 上选择系统版本](./assets/itellyou-iso-select.png)

## 做启动盘

拿到 ISO 之后，要把它变成一块能引导的 U 盘。两条路，选一条走。

### 方法一：把镜像直接写进 U 盘

准备一个 8GB 以上的 U 盘，**里面的东西会被全部清空**。

插上 U 盘，打开 Rufus（或同类工具），选好目标设备和刚下的 ISO。分区类型一般保持默认
（UEFI 机器用 GPT），点开始，等它写完。

### 方法二：用微PE做启动盘

微PE 是一个精简的 Windows 预安装环境。用它做出来的 U 盘不只是安装介质，里面是一个能
启动的小系统，进去之后还能用分区工具、Dism++ 这些。

下载并运行微PE工具箱，插入 U 盘，选「安装 PE 到 U 盘」，按向导走完。

![微PE：选择 U 盘](./assets/wepe-boot-menu.png)

![微PE：开始安装](./assets/wepe-install-now.png)

![微PE：写入中](./assets/wepe-installing.png)

![微PE：安装完成](./assets/wepe-install-done.png)

然后把 ISO 文件整个复制到 U 盘里——PE 下要用虚拟光驱挂载它。

## 改 BIOS 引导顺序

重启，开机时快速连按 Del、F2、Esc 或 F12（各家不同，主板说明书上写着），进 BIOS 或 UEFI。

找到 Boot（启动）选项卡，把 U 盘调到启动顺序第一位。

按 F10 保存并退出。这次开机会从 U 盘启动，进安装程序。

## 安装

### 方法一：直接装

从 U 盘启动后，看到的就是 Windows 安装程序的欢迎界面。

- 选语言、区域和键盘布局

  ![选择语言](./assets/win-setup-language.png)

  ![选择键盘](./assets/win-setup-keyboard.png)

- 点「下一步」，阅读并接受许可条款
- 输入产品密钥。想装完再激活，就点「我没有产品密钥」
- 选安装类型：「自定义：仅安装 Windows（高级）」
- 选安装位置。**这一步最容易出事**：确认选中的是目标分区，别把存数据的盘格掉
- 开始安装，等进度条走完

![输入产品密钥](./assets/win-setup-product-key.png)

![选择安装位置](./assets/win-setup-partition.png)

![安装中](./assets/win-installing.png)

中间系统会自动重启几次，属于正常现象。

### 方法二：在 PE 里装

从 U 盘启动后先进 PE——一个精简的 Windows 环境。

**方式一**：打开资源管理器，右键 ISO 选「装载」，双击里面的 `setup.exe`。
之后的步骤和方法一完全相同。

![PE 里运行 setup.exe](./assets/pe-run-setup.png)

**方式二**：用 Dism++ 直接把镜像释放到硬盘。打开 Dism++，选「部署镜像」，
挑 U 盘里的 ISO，选目标分区和版本，确定。

![Dism++：选择版本](./assets/dism-deploy-version.png)

![Dism++：释放镜像](./assets/dism-deploy-progress.png)

释放完重启。系统还会再重启几次，等它装完。

![等待安装完成](./assets/win-setup-finishing.png)

## 首次启动

![首次启动设置](./assets/win-first-boot.png)

按提示走完地区、语言、网络、账户这些设置，然后再重启一次，就进桌面了。
