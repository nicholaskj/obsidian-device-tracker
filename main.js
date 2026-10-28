/*
 * 设备记录器 (device-tracker) v3
 *
 * 在笔记 frontmatter 里记录：
 *   - created_device  创建设备（文件首次在本机出现时记录一次，永不覆盖）
 *   - modified_device 最后编辑设备（本机真实编辑时更新）
 *
 * 核心改动（解决 Syncthing 多设备同步导致的设备名互相覆盖）：
 *
 * 1. 设备标识不再存 data.json（会随 .obsidian 被 Syncthing 同步覆盖），
 *    改存 localStorage（设备本地 WebView 存储，不随 Syncthing 同步）。
 *    - 桌面端：自动读系统 hostname（如 ThinkPad-JK），也可手动改
 *    - 移动端：拿不到 hostname，自动生成唯一标识（设备型号 + 随机短码），
 *      首次运行生成后存本地，每台设备互不覆盖，也可手动改
 *
 * 2. modified_device 改用 editor-change 事件（用户在本机编辑器真实输入才触发），
 *    替代 vault modify 事件。Syncthing 把别的设备的修改同步过来时，会触发
 *    vault modify，但不会触发 editor-change —— 从而避免「同步误写」。
 *    再叠加 info.source === 'user' 过滤程序化修改（编辑器刷新等）。
 *
 * 3. created_device 保持 vault create + 只写一次（同步来的文件已有该字段就不覆盖）。
 *
 * 防死循环（与 update-time-on-edit 等插件共存）：
 *   防重入标志 + 值不变不写 + processFrontMatter 恢复时间戳。
 */
const { Plugin, PluginSettingTab, Setting, TFile, Platform } = require('obsidian');

const STORAGE_KEY = 'device-tracker:deviceName';
const DEBOUNCE_MS = 1500; // 停止输入后多久才写 frontmatter

// ---- 移动端自动生成设备标识 ----

// 从 UA 解析设备型号：Android "Pixel 7"/"SM-G998B"，iOS "iPhone"
function parseMobileModel(ua) {
  if (!ua) return '';
  const m = ua.match(/Android[\s\d.;]*;\s*([^;)]+)/);
  if (m) {
    return m[1].trim().split(/\s+Build[/\s]/)[0].trim();
  }
  const ios = ua.match(/\b(iPhone|iPad|iPod)\b/);
  if (ios) return ios[1];
  return '';
}

// 型号 -> 紧凑可读标识（"Pixel 7" -> "Pixel7"）
function sanitizeModel(s) {
  const v = (s || '').replace(/[^A-Za-z0-9\u4e00-\u9fa5_-]+/g, '').slice(0, 20);
  return v || '移动设备';
}

