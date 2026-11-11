---
title: "Ventoy 使用教程：一个 U 盘装下所有系统镜像"
description: "它替代不了 PE，也挡不住 Secure Boot。但一个 U 盘装下所有系统这件事，确实只有它能干。"
pubDate: 2024-04-18
updatedDate: 2026-11-11
tags: ["电脑", "系统安装", "启动盘"]
---

[Rufus](https://rufus.ie/) 和 [微PE](https://www.wepe.com.cn/) 都有一个共同限制：一个 U 盘只能装一个系统。想再放一个 PE、
或者另一个版本的 ISO，就得重新写一遍，原来那个连同 U 盘里的数据一起没了。

Ventoy 换了个思路：**U 盘只装一次，之后往里复制 ISO 文件就行**。开机时它扫一遍 U 盘里的
镜像，列成一个菜单让你选。装完 Ventoy 的 U 盘还是一个普通 U 盘，能正常存文件、能读能写。

这个差别听起来不大，但用过一次就不想回去了——尤其是手上同时有 Win10、Win11、
某个 PE 和几个 Linux 发行版的时候。

## 适合谁

- 经常装机、维护机器的人
- 手上 ISO 不止一个，想随身带着
- 想留一个应急 U 盘，平时还能当普通 U 盘用

如果你只是给自己的电脑重装一次，短期内不会再碰，[Rufus 或者微PE](/blog/windows-install-tutorial)
更省事——不用先装 Ventoy 再拷 ISO，一步到位。

## 装到 U 盘上

到 [ventoy.net](https://www.ventoy.net/cn/download.html) 下载 Windows 版压缩包，解压，
运行 `Ventoy2Disk.exe`。它是绿色程序，不用安装。

插上 U 盘，在「设备」里选对盘，然后点「安装」。

> 安装会清空整个 U 盘。装之前先备份。

安装过程只是往 U 盘开头写一小段引导，剩下绝大部分空间会格式化成 exFAT。
**这一步只需要做一次**，以后升级 Ventoy 或者换 ISO 都不用重来。

### 分区结构

Ventoy 会在 U 盘上建两个分区：

| 分区 | 大小 | 作用 |
|---|---|---|
| 第一个 | 剩余全部空间 | 存 ISO 用，默认 exFAT |
| 第二个 | 32MB | EFI 引导文件，FAT 格式 |

那个 32MB 的分区是 UEFI 规范要求的，**别去动它**。平时在「此电脑」里能看到的是第一个分区，
ISO 就往这里放。

### 放 ISO

装完 Ventoy 之后，U 盘就是一块普通的 exFAT 盘。把 ISO 文件直接复制进去就行，
放根目录或者建子目录都可以。

```
U 盘/
├── Win11_25H2_x64.iso
├── Win10_22H2_x64.iso
├── WePE_64.iso
└── ubuntu-24.04.iso
```

不需要解压，不需要任何额外操作。想删掉某个系统，直接删文件；想加一个，直接复制进去。

要注意 ISO 本身得是能引导的完整镜像——从 ITELLYOU 下的原版 ISO 都没问题。有些
「精简版」「装机版」被改过引导结构，可能启动不了。

## 启动

插上 U 盘，走 BIOS 启动菜单或者把 U 盘排到第一位，和平时一样。

Ventoy 起来后会先扫一遍镜像，然后列出菜单，用方向键选，回车启动。菜单里每一项就是一个
ISO 文件，文件名显示成什么样取决于你怎么命名，所以给文件起个看得懂的名字有好处。

### 绕过 Win11 检测

Ventoy 默认开启了 `VTOY_WIN11_BYPASS_CHECK`，也就是说用它启动 Win11 安装镜像时，
TPM、Secure Boot、CPU 这几项检查会被自动跳过。

省事，但代价和 Rufus 那条路一样：微软不保证这类设备的更新，详见
[Windows 系统安装教程](/blog/windows-install-tutorial)里的硬件门槛一节。

不想要这个行为，可以在 `ventoy/ventoy.json` 里关掉，但多数人没必要。

## Secure Boot 的坑

这是用 Ventoy 最容易卡住的地方，值得单独说，[Ventoy 官方文档](https://www.ventoy.net/cn/doc_secure.html)里也专门有一节讲它。

Ventoy 的引导程序基于 grub2，是 GPL 授权的，拿不到微软的 UEFI 签名。所以它借用了
一个第三方 [shim](https://github.com/rhboot/shim)（来自 Rocky Linux），由 shim 来启动它。

后果是：**在开着 Secure Boot 的机器上，第一次从 Ventoy 启动不会直接进菜单，而是先进
MokManager**，要求你手动注册 Ventoy 的密钥。

### 第一次启动要做的事

1. 从 U 盘启动，屏幕上出现 `Verification failed: (0x1A) Security Violation` 一类的提示
2. 选 `Enroll key from disk` 或者 `Enroll hash from disk`
3. 一路往下选，找到 Ventoy 的那个分区，选中 `ENROLL_THIS_KEY_IN_MOKMANAGER.cer`
4. 选 `Continue`，再选 `Yes`，然后 `Reboot`
5. 重启后再从 U 盘启动，这次就能进菜单了

注册一次就够，以后这台机器上都认。换一台新机器还得再来一遍。

如果提示是 `Verification failed` 而不是 `Security Violation`，多半是 shim 版本旧了，
升级 Ventoy 到最新版重试。

### 两种安全策略

Ventoy 提供两种 Secure Boot 策略，在 `ventoy/ventoy.json` 的全局控制里设，字段含义见 [Ventoy 全局控制插件文档](https://www.ventoy.net/cn/plugin_control.html)：

```json
{
    "control": [
        { "VTOY_SECURE_BOOT_POLICY": "1" }
    ]
}
```

| 值 | 策略 | 效果 |
|---|---|---|
| `0`（默认） | 完全绕过 Secure Boot | 所有 EFI 文件都能启动，功能全开，最方便 |
| `1` | 遵循固件策略 | 只启动带签名的 EFI（如 Windows 的 `bootmgfw.efi`），部分功能受限但最安全 |

默认的 `0` 等于把 Secure Boot 绕过了。装完系统记得把 U 盘拔了、机器本身的 Secure Boot
恢复开启，别让它一直处于被绕过的状态。另外，[微软的 Secure Boot 文档](https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/oem-secure-boot)是这块最权威的参考。

> 安全启动这件事本身，包括它到底拦什么、为什么有的 PE 进不去，
> 见[进 PE 之前要不要关安全防护](/blog/disable-security-before-pe)。

## 它不能做什么

Ventoy 解决的是「多个 ISO 共存」，不是「一个 PE」。这两件事经常被混淆：

- **它本身不是 PE**。启动 ISO 之后，进的是那个 ISO 自带的系统，不是 Ventoy
- **没有维护工具**。分区、修引导、改密码、备份，这些得靠你放进去的 PE 镜像
- **装到系统硬盘上没什么意义**。官方支持免清空安装（把 Ventoy 装到已有数据的盘上），
  但那样只是多了一段引导，日常还是得从 U 盘启动才方便

所以务实的做法是：**用 Ventoy 装一个 PE 的 ISO，再放几个系统 ISO**。
这样一个 U 盘既有维护能力，又能装好几个版本的系统，这才是 Ventoy 最舒服的用法。

微PE 官方提供 ISO 版本，可以直接丢进 Ventoy。有些 PE 只提供 exe 安装程序，
那就得找它的 ISO 版，或者干脆用微PE这种带 ISO 的。

## 几个实用功能

- **升级不用重来**：新版本出来，运行 `Ventoy2Disk.exe` 选「升级」，ISO 和数据都保留
- **保留磁盘空间**：安装时可以在末尾预留一段空间，隔出一个独立分区，当普通 U 盘用
- **持久化**：Linux 发行版可以配置 persistence，让改动在重启后保留
- **插件系统**：自动安装、菜单别名、主题、密码保护，都通过 `ventoy/ventoy.json` 配置
- **不止 Windows**：Linux 发行版、BSD、甚至一些救援盘都能启动

## 常见问题

**启动后菜单是空的**：ISO 没放对位置，或者文件损坏。确认 ISO 在第一个分区里，
且是完整下载的（校验一下 SHA256）。

**报 `No bootfile found for UEFI`**：这个 ISO 不支持 UEFI 启动，或者只有 Legacy 引导。
换成支持双启动的镜像。

**装完 Ventoy 后 U 盘在 Windows 里不认**：多半是选错了文件系统，或者装到了移动硬盘上。
用 `Ventoy2Disk.exe` 重新装一次，注意设备别选错。

**升级 Ventoy 后 Secure Boot 又要注册**：正常。Ventoy 在 1.1.14 换过一次签名证书，
跨这个大版本升级需要重新注册密钥。

**能不能装到移动硬盘上**：可以，但要注意移动硬盘里如果有数据，安装会全部清空。
Ventoy 支持保留空间功能，可以先把数据分区留出来。

## 一句话

Ventoy 不是 Rufus 的替代品，也不是微PE 的替代品，它是**把多个启动介质合并到一个 U 盘**的方案。
理解了这一点，就不会指望它提供 PE 的功能，也不会觉得它多此一举。

再往前走一步：Ventoy 其实不一定要装在 U 盘上，**装进一个镜像文件里也行**，
甚至在手机上就能直接给 U 盘装 Ventoy。用 [MultiBooter](/blog/multibooter-tutorial)
可以把手机本身变成一块 Ventoy 启动盘，连 U 盘都省了。详见那篇。

装系统的完整流程见 [Windows 系统安装教程](/blog/windows-install-tutorial)。
