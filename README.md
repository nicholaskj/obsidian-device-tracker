# Device Tracker

**Know which device created a note — and which one touched it last.**

When you edit the same vault on a laptop, a desktop, and a phone, sync keeps the
files in step but throws away *who did what*. Device Tracker writes that
information straight into each note's frontmatter:

```yaml
---
created_device: ThinkPad-JK
modified_device: Pixel7-a3f9c2
---
```

> 中文说明见 [README.zh-CN.md](README.zh-CN.md)

---

## The problem it solves

With any file-sync tool (Syncthing, Dropbox, OneDrive, iCloud, git), a note
edited on your phone arrives on your desktop looking exactly like a note you
edited on your desktop. Two things go wrong:

1. **You can't tell where a change came from.** Was this paragraph written at
   the office or on the train?
2. **Naive tracking breaks itself.** The obvious implementation — "on file
   modify, write the current device name" — is wrong. A file arriving through
   sync *is* a modify event, so every device overwrites the field with its own
   name the moment it receives the file. You end up recording the last device
   that **synced**, not the last device that **edited**.

Device Tracker fixes both.

---

## How the sync problem is avoided

`modified_device` is driven by the **`editor-change`** event, not `vault modify`.

| Event | Fires when you type locally | Fires when a synced file arrives |
|---|---|---|
| `vault modify` | ✅ | ✅ ← the trap |
| `editor-change` | ✅ | ❌ |

A file synced in from another device never triggers `editor-change`, so the
field is only ever written by a device where a human actually typed.

Programmatic changes (editor refresh, sync reload) are filtered out too, via the
event's `source` flag.

---

## Device names stay local

The device name is stored in each device's **`localStorage`**, not in
`data.json`. This matters because `.obsidian/` is usually synced along with your
notes — if the name lived there, every device would overwrite every other
device's name and they'd all end up identical.

| Platform | Name source |
|---|---|
| Desktop | System hostname (e.g. `ThinkPad-JK`), editable |
| Android | Auto-generated `<model>-<6 chars>` (e.g. `Pixel7-a3f9c2`), editable |
| iOS | Not supported (see below) |

You can override the name any time in
**Settings → Community plugins → Device Tracker → ⚙️**.

---

## Fields

| Field | Meaning | When written |
|---|---|---|
| `created_device` | Device that created the note | First time the file exists on a device. Written once, never overwritten. |
| `modified_device` | Device that last edited the note | When a human types locally. Debounced 1.5 s. |

---

## Coexisting with other frontmatter plugins

Several popular plugins write to frontmatter automatically
(`update-time-on-edit`, `front-matter-timestamps`, and others). Device Tracker
is built to sit next to them without loops or fights:

1. **Re-entrancy guard** — events caused by our own write are ignored.
2. **Write only on change** — if the device name is already correct, nothing is
   written. No timestamp comparisons, no spurious diffs.
3. **`processFrontMatter` with restored timestamps** — atomic read-modify-write
   that puts `mtime` back, so plugins that key off file mtime are unaffected.
4. **`source` filtering** — ignores programmatic editor changes.
5. **File filtering** — skips non-Markdown files, `Canvas.md`, and empty files.

---

## Install

### From the community list
Once accepted into the official directory:
**Settings → Community plugins → Browse → search "Device Tracker" → Install → Enable**.

### Manually
1. Download `main.js`, `manifest.json` from the latest release.
2. Put them in `<your-vault>/.obsidian/plugins/device-tracker/`.
3. Reload the app, then enable **Device Tracker** in Community plugins.

### First run on a new device
The app asks whether you trust the vault author. Choose
**"Trust author and enable plugins"** — otherwise Community plugins stay in
Restricted Mode and nothing loads.

---

## How it differs from other provenance plugins

This is a **device** tracker, not a **human/AI** tracker.

| Plugin | Tracks |
|---|---|
| **Device Tracker** (this) | Which **machine** touched the note |
| [Authorship Tracker](https://github.com/bloknayrb/obsidian-authorship-tracker) | Which **author** (human vs. AI) wrote it |
| [Authorship](https://github.com/rflpazini/obsidian-authorship) | Colours typed vs. pasted vs. AI text in the editor |
| Front Matter Timestamps | **When** the note changed (no device dimension) |

They answer different questions and can run side by side. If you want
"was this my laptop or my phone?", use this one. If you want "did a human or an
AI write this?", use Authorship Tracker.

---

## Platform support

| Platform | Works | Device name |
|---|---|---|
| Windows / macOS / Linux | ✅ | Automatic hostname, or set manually |
| Android | ✅ | Auto-generated unique ID (model + short code), or set manually |
| iOS / iPadOS | ❌ | Third-party plugins aren't supported on iOS |

---

## Limitations

- **iOS is not supported** — no plugin API there at all.
- **Device names aren't retroactive.** Notes created before you installed the
  plugin have no `created_device`, and it isn't backfilled (there's no reliable
  way to know where an old file came from).
- **A note edited on two devices with the same custom name is
  indistinguishable.** Not a bug — just set distinct names.
- **Rename/move doesn't count as an edit.** `modified_device` reflects content
  edits only.

---

## License

[MIT](LICENSE)
