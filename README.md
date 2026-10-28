# 设备记录器 (device-tracker)

Obsidian 插件：在笔记 frontmatter 里自动记录「创建设备」和「最后编辑设备」。

## 字段

| 字段 | 含义 |
|---|---|
| `created_device` | 创建设备 —— 文件首次在本机出现时记录，只写一次，不覆盖 |
| `modified_device` | 最后编辑设备 —— 本机真实编辑时更新 |

## 设备名（各设备独立，不受 Syncthing 同步影响）

设备标识存在**本机 localStorage**（不是 `data.json`），因此 **Syncthing 同步 `.obsidian` 目录不会覆盖各设备的设备名**。

- **桌面端**：留空则自动用系统主机名（如 `ThinkPad-JK`），也可手动改。
- **移动端**：拿不到主机名，请在设置里手动填一次（如 `Nick手机`）。

设置位置：`设置 → 社区插件 → 设备记录器 → ⚙️`。

## 防同步误写

`modified_device` 用 **editor-change 事件**（本机编辑器真实输入才触发），
而不是 `vault modify`。别的设备编辑后经 Syncthing 同步过来，只会触发
`vault modify`、**不会**触发 `editor-change` —— 所以不会把「最后编辑设备」
误写成同步到的设备。

## 防冲突设计

与 `update-time-on-edit` 等自动改 frontmatter 的插件和平共存，不死循环：

1. **防重入标志** —— 自己写 frontmatter 触发的事件一律拦截。
2. **值不变就不写** —— 设备名相同则跳过（区别于时间戳插件的「时间阈值」）。
3. **processFrontMatter + 恢复时间戳** —— 原子读写并恢复 `mtime`，不影响依赖 mtime 的插件。
4. **editor-change 的 source 过滤** —— 忽略程序化修改（编辑器刷新/同步重载）。
5. **忽略特殊文件** —— 非 md / Canvas.md / 空文件。

## 平台支持

| 平台 | 插件运行 | 设备名 |
|---|---|---|
| 桌面端 | ✅ | 自动主机名 / 手动改 |
| Android | ✅ | 手动填一次 |
| iOS | ❌ 不支持第三方插件 | - |
