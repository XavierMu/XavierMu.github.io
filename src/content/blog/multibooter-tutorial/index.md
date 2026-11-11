---
title: "MultiBooter 使用教程：手机就是万能启动盘"
description: "不用 root 也能给 U 盘装 Ventoy；root 之后手机直接虚拟成 U 盘或光驱，还能 PXE 网络启动。"
pubDate: 2026-11-10T18:58:42+08:00
tags: ["安卓", "电脑", "启动盘"]
---

U 盘总有不在手边的时候，手机一定在。MultiBooter 就是干这个的：让手机给电脑当启动盘，
或者干脆把 U 盘插手机上、用手机把它做成 Ventoy 启动盘。

它和早年那个 DriveDroid 是同类，但更完整——**部分功能不需要 root**，还内置了 Ventoy，
直接解决了「手机装系统」最大的那个坎。

## 它是什么

一个 GPLv3 的开源 Android 应用（[GitHub](https://github.com/werimsoln/MultiBooter)，
作者 Volkan Belek），把几件底层的事合到了一个 App 里：

| 功能 | 干什么 | 要 root 吗 |
|---|---|:---:|
| Ventoy 安装 | 给 U 盘装 Ventoy，MBR 或 GPT，还能读出盘上已有的版本 | 否 |
| ISO 写入 | 把 ISO / 光盘镜像直接写进 U 盘 | 否 |
| 虚拟 U 盘 | 手机本机变成一块 U 盘（Ventoy 或空白）给电脑用 | 是 |
| 虚拟光驱 | 通过 FunctionFS 模拟 CD-ROM | 是 |
| TFTP / PXE | 让电脑通过网络从手机启动 | 是 |
| USB Gadget | 走 ConfigFS 暴露成 U 盘或光驱 | 是 |
| 磁盘分析 | 查看分区、剩余空间、盘里的 ISO 列表 | 否 |

前两项走的是 Android 的 [USB Host API](https://developer.android.com/guide/topics/connectivity/usb/host)——手机当**主机**，U 盘插在手机上，
通过 SCSI 命令直接操作那块盘。所以不需要 root，也不需要碰 `/dev/sdX`。

后几项走的是反方向：手机当**从设备**，把自己伪装成一块盘给电脑。这需要配置
Linux 的 ConfigFS / FunctionFS，必须 root。

> 这一点是它和 DriveDroid 最大的区别。DriveDroid 只能做后一半，且必须 root。

「必须 root」这件事本身得先解决：解锁 Bootloader、刷入 root 方案的完整流程写在[安卓解锁 BL 与 KernelSU root](/blog/android-unlock-bl-kernelsu)里，解锁会清空数据，代价清单也在那一篇。两条线是独立的——只想给 U 盘装 Ventoy 的话，完全不用碰 root。

## 装上

Android 8.0 以上，四个 ABI 都支持。

- **F-Droid**：搜 MultiBooter，或者直接装
  [包页面](https://f-droid.org/packages/com.werismoln.multibooter/)
- **GitHub Releases**：从 [MultiBooter 的 Releases 页](https://github.com/werimsoln/MultiBooter/releases)下 APK
- **[Obtainium](https://github.com/ImranR98/Obtainium)**：加仓库地址，自动跟踪更新

当前版本是 **v0.1.4**。虚拟 U 盘和磁盘分析是这一版才加的，v0.1.3 没有——
如果你在 F-Droid 上装到的是旧版，界面上找不到「Virtual USB drive」就是这个原因。

安装包 16MB 左右，里面打包了一份 Ventoy 的 VTOYEFI 镜像（32MB FAT16），
构建时从 Ventoy 1.1.17 的源码重新生成并校验哈希。**App 没有任何联网权限**，
所有资源都随包提供。

## 不 root 能做什么

这两件事已经解决大部分需求了。

### 在手机上给 U 盘装 Ventoy

以前要装 Ventoy，必须找台 Windows 跑 `Ventoy2Disk.exe`。现在可以直接在手机上做：

1. 用 OTG 线把 U 盘插到手机
2. 打开 MultiBooter，选「Ventoy 安装」
3. 选目标盘、选 MBR 或 GPT
4. 点开始，等进度条走完

App 会读出盘上已有的 Ventoy 版本，所以升级也不用回电脑。装完的 U 盘拔下来插到电脑上，
就是一个正常的 Ventoy 启动盘，之后往里拷 ISO 就行——那部分用手机的文件管理器也能做。

**选错盘的后果和电脑上一样**：分区表被覆盖，整块盘的数据全没。确认设备名和容量再点。

### 直接把 ISO 写进 U 盘

不想用 Ventoy、只要一个单系统盘的话，这里也能做：选 ISO，选 U 盘，写进去。
效果等同于电脑上跑 Rufus 的 DD 模式。

## root 之后能做什么

### 虚拟 U 盘：手机直接变成启动盘

这是最有意思的一项。手机通过 USB 线连电脑，在电脑眼里它就是一整块 U 盘。

原理上，App 在手机存储里建一个 `.img` 镜像文件，再通过 USB Gadget（ConfigFS 的
mass storage 功能）把这个文件当作一块物理磁盘暴露给电脑。

**先建盘，再共享**，分两步：

1. 进「Virtual USB drive」→「Create a new virtual drive」
2. 填名字、选容量（1、2、4、8、16、32、64、128 GiB）、选类型：

| 类型 | 建出来是什么 |
|---|---|
| Ventoy (MBR) | 带 Ventoy 引导的启动盘，MBR 分区表 |
| Ventoy (GPT) | 同上，GPT 分区表 |
| Empty exFAT drive | 空的 exFAT 盘，当普通 U 盘用 |
| Blank (uninitialized) | 连分区表都没有，电脑看到一块未初始化的盘 |

3. 建好后在列表里点它 →「Share with a PC (read-write)」或「(read-only)」

共享成功后手机就连着电脑了，电脑上会多出一块 U 盘。选 Ventoy 类型的话，
启动电脑就能看到 Ventoy 菜单——但你得先把 ISO 拷进去：电脑那边识别成 U 盘之后，
直接把 ISO 拖进去就行。

也就是说：**不用 U 盘，手机本身就是那个 Ventoy 启动盘。** 这是 DriveDroid 要绕一大圈
（先建空白镜像、再在电脑上用 Ventoy2Disk 装）才能做到的事，这里建盘带共享一步到位。

几个实际细节：

- **镜像文件是稀疏的**。建一个 64GiB 的盘，实际只占几 MB；只有真的往里拷数据才会增长
- **Ventoy 类型最小要 512MiB**，其它类型 64MiB 就行
- **共享期间别在手机上碰这个镜像**。电脑那边「安全弹出」之后，再回 App 停共享
- **同一时间只能共享一块**。已有 USB Gadget 会话时，App 会提示先停掉

> 注意：这个「虚拟 U 盘」只是把镜像喂给电脑，**它本身不负责往里塞 ISO**。
> 要放系统镜像，还是得电脑把这块虚拟盘认成 U 盘之后，由电脑拷进去。

### 虚拟光驱

通过 FunctionFS 把手机模拟成 CD-ROM 设备。对付那些不支持 U 盘启动、只认光驱的老机器
或者特殊镜像有用。

实现路径和虚拟 U 盘不同：FunctionFS 是在用户态接管 USB 端点，不需要内核的 mass storage
函数。代价是兼容性看厂商，不是每台机器都成。

### 网络启动（TFTP / PXE）

这个思路完全不一样：不走 USB，走网线。

手机起一个 TFTP 服务（App 内置了 [dnsmasq](https://thekelleys.org.uk/dnsmasq/doc.html)），电脑那边设置 PXE 网络启动，
从手机加载引导文件，PXE 客户端的配置可以看 [iPXE 文档](https://ipxe.org/howto/)。适合电脑 USB 口坏了、或者一次要给多台机器装系统的场合。

需要手机和电脑在同一个局域网里，通常是手机开热点让电脑连。

## 和 DriveDroid 怎么选

如果你在网上搜「手机装系统」，大概率会看到 DriveDroid。两者的现状差别很大：

| | MultiBooter | DriveDroid |
|---|---|---|
| 最后更新 | 2026 年 11 月 | 2019 年 |
| 源码 | 开源，GPLv3，活跃 | 已不公开 |
| 免 root 功能 | 有（Ventoy / ISO 写入） | 没有 |
| 内置 Ventoy | 有 | 没有 |
| Android 版本 | 8.0+ | 适配到 9，之后问题多 |
| 光驱模拟 | FunctionFS | 需第三方内核 |

结论很直接：**新事情用 MultiBooter**。DriveDroid 在 Android 10 之后经常挂载失效，
社区要靠 [Magisk](https://github.com/topjohnwu/Magisk) 脚本手动切 USB 功能，折腾成本高且不一定成。

DriveDroid 唯一还值得提的地方是它历史更久、能查到的老教程多。但那些教程大多基于
旧系统，照着做容易踩坑。

## 现实中的坑

**「不需要 root」不等于「一定能用」。** USB Host 功能依赖手机的 OTG 支持和供电能力。
有些机型 OTG 供电不足，带不动 U 盘；有些 ROM 对 USB Host 的实现有 bug。

**虚拟 U 盘在部分主板上认不出。** 手机伪装成的存储设备，BIOS 兼容性不如真 U 盘。
碰到这种情况换 USB 2.0 口试试。

**Secure Boot 会拦 Ventoy。** 和 U 盘版一样，第一次启动要在 MokManager 里注册密钥，
详见 [Ventoy 使用教程](/blog/ventoy-tutorial)。

**项目很新。** v0.1.x 意味着接口可能变、bug 可能多、遇到问题不一定搜得到答案。
介意的话就先用电脑版工具，把它当备用方案。

**root 有代价。** 解锁 Bootloader 会清空数据，部分银行 App 和支付功能会受影响。
为了一个应急启动盘值不值，自己权衡。

## 值不值得折腾

分两种情况看：

**如果你只是偶尔要装系统**，那不用折腾。一个几十块的 U 盘，用 Rufus 写一次，
比什么都省事。

**如果你经常帮人修电脑**，或者手上压根不想带 U 盘，那这个方案的价值就出来了——
手机永远在身上，装个 App 就多了一套完整的启动盘能力。

装系统的完整流程见 [Windows 系统安装教程](/blog/windows-install-tutorial)；
Ventoy 本身的用法见 [Ventoy 使用教程](/blog/ventoy-tutorial)。
