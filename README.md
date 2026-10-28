# 设备记录器 (device-tracker)

Obsidian 插件：在笔记 frontmatter 里自动记录「创建设备」和「最后编辑设备」。

## 字段

| 字段 | 含义 |
|---|---|
| `created_device` | 创建设备 —— 文件首次在本机出现时记录，只写一次，不覆盖 |
| `modified_device` | 最后编辑设备 —— 每次编辑更新为本机设备名 |

## 使用

1. 每台设备：`设置 → 社区插件 → 设备记录器 → ⚙️`，填本机设备名（桌面端有「检测本机名」按钮）。
2. 新建 / 编辑笔记，frontmatter 自动写入对应字段。
3. 不填设备名时插件不动作。

## 防冲突设计

与 `update-time-on-edit` 等自动改 frontmatter 的插件和平共存，不会死循环：

1. **防重入标志** —— 自己写 frontmatter 触发的 `modify` 事件一律拦截。
2. **值不变就不写** —— 设备名没有「时间差」概念，用「值相等就跳过」收敛（区别于时间戳插件的「时间阈值」）。
3. **processFrontMatter + 恢复时间戳** —— 原子读写并恢复 `mtime`，不影响依赖 mtime 的插件。
4. **忽略特殊文件** —— 非 md / Canvas.md / 空文件。

## 已知限制

Obsidian API 无法区分「本机编辑」与「Syncthing 同步」，同步过来的文件也可能触发 `modify` 而覆盖 `modified_device`。
