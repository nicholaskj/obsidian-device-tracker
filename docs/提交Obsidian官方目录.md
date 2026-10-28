# 提交到 Obsidian 社区插件目录

> 仓库：https://github.com/nicholaskj/obsidian-device-tracker
> 版本：1.0.0
> Release：https://github.com/nicholaskj/obsidian-device-tracker/releases/tag/1.0.0

---

## 前置检查（全部完成）

| 项 | 要求 | 状态 |
|---|---|---|
| `manifest.json` | 7 个必填字段 | ✅ |
| `description` 长度 | < 250 字符 | ✅ 183 |
| `versions.json` | `{"1.0.0": "1.4.0"}` | ✅ |
| `LICENSE` | 必须有 | ✅ MIT |
| `README.md` | 英文 | ✅ 5,723 B |
| `README.zh-CN.md` | 中文单独一页 | ✅ 5,367 B |
| `CHANGELOG.md` | 有 | ✅ |
| `main.js` | 语法检查通过 | ✅ `node --check` |
| Release | tag 与 manifest 版本一致 | ✅ `1.0.0` |
| Release 状态 | **已发布（非 draft）** | ✅ |
| Release 附件 | `main.js` + `manifest.json` | ✅ 8,651 B / 355 B |
| 产物校验 | 下载后与源码逐字节一致 | ✅ md5 `529e80eb...` |
| GitHub Actions | tag 触发自动发布 | ✅ 已跑通 |
| 真机验证 | 用 **release 产物** 装在 Obsidian 1.13.7 实测 | ✅ |

---

## 已完成（2026-10-28）

```
✅ 推 GitHub 主分支
✅ 打 tag 1.0.0
✅ Actions 自动建 release 并发布（非 draft）
✅ 下载 release 产物回装测试库，四项功能全通过
```

---

## 下一步：提交到 Obsidian 官方目录（需要你的账号）

这一步**必须你本人操作**，因为要登录 Obsidian 账号并授权 GitHub。

### 第 1 步：登录

打开 https://community.obsidian.md/

用 **Obsidian 账号**登录（不是 GitHub 账号）。没有的话用邮箱注册一个，免费。

### 第 2 步：连接 GitHub

- 进 **Account → Connected accounts**
- 点 **Connect GitHub**，浏览器跳转授权
- 授权后确认能看到 `nicholaskj/obsidian-device-tracker`

### 第 3 步：认领仓库

- 进 **Plugins → Claim repository**（也可能叫 "Add your plugin"）
- 填仓库地址：`https://github.com/nicholaskj/obsidian-device-tracker`
- 系统会检查这个仓库里有没有合格的 `manifest.json` 和 release
- 认领成功后，仓库归你名下

### 第 4 步：新建插件条目

- **Plugins → New plugin**
- **Repository URL**：`https://github.com/nicholaskj/obsidian-device-tracker`
- **Owner**：选 **Myself**

### 第 5 步：等自动审查

提交后会跑自动化检查，通常几小时到几天：

| 检查项 | 你这边的状态 |
|---|---|
| manifest 完整性 | ✅ |
| id 唯一性 | ✅ `device-tracker` 已确认未被占用 |
| Release 存在且非 draft | ✅ |
| tag 与 version 一致 | ✅ |
| README / LICENSE | ✅ |
| 代码扫描（eval / 远程加载 / 危险 API） | ✅ 全是本地代码，无网络请求 |
| 是否用了被禁 API | ✅ 无 |

通过后合入 [obsidian-releases](https://github.com/obsidianmd/obsidian-releases)，
随 Obsidian 更新出现在社区插件列表里。

---

## 如果被退回

| 退回原因 | 改法 |
|---|---|
| `description` 太长或含 "Obsidian" | 缩短到 250 内，别写产品名 |
| `id` 冲突 | 换 id —— **注意 id 提交后永久锁死** |
| Release 是 draft | 去 GitHub 点 Publish |
| tag 与 manifest 不一致 | `git tag -d 1.0.0 && git push github :refs/tags/1.0.0`，改 manifest 后重打 |
| 没有 LICENSE | 补（MIT 最常见） |
| 代码里有远程加载 | 改成本地打包 |
| `main.js` 含 `eval` / `new Function` | 去掉 |

---

## id 提交后永久锁死

`device-tracker` 一旦提交就无法更改。以后想改名字只能改 `name` 字段，
`id` 保持不变 —— 已安装的用户会无缝升级。

---

## 发新版本（以后）

```bash
cd D:/dev/obsidian-device-tracker
# 1. 改 manifest.json 的 version
# 2. 在 versions.json 加一行 {"<新版本>": "<minAppVersion>"}
# 3. 在 CHANGELOG.md 加一节
git add -A && git commit -m "chore: bump to X.Y.Z"
git tag X.Y.Z
git push github main
git push github X.Y.Z     # ← 推 tag 后 Actions 自动建 release
```

然后去 GitHub 点 **Publish release**。

> 注意：`versions.json` 里要记录每个版本要求的 `minAppVersion`，
> 老版本不写进去，Obsidian 才能正确给老用户降级匹配。

---

## 相关链接

- 官方提交说明：https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin
- 插件指南：https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- 社区仓库：https://github.com/obsidianmd/obsidian-releases
- 官方目录：https://community.obsidian.md/
