# 设备记录器 (Device Tracker)

**自动记下每条笔记是哪台设备建的、哪台设备最后改的。**

在笔记本、台式机、手机之间同步同一个库时，同步工具会把文件对齐，却把
「谁改的」丢掉了。这个插件把这条信息直接写进 frontmatter：

```yaml
---
created_device: ThinkPad-JK
modified_device: Pixel7-a3f9c2
---
```

> English docs: [README.md](README.md)

---

## 它解决什么问题

用任何同步工具（Syncthing、坚果云、OneDrive、iCloud、git）时，手机上改的笔记
同步到电脑后，和电脑上自己改的笔记看起来**一模一样**。于是有两个麻烦：

**一、不知道改动从哪来。** 这段是你出差路上写的，还是在办公室写的？

**二、天真的实现会自我破坏。** 最直接的做法是「文件一改，就写入当前设备名」——
这是错的。同步过来的文件**本身就是一个 modify 事件**，于是每台设备一收到文件，
就把设备名改成自己。你录到的是「最后同步的设备」，不是「最后编辑的设备」。

这个插件把两个问题都解决了。

---

## 怎么避开同步误写

`modified_device` 由 **`editor-change` 事件**驱动，不是 `vault modify`。

| 事件 | 本机真实打字时 | 同步文件进来时 |
|---|---|---|
| `vault modify` | ✅ 触发 | ✅ 触发 ← 坑在这里 |
| `editor-change` | ✅ 触发 | ❌ 不触发 |

同步来的文件永远不会触发 `editor-change`，所以这个字段只会被「真的有人在这里打字」
的设备写入。程序化修改（编辑器刷新、同步重载）也会被事件的 `source` 标记过滤掉。

---

## 设备名存在本机，不会被同步覆盖

设备名存在各设备自己的 **`localStorage`** 里，不是 `data.json`。这一点很关键：
`.obsidian/` 通常是跟着笔记一起同步的，如果设备名存在那里，每台设备都会把
其他设备的名字覆盖掉，最后所有设备名字都一样。

| 平台 | 名字来源 |
|---|---|
| 桌面端 | 系统主机名（如 `ThinkPad-JK`），可手动改 |
| 安卓 | 自动生成 `<型号>-<6位短码>`（如 `Pixel7-a3f9c2`），可手动改 |
| iOS | 不支持（见下） |

随时可以在 **设置 → 社区插件 → 设备记录器 → ⚙️** 里改。

---

## 两个字段

| 字段 | 含义 | 什么时候写 |
|---|---|---|
| `created_device` | 创建设备 | 文件首次在某台设备出现时写一次，之后永不覆盖 |
| `modified_device` | 最后编辑设备 | 本机真实打字时写，防抖 1.5 秒 |

## 按设备名检索笔记

字段写进笔记之后，用 [Dataview](https://github.com/blacksmithgu/obsidian-dataview)
就能按它筛选 —— 「这台电脑上改过哪些」「哪些笔记在机器之间流转过」等等。

```dataviewjs
const me = app.plugins.plugins['device-tracker'].getDeviceName();

dv.table(
  ['笔记', '创建于', '最后编辑于'],
  dv.pages('"学业"')
    .where(p => p.modified_device === me)
    .map(p => [p.file.link, p.created_device ?? '—', p.modified_device ?? '—'])
);
```

五个完整例子（含防崩溃的设备名取法、纯 DQL 版本）在
**[docs/queries.zh-CN.md](docs/queries.zh-CN.md)**（English：[docs/queries.md](docs/queries.md)）。

---

## 与其他 frontmatter 插件共存

`update-time-on-edit`、`front-matter-timestamps` 这类会自动改 frontmatter 的插件
很常见。本插件做了五层防护，不会死循环也不会打架：

1. **防重入标志** —— 自己写 frontmatter 引发的事件一律拦截。
2. **值不变就不写** —— 设备名已经对了就不动，不产生多余 diff。
3. **`processFrontMatter` + 恢复时间戳** —— 原子读写并把 `mtime` 放回去，
   不干扰依赖文件时间的插件。
4. **`source` 过滤** —— 忽略程序化的编辑器变更。
5. **文件过滤** —— 跳过非 Markdown 文件、`Canvas.md`、空文件。

---

## 安装

### 从社区插件列表
收录进官方目录后：**设置 → 社区插件 → 浏览 → 搜索 "Device Tracker" → 安装 → 启用**。

### 手动安装
1. 从最新 release 下载 `main.js`、`manifest.json`。
2. 放进 `<你的库>/.obsidian/plugins/device-tracker/`。
3. 重启 Obsidian，在「社区插件」里启用 **Device Tracker**。

### 在新设备上第一次打开
Obsidian 会问「你是否信任这个仓库的作者？」——
**必须点「信任仓库作者并启用插件」**。点「在安全模式中打开」的话，
社区插件全部不加载，插件不会生效。

---

## 和其他溯源插件的区别

这是**设备**记录器，不是**人/AI**记录器。

| 插件 | 记录什么 |
|---|---|
| **设备记录器**（本插件） | 哪台**设备**动过 |
| [Authorship Tracker](https://github.com/bloknayrb/obsidian-authorship-tracker) | 哪个**作者**（人还是 AI）写的 |
| [Authorship](https://github.com/rflpazini/obsidian-authorship) | 在编辑器里用颜色区分「打字/粘贴/AI」 |
| Front Matter Timestamps | **什么时候**改的（没有设备维度） |

它们回答的是不同问题，可以同时装。想知道「这是我笔记本还是我手机改的」用这个；
想知道「这是人写的还是 AI 写的」用 Authorship Tracker。

---

## 平台支持

| 平台 | 可用 | 设备名 |
|---|---|---|
| Windows / macOS / Linux | ✅ | 自动取主机名，或手动设置 |
| 安卓 | ✅ | 自动生成唯一标识（型号+短码），或手动设置 |
| iOS / iPadOS | ❌ | iOS 版 Obsidian 不支持第三方插件 |

---

## 已知限制

- **不支持 iOS** —— 那边根本没有插件 API。
- **设备名不是补录的。** 装插件之前建的笔记没有 `created_device`，也不会补——
  老文件到底从哪来，没办法可靠判断。
- **两台设备如果手动设成同一个名字，就分不出来了。** 不是 bug，设成不同的就行。
- **重命名/移动不算编辑。** `modified_device` 只反映内容修改。

---

## 文档索引

所有文档都有中英两版，**各自独立页面，不混排**：

| 内容 | English | 中文 |
|---|---|---|
| 入门说明 | [README.md](README.md) | [README.zh-CN.md](README.zh-CN.md) |
| 按设备名检索笔记（DataviewJS） | [docs/queries.md](docs/queries.md) | [docs/queries.zh-CN.md](docs/queries.zh-CN.md) |
| 提交到官方插件目录 | [docs/submission.md](docs/submission.md) | [docs/submission.zh-CN.md](docs/submission.zh-CN.md) |
| 更新日志 | [CHANGELOG.md](CHANGELOG.md) | [CHANGELOG.zh-CN.md](CHANGELOG.zh-CN.md) |

---

## 许可

[MIT](LICENSE)
