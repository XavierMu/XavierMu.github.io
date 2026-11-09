---
title: Box · Android TV 影视应用改版
description: 在上游 TVBox 分支上做了 4 个提交：直播台标模板、开机即桌面、自动进直播，并修掉一批崩溃。
year: 2026
role: 二次开发
status: 维护中
stack: [Android, Java, Gradle]
repo: https://github.com/XavierMu/Box
featured: true
order: 2
---

[Box](https://github.com/takagen99/Box) 是 Android TV 上的影视聚合应用。原版有三件事用着别扭：

- 直播页的台标直接取 EPG 返回的 logo，**来源不可控、经常缺图**
- 设置里的「启动时进直播」是**数据一就绪就跳**，首页根本来不及操作
- 想把它当电视盒子的桌面用，但按返回键会退出应用

这个仓库在上游最新代码之上做了 4 个提交解决这些，另外修掉一批会直接崩掉直播页的问题。

## 改了什么

| 提交 | 主题 | 规模 |
|---|---|---|
| `b4a050e` | 增加 Logo 配置、增加桌面模式 | 19 个文件，+369 / −7 |
| `35cbc9a` | 调整按钮、修复崩溃、优化分类返回逻辑 | 5 个文件，+57 / −55 |
| `005af31` | 启动进直播逻辑优化 | 3 个文件，+51 / −3 |
| `6e565a4` | HOME 意图改为常驻，桌面模式开关只管返回屏蔽 | 4 个文件，+3 / −43 |

与上游相比累计 **19 个文件、+407 / −35**，刻意不新增依赖、不改播放内核。

### 1. 直播台标自定义

增加「按频道名套用模板地址」的能力。地址支持 `{name}` 占位符，会被当前频道名替换
（`URLEncoder` 编码后拼接），例如：

```
https://live.404003.xyz/LOGO/{name}.png
```

- 留空时使用内置默认模板（就是上面这个地址）
- 地址里**不含 `{name}`** 时，当作固定图片使用
- 模板图加载失败 → **自动回退**到 EPG 提供的 logo → 再失败则显示占位图
- 和直播源、EPG 地址一样，输入过的地址进历史列表（最多 20 条）

两个配置入口等价：应用内「首页 → 设置 → 配置地址」的第 4 行，或者浏览器打开应用内置的
远程配置页，在「接口」页填第 4 项。

### 2. 桌面模式

把应用变成一台**「开机即桌面」的电视盒子**，可以被系统选作默认桌面。

这里有个容易搞混的地方——它其实是**两个独立的部分**：

| 部分 | 作用 |
|---|---|
| `AndroidManifest.xml` 里的 `activity-alias` `.LauncherAlias` | 声明 `HOME` + `DEFAULT` 意图，**不带 `enabled` 限制**，所以装好后系统「主屏幕应用」列表里始终能看到它 |
| 设置里的「桌面模式」开关 | **只控制首页返回键**，不控制 HOME 组件是否启用 |

开关的行为：

- 关闭（默认）：与原版一致，首页按两次返回退出应用
- 开启：首页按返回被吞掉，不退出；分类页按返回**仍然回到首页第一个分类**

> 早期版本（`b4a050e`）曾用 `setComponentEnabledSetting()` 动态启停 `LauncherAlias`，
> 还在启用时主动拉起系统 HOME 选择框。`6e565a4` 移除了这套逻辑——重装或清数据后，
> 组件状态容易和开关对不上。

### 3. 启动自动进直播

原版一就绪就跳转，改版改为**延迟进入 + 随时可取消**：

- 首页数据与 jar 都就绪后，起一个 5 秒倒计时（`AUTO_LIVE_DELAY_MS = 5000`）
- 同时 Toast 提示「5 秒内无操作，将自动进入电视直播（按任意键取消）」
- 倒计时期间，**任意按键**、**任意触摸或点击**、**页面离开**都会取消本次自动进入
- 每次启动只处理一次；开关关闭时完全不触发，与原版零差异

### 4. 稳定性修复

这一批是实际会崩的，不是纸面问题：

| 问题 | 现象 | 修法 |
|---|---|---|
| EPG 时间字段为空或格式异常 | 解析得到 `null`，随后 `SimpleDateFormat.format(null)` 抛 NPE | 解析失败回退到节目日期 |
| EPG 接口返回非预期 JSON | 只 catch 了 `JSONException`，`ClassCastException` 等会把直播页带崩 | 改为捕获 `Exception` |
| Glide 回调里再次发起加载 | 台标兜底时触发 `IllegalArgumentException: You cannot start a load for a destroyed activity` | 改用官方推荐的 `RequestBuilder#error()` 串联 |
| 服务器地址空指针 | `ControlManager.getAddress()` 在 `mServer` 未创建时被调用 | 增加判空，返回空串 |
| 频道名为空 | 台标模板拼接 `null` | 判空后置空串 |

顺带把配置对话框撑开了：`dialog_api.xml` 总高度从 `vs_460` 提到 `vs_480`，各行由
`wrap_content` 改为 `layout_weight`，输入框上下 padding 从 `vs_10` 收到 `vs_6`，
保证数据源 / 直播源 / EPG / Logo / socks 代理 5 行在弹窗内完整显示、不用滚动。

## 构建

```bash
# 通用 armeabi-v7a + Java 版 release
./gradlew assembleArmeabiGenericNormalRelease

# 通用 arm64 + Java 版 release
./gradlew assembleArm64GenericNormalRelease
```

环境：JDK 11+、Gradle 7.5 / AGP 7.4.2，`compileSdk 34` / `minSdk 21` / `targetSdk 28`。
变体按 `abi`（armeabi / arm64）× `brand`（generic / hisense）× `mode`（normal / python）组合，
产物在 `app/build/outputs/apk/<变体>/release/`。

`applicationId` 由上游的 `com.github.tvbox.osc.tk` 改为 **`com.github.tvbox.osc.mx`**，
所以能和上游版本共存安装；`release` 改用 debug 签名，方便自己出包直接装
（**对外分发需要换成自己的 keystore**）。

## 与上游同步

```bash
git remote add upstream https://github.com/takagen99/Box.git
git fetch upstream
git merge upstream/main
```

改动面小是刻意的，冲突基本只集中在 `HomeActivity`、`ApiDialog`、`dialog_api.xml`、
`fragment_model.xml`、`strings.xml` 这几处。

## 说明

本项目遵循 **AGPL-3.0**（继承自上游），二次分发需同样开源。仅供个人学习与技术研究，
应用本身**不提供任何影视内容**，所有数据源由使用者自行配置。
