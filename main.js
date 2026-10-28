/*
 * 设备记录器 (device-tracker)
 *
 * 在笔记 frontmatter 里记录两个字段：
 *   - created_device  创建设备（文件首次在本机出现时记录一次，永不覆盖）
 *   - modified_device 最后编辑设备（每次修改更新为本机设备名）
 *
 * 每台设备在「设置 → 社区插件 → 设备记录器 → ⚙️」里填自己的设备名。
 *
 * 防冲突设计（核心，避免与其他自动改 frontmatter 的插件死循环 / 互相覆盖）：
 *   1. 防重入标志 —— 自己写 frontmatter 触发的 modify 事件一律拦截，硬性保证不死循环。
 *   2. 值不变就不写 —— 写之前对比 frontmatter 当前值 vs 本机设备名，相同直接跳过；
 *      这是「设备名」场景的正确收敛方式（不同于时间戳插件靠「时间差阈值」收敛）。
 *   3. processFrontMatter + 恢复时间戳 —— 用官方 fileManager.processFrontMatter 原子读写，
 *      并传入 {ctime, mtime} 恢复文件时间戳，不影响 update-time-on-edit 等依赖 mtime 的插件。
 *   4. 忽略特殊文件 —— 非 md / Canvas.md / 空文件不处理。
 *
 * 已知限制（Obsidian API 层面无法区分「本机编辑」与「Syncthing 同步」）：
 *   从其他设备同步过来的文件也会触发 modify 事件，可能把 modified_device 覆盖为本机名。
 *   如需精确区分，后续可加「editor-change 模式」（仅记录本机编辑器真实输入）。
 */
const { Plugin, PluginSettingTab, Setting, TFile, Platform } = require('obsidian');

const DEFAULT_SETTINGS = {
  deviceName: '', // 本机设备名，各设备自填
};

module.exports = class DeviceTrackerPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this._updating = new Set(); // 防重入：正在处理（写 frontmatter）的文件路径

    this.addSettingTab(new DeviceTrackerSettingTab(this.app, this));

    // 文件创建 → 记录 created_device（仅当尚无该字段）
    this.registerEvent(
      this.app.vault.on('create', (file) => this.handleCreate(file)),
    );
    // 文件修改 → 更新 modified_device（值不变就不写）
    this.registerEvent(
      this.app.vault.on('modify', (file) => this.handleModify(file)),
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async updateDeviceName(name) {
    this.settings.deviceName = (name || '').trim();
    await this.saveSettings();
  }

  // 本机设备名（未设置则插件不动作）
  get deviceName() {
    return (this.settings.deviceName || '').trim();
  }

  // 忽略非笔记 / 特殊文件
  shouldIgnore(file) {
    if (!(file instanceof TFile)) return true;
    if (file.extension !== 'md') return true;
    if (file.name === 'Canvas.md') return true;
    return false;
  }

  async handleCreate(file) {
    if (!this.deviceName || this.shouldIgnore(file)) return;
    try {
      await this.app.fileManager.processFrontMatter(
        file,
        (fm) => {
          if (!fm['created_device']) {
            fm['created_device'] = this.deviceName;
          }
        },
        { ctime: file.stat.ctime, mtime: file.stat.mtime },
      );
    } catch (e) {
      // 空文件 / YAML 解析失败等，静默忽略
    }
  }

  async handleModify(file) {
    if (!this.deviceName || this.shouldIgnore(file)) return;
    if (this._updating.has(file.path)) return; // 防线1：防重入

    // 防线2：metadataCache 快速判断，值已正确就不再调用 processFrontMatter
    const cached = this.app.metadataCache.getFileCache(file);
    if (cached && cached.frontmatter && cached.frontmatter['modified_device'] === this.deviceName) {
      return;
    }

    this._updating.add(file.path);
    try {
      await this.app.fileManager.processFrontMatter(
        file,
        (fm) => {
          // 防线3：以磁盘真实值为准，相同就不改
          if (fm['modified_device'] === this.deviceName) return;
          fm['modified_device'] = this.deviceName;
        },
        { ctime: file.stat.ctime, mtime: file.stat.mtime },
      );
    } catch (e) {
      // 静默
    } finally {
      this._updating.delete(file.path);
    }
  }
};

class DeviceTrackerSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    let nameInput;
    const setting = new Setting(containerEl)
      .setName('本机设备名')
      .setDesc(
        '记录到 frontmatter 的设备标识。每台设备各填各的，例如 ThinkPad-JK / iPhone / MacBook。留空则插件不记录。',
      )
      .addText((text) => {
        nameInput = text;
        text
          .setPlaceholder('例如 ThinkPad-JK')
          .setValue(this.plugin.settings.deviceName)
          .onChange(async (v) => {
            await this.plugin.updateDeviceName(v);
          });
      });

    // 桌面端：一键检测本机主机名；移动端无 Node os 模块，不显示
    if (Platform.isDesktop) {
      setting.addButton((btn) =>
        btn.setButtonText('检测本机名').onClick(async () => {
          let name = '';
          try {
            name = require('os').hostname();
          } catch (e) {
            name = '';
          }
          if (name) {
            nameInput.setValue(name);
            await this.plugin.updateDeviceName(name);
          }
        }),
      );
    }

    new Setting(containerEl)
      .setName('说明')
      .setDesc(
        'created_device = 创建设备（只写一次）；modified_device = 最后编辑设备（每次编辑更新）。' +
          '与 update-time-on-edit 等自动改 frontmatter 的插件兼容，不会死循环。',
      );
  }
}
