# 按设备名检索笔记（DataviewJS）

在 DataviewJS 里读出设备名，并按它筛选笔记。

> English: [queries.md](queries.md)

需要先装 [Dataview](https://github.com/blacksmithgu/obsidian-dataview) 插件。

---

## 先拿到设备名

最短的写法：

```js
const me = app.plugins.plugins['device-tracker'].getDeviceName();
```

这是直接调插件自己的方法，所以和你在设置页看到的**永远一致**。

问题是插件没启用、或者加载失败时会崩 —— `app.plugins.plugins['device-tracker']`
是 `undefined`，整块代码变红字。

改用下面这个，三级降级，优先级和插件内部完全一致：

```js
function getDeviceName() {
  // ① 直接问插件（最准）
  const p = app.plugins.plugins['device-tracker'];
  if (p?.getDeviceName) {
    try { return p.getDeviceName(); } catch (e) {}
  }

  // ② 插件没启用 → 直接读存下的名字
  let stored = '';
  try { stored = (localStorage.getItem('device-tracker:deviceName') || '').trim(); } catch (e) {}
  if (stored) return stored;

  // ③ 桌面端 → 系统主机名
  try {
    const { Platform } = require('obsidian');
    if (Platform.isDesktop) return require('os').hostname().trim();
  } catch (e) {}

  return '';  // 移动端且没装插件：取不到
}
```

> **为什么第 ② 步在桌面上经常是空的**：插件只在移动端才往 `localStorage`
> 写名字（手机上拿不到主机名）。桌面端每次都是现读 hostname。
> 所以桌面上第 ② 步多半返回空，由第 ③ 步兜底 —— 这是设计如此，不是 bug。

---

## 例子 1 · 本机最后改过的笔记

```dataviewjs
function getDeviceName() {
  const p = app.plugins.plugins['device-tracker'];
  if (p?.getDeviceName) { try { return p.getDeviceName(); } catch (e) {} }
  let s = '';
  try { s = (localStorage.getItem('device-tracker:deviceName') || '').trim(); } catch (e) {}
  if (s) return s;
  try {
    const { Platform } = require('obsidian');
    if (Platform.isDesktop) return require('os').hostname().trim();
  } catch (e) {}
  return '';
}

const me = getDeviceName();

dv.table(
  ['笔记', '创建于', '最后编辑于'],
  dv.pages('"学业"')
    .where(p => p.modified_device === me)
    .sort(p => p.file.mtime, 'desc')
    .map(p => [p.file.link, p.created_device ?? '—', p.modified_device ?? '—'])
);
```

把 `"学业"` 换成你要查的文件夹就行。

---

## 例子 2 · 按设备统计笔记数

```dataviewjs
const pages = dv.pages('""').where(p => p.modified_device);

const counts = {};
for (const p of pages) {
  const d = p.modified_device;
  counts[d] = (counts[d] ?? 0) + 1;
}

dv.table(
  ['设备', '笔记数'],
  Object.entries(counts).sort((a, b) => b[1] - a[1])
);
```

`dv.pages('""')` 是**全库**。

---

## 例子 3 · 跨设备流转的笔记

这类最有意思：在一台机器上建、在另一台机器上改的。

```dataviewjs
dv.table(
  ['笔记', '创建于', '最后编辑于'],
  dv.pages('""')
    .where(p => p.created_device && p.modified_device &&
                p.created_device !== p.modified_device)
    .map(p => [p.file.link, p.created_device, p.modified_device])
);
```

用来找「办公室起头、回家接着写」的活儿。

---

## 例子 4 · 本机从没编辑过的笔记

只因为同步才出现在本机的那些。

```dataviewjs
function getDeviceName() {
  const p = app.plugins.plugins['device-tracker'];
  if (p?.getDeviceName) { try { return p.getDeviceName(); } catch (e) {} }
  let s = '';
  try { s = (localStorage.getItem('device-tracker:deviceName') || '').trim(); } catch (e) {}
  if (s) return s;
  try {
    const { Platform } = require('obsidian');
    if (Platform.isDesktop) return require('os').hostname().trim();
  } catch (e) {}
  return '';
}

const me = getDeviceName();

dv.table(
  ['笔记', '最后编辑于'],
  dv.pages('""')
    .where(p => p.modified_device && p.modified_device !== me)
    .sort(p => p.file.mtime, 'desc')
    .map(p => [p.file.link, p.modified_device])
);
```

---

## 例子 5 · 纯 DQL（不写 JavaScript）

如果设备名是固定的，用普通 `dataview` 更省事：

````markdown
```dataview
TABLE created_device AS "创建", modified_device AS "最后编辑"
FROM "学业"
WHERE modified_device = "ThinkPad-JK"
SORT file.mtime DESC
```
````

**代价**：DQL 调不到 `getDeviceName()`，设备名必须**写死**在查询里，
所以这个查询只在那一台机器上有意义。

想让查询「跟着当前设备走」，就得用 DataviewJS。

---

## 几个坑

**① `dataview` 块在编辑模式不渲染。** 要切到**阅读视图**（书本图标），
否则看到的是源码不是表格。`dataviewjs` 块两种模式都渲染 —— 这也是上面都用 dvjs 的原因。

**② `require` 只有桌面端能用。** `require('os')` 在手机上是 `undefined`，
所以 `Platform.isDesktop` 那道判断不能省，省了手机上整块报红。

**③ `app.appId` 不是设备码。** 那是**库**的 ID，同步同一个库的所有设备看到的都一样。
只有 `device-tracker` 的设备名才是分设备的。

**④ 改过设备名的，老查询会失准。** 在设置里改名后，已经打上旧名字的笔记
不会自动改写 —— 插件没有回溯机制。

**⑤ 装插件之前的笔记没有这些字段。** `created_device` / `modified_device`
只存在于装插件之后碰过的笔记上。筛选时加一句 `.where(p => p.modified_device)`
把没有的跳过。
