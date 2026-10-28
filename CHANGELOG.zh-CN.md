# 更新日志

本项目的重要变更都记录在这里。
格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

> English: [CHANGELOG.md](CHANGELOG.md)

## [1.0.0] - 2026-10-28

首次公开发布。

### 新增

- `created_device` —— 文件首次在某台设备出现时写入 frontmatter，之后永不覆盖。
- `modified_device` —— 本机真实打字时更新。由 `editor-change` 事件驱动，
  所以同步进来的改动不算本机编辑。
- 设备名存在各设备自己的 `localStorage` 里，不是 `data.json`。
  这样同步 `.obsidian/` 目录时，不会把所有设备的设备名冲成同一个。
- 桌面端：设备名默认取系统主机名，设置页有 **Detect** 按钮。
- 移动端：首次运行自动生成 `<型号>-<6位短码>`，同型号的两台手机不会撞名。
- 设置页可以随时改设备名。
- 五层共存防护，与其他写 frontmatter 的插件和平相处：
  防重入标志、值不变不写、`processFrontMatter` 恢复时间戳、
  `source` 过滤、文件过滤。

### 说明

- 本版本内容等同于内部 `v3` 线，为了首次公开发布重新编号为 `1.0.0`。
- 不支持 iOS —— iOS 版应用没有第三方插件 API。

[1.0.0]: https://github.com/nicholaskj/obsidian-device-tracker/releases/tag/1.0.0
