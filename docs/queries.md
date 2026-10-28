# Querying notes by device (DataviewJS)

How to read the device name inside DataviewJS and use it to filter notes.

> 中文版：[queries.zh-CN.md](queries.zh-CN.md)

Requires the [Dataview](https://github.com/blacksmithgu/obsidian-dataview) plugin.

---

## Getting the device name

The short version:

```js
const me = app.plugins.plugins['device-tracker'].getDeviceName();
```

That calls the plugin's own method, so it always matches what you see in settings.

The problem is it crashes when the plugin is disabled or failed to load —
`app.plugins.plugins['device-tracker']` is `undefined` and the whole block turns red.

Use this instead. It has three fallbacks in the same priority order the plugin
itself uses:

```js
function getDeviceName() {
  // 1. Ask the plugin (most accurate)
  const p = app.plugins.plugins['device-tracker'];
  if (p?.getDeviceName) {
    try { return p.getDeviceName(); } catch (e) {}
  }

  // 2. Plugin disabled → read the stored name directly
  let stored = '';
  try { stored = (localStorage.getItem('device-tracker:deviceName') || '').trim(); } catch (e) {}
  if (stored) return stored;

  // 3. Desktop → system hostname
  try {
    const { Platform } = require('obsidian');
    if (Platform.isDesktop) return require('os').hostname().trim();
  } catch (e) {}

  return '';  // Mobile with no plugin: not available
}
```

> **Why step 2 is often empty on desktop:** the plugin only writes to
> `localStorage` on mobile, where there's no hostname to fall back on. On desktop
> it reads the hostname each time. So on a desktop, step 2 usually returns
> nothing and step 3 does the work. That's expected, not a bug.

---

## Example 1 — notes last edited on this device

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
  ['Note', 'Created on', 'Last edited on'],
  dv.pages('"Projects"')
    .where(p => p.modified_device === me)
    .sort(p => p.file.mtime, 'desc')
    .map(p => [p.file.link, p.created_device ?? '—', p.modified_device ?? '—'])
);
```

Swap `"Projects"` for whatever folder you want.

---

## Example 2 — count notes per device

```dataviewjs
const pages = dv.pages('""').where(p => p.modified_device);

const counts = {};
for (const p of pages) {
  const d = p.modified_device;
  counts[d] = (counts[d] ?? 0) + 1;
}

dv.table(
  ['Device', 'Notes'],
  Object.entries(counts).sort((a, b) => b[1] - a[1])
);
```

`dv.pages('""')` means the whole vault.

---

## Example 3 — notes that moved between devices

These are the interesting ones: created on one machine, last touched on another.

```dataviewjs
dv.table(
  ['Note', 'Created on', 'Last edited on'],
  dv.pages('""')
    .where(p => p.created_device && p.modified_device &&
                p.created_device !== p.modified_device)
    .map(p => [p.file.link, p.created_device, p.modified_device])
);
```

Useful for spotting work that started at the office and continued at home.

---

## Example 4 — notes you've never edited here

Everything that only exists on this device because sync brought it over.

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
  ['Note', 'Last edited on'],
  dv.pages('""')
    .where(p => p.modified_device && p.modified_device !== me)
    .sort(p => p.file.mtime, 'desc')
    .map(p => [p.file.link, p.modified_device])
);
```

---

## Example 5 — plain DQL (no JavaScript)

If you only need a fixed device name, plain `dataview` is simpler:

````markdown
```dataview
TABLE created_device AS "Created", modified_device AS "Modified"
FROM "Projects"
WHERE modified_device = "ThinkPad-JK"
SORT file.mtime DESC
```
````

The catch: DQL can't call `getDeviceName()`. You have to **hard-code the device
name** in the query, which means the query only works on that one machine.

If you want the query to adapt to whichever device is reading it, use DataviewJS.

---

## Gotchas

**`dataview` blocks don't render in edit mode.** Switch to reading view (the
book icon) — otherwise you'll see the source code instead of the table.
`dataviewjs` blocks render in both modes, which is why they're used above.

**`require` is desktop-only.** `require('os')` is `undefined` on mobile, so the
`Platform.isDesktop` guard matters. Without it, every mobile user gets a red
error block.

**`app.appId` is not a device ID.** That's the *vault's* ID — identical on every
device that syncs the vault. Only `device-tracker`'s name is per-device.

**Renamed devices break old queries.** If you change a device name in settings,
notes already tagged with the old name keep the old value. Nothing retroactively
rewrites them.

**Notes predating the plugin have no fields.** `created_device` and
`modified_device` only exist on notes touched after installation. Filter with
`.where(p => p.modified_device)` to skip the rest.