// 短随机码（字母数字，len 位）
function randomId(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  try {
    if (globalThis.crypto && globalThis.crypto.getRandomValues) {
      const arr = new Uint32Array(len);
      globalThis.crypto.getRandomValues(arr);
      for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
      return out;
    }
  } catch (e) {
    // 回落 Math.random
  }
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

module.exports = class DeviceTrackerPlugin extends Plugin {
  async onload() {
    this._updating = new Set(); // 防重入：正在写 frontmatter 的文件路径
    this._debounceTimers = new Map(); // file.path -> timer

    this.addSettingTab(new DeviceTrackerSettingTab(this.app, this));

    // created_device：文件创建（本机新建 / 同步首次出现）
    this.registerEvent(
      this.app.vault.on('create', (file) => this.handleCreate(file)),
    );

    // modified_device：本机真实编辑（editor-change，同步不触发）
    this.registerEvent(
      this.app.workspace.on('editor-change', (editor, info) => {
        // 程序化修改（编辑器刷新/同步重载）忽略，只记录用户真实输入
        if (info && typeof info.source === 'string' && info.source !== 'user') {
          return;
        }
        const file = this.app.workspace.getActiveFile();
        if (file) this.scheduleModified(file);
      }),
    );
  }

  onunload() {
    for (const t of this._debounceTimers.values()) clearTimeout(t);
    this._debounceTimers.clear();
  }

  // ---- 设备名（localStorage，设备本地，不随 Syncthing 同步）----
  getDeviceName() {
    let name = '';
    try {
      name = localStorage.getItem(STORAGE_KEY) || '';
    } catch (e) {
      name = '';
    }
    if (name && name.trim()) return name.trim();

    // 桌面端：localStorage 为空时自动回落到系统 hostname
    if (Platform.isDesktop) {
      try {
        name = require('os').hostname();
      } catch (e) {
        name = '';
      }
      return (name || '').trim();
    }

    // 移动端：localStorage 为空时自动生成唯一标识（型号 + 短码），并立即存下
    name = this.generateMobileName();
    this.setDeviceName(name);
    return name;
  }

  generateMobileName() {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    return sanitizeModel(parseMobileModel(ua)) + '-' + randomId(6);
  }

  setDeviceName(name) {
    const v = (name || '').trim();
    try {
      if (v) localStorage.setItem(STORAGE_KEY, v);
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // 忽略（localStorage 不可用时退化为 hostname）
    }
  }

  // ---- 文件过滤 ----
  shouldIgnore(file) {
    if (!(file instanceof TFile)) return true;
    if (file.extension !== 'md') return true;
    if (file.name === 'Canvas.md') return true;
    return false;
  }

  // ---- created_device：创建时记录，只写一次 ----
  async handleCreate(file) {
    const device = this.getDeviceName();
    if (!device || this.shouldIgnore(file)) return;
    try {
      await this.app.fileManager.processFrontMatter(
        file,
        (fm) => {
          if (!fm['created_device']) fm['created_device'] = device;
        },
        { ctime: file.stat.ctime, mtime: file.stat.mtime },
      );
    } catch (e) {
      // 空文件 / YAML 解析失败等，静默
    }
  }

  // ---- modified_device：debounce 后写入 ----
  scheduleModified(file) {
    const device = this.getDeviceName();
    if (!device || this.shouldIgnore(file)) return;
    const existing = this._debounceTimers.get(file.path);
    if (existing) clearTimeout(existing);
    this._debounceTimers.set(
      file.path,
      setTimeout(() => {
        this._debounceTimers.delete(file.path);
        this.handleModified(file, device);
      }, DEBOUNCE_MS),
    );
  }

  async handleModified(file, device) {
    if (!device || this.shouldIgnore(file)) return;
    if (this._updating.has(file.path)) return; // 防重入

    // 值不变不写（metadataCache 快速判断）
    const cached = this.app.metadataCache.getFileCache(file);
    if (
      cached &&
      cached.frontmatter &&
      cached.frontmatter['modified_device'] === device
    ) {
      return;
    }

    this._updating.add(file.path);
    try {
      await this.app.fileManager.processFrontMatter(
        file,
        (fm) => {
          // 以磁盘真实值为准，相同就不改
          if (fm['modified_device'] === device) return;
          fm['modified_device'] = device;
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
        '存在本机 localStorage，不随 Syncthing 同步（各设备独立）。' +
          '桌面端留空则自动用系统主机名；移动端请手动填。',
      )
      .addText((text) => {
        nameInput = text;
        text
          .setPlaceholder('例如 ThinkPad-JK / Nick手机')
          .setValue(this.plugin.getDeviceName())
          .onChange((v) => this.plugin.setDeviceName(v));
      });

    if (Platform.isDesktop) {
      setting.addButton((btn) =>
        btn.setButtonText('检测本机名').onClick(() => {
          let name = '';
          try {
            name = require('os').hostname();
          } catch (e) {
            name = '';
          }
          if (name) {
            nameInput.setValue(name);
            this.plugin.setDeviceName(name);
          }
        }),
      );
    }

    new Setting(containerEl)
      .setName('说明')
      .setDesc(
        'created_device = 创建设备（只写一次）；modified_device = 最后编辑设备（本机真实编辑时更新，' +
          'Syncthing 同步不会触发）。与 update-time-on-edit 等插件兼容，不死循环。',
      );
  }
}
