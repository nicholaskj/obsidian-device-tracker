# 提交到 Obsidian 社区插件目录

## 前置检查（全部完成）

| 项 | 要求 | 状态 |
|---|---|---|
| `manifest.json` | id / name / version / minAppVersion / description / author / isDesktopOnly | ✅ |
| `description` 长度 | < 250 字符 | ✅ 183 |
| `versions.json` | `{"<version>": "<minAppVersion>"}` | ✅ |
| `LICENSE` | 必须有 | ✅ MIT |
| `README.md` | 英文 | ✅ |
| `README.zh-CN.md` | 中文单独一页 | ✅ |
| `CHANGELOG.md` | 有 | ✅ |
| `main.js` | 语法检查通过 | ✅ `node --check` |
| Release | tag 与 manifest 版本一致，附 `main.js` + `manifest.json` | ⏳ 待建 |
| GitHub Actions | tag 触发自动发布 | ✅ |

---

## 第 1 步：推到 GitHub

仓库地址：`https://github.com/nicholaskj/obsidian-device-tracker`

```bash
cd D:/dev/obsidian-device-tracker
git remote add github git@github.com:nicholaskj/obsidian-device-tracker.git
git push github main
```

> GitHub 首次建仓需要在网页上先 `New repository`，名字 `obsidian-device-tracker`，
> **不要**勾选 "Add README"（本地已有）。

---

## 第 2 步：打 tag 触发自动发布

```bash
git tag 1.0.0
git push github 1.0.0
```

推 tag 后 GitHub Actions 会自动：

1. 校验 tag 与 `manifest.json` 的 version 一致
2. 生成构建来源证明（attestation）
3. 建 Release，附上 `main.js` 和 `manifest.json`

**⚠️ Release 建出来是 draft，必须手动点 Publish 才会变成公开版本。**

到 `https://github.com/nicholaskj/obsidian-device-tracker/releases` 点 **Publish release**。

---

## 第 3 步：提交到 Obsidian 官方目录

### 3.1 打开提交页面

https://community.obsidian.md/

用 **Obsidian 账号**登录（不是 GitHub）。没有的话先注册。

### 3.2 关联 GitHub

- 进入 **Account → Connected accounts**
- 连接 GitHub
- 确认能访问 `nicholaskj/obsidian-device-tracker`

### 3.3 Claim（认领）仓库

- 进 **Plugins → Claim repository**（或直接新建时认领）
- 输入仓库地址：`https://github.com/nicholaskj/obsidian-device-tracker`
- 认领后仓库归你所有

### 3.4 新建插件条目

- **Plugins → New plugin**
- **Repository URL**：`https://github.com/nicholaskj/obsidian-device-tracker`
- **Owner**：选 **Myself**（这是你自己的插件）

### 3.5 自动审查

提交后会有自动化检查：

| 检查项 | 说明 |
|---|---|
| manifest 完整性 | 字段齐全、id 唯一 |
| Release 存在 | tag 对应、含必需的 2 个文件 |
| README / LICENSE | 存在 |
| 代码扫描 | 无危险 API（eval、远程加载等） |
| `id` 可用性 | `device-tracker` 未被占用 ✅ 已确认 |

**审查通过后会合入 `obsidian-releases` 仓库**，随下一次 Obsidian 更新出现在
社区插件列表里（通常几天到两周）。

---

## 第 4 步：如果被退回

常见退回原因和改法：

| 原因 | 改法 |
|---|---|
| description 太长或含 "Obsidian" | 缩短到 250 内，别写产品名 |
| `id` 与已有插件冲突 | 换 id（**注意：id 提交后永久锁死**） |
| `main.js` 里有远程代码加载 | 改成本地打包 |
| 用了 `eval` / `new Function` | 去掉 |
| 没有 Release 或 Release 是 draft | 点 Publish |
| tag 与 manifest version 不一致 | 删 tag 重打 |
| 没有 LICENSE | 补一个（MIT 最常见） |

---

## 备注：id 一旦提交就锁死了

`device-tracker` 这个 id 在 Obsidian 插件生态里**永久归你**，不能改。
如果以后想改名字，只能改 `name` 字段，`id` 保持不变。

改名的话，`manifest.json` 的 `name` 改了，`id` 不改 —— 已经安装的用户会无缝升级。

---

## 相关链接

- 官方提交说明：https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin
- 插件指南：https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- 社区仓库：https://github.com/obsidianmd/obsidian-releases
- 官方目录：https://community.obsidian.md/
