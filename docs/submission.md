# Submitting to the Obsidian community plugin directory

> Repository: https://github.com/nicholaskj/obsidian-device-tracker
> Version: 1.0.0
> Release: https://github.com/nicholaskj/obsidian-device-tracker/releases/tag/1.0.0

> 中文版：[submission.zh-CN.md](submission.zh-CN.md)

---

## Pre-flight checklist (all passed)

| Item | Requirement | Status |
|---|---|---|
| `manifest.json` | All 7 required fields | ✅ |
| `description` length | Under 250 characters | ✅ 183 |
| `versions.json` | `{"1.0.0": "1.4.0"}` | ✅ |
| `LICENSE` | Present | ✅ MIT |
| `README.md` | English | ✅ |
| `README.zh-CN.md` | Chinese, separate page | ✅ |
| `CHANGELOG.md` | Present | ✅ |
| `main.js` | Passes syntax check | ✅ `node --check` |
| Release | Tag matches manifest version | ✅ `1.0.0` |
| Release state | **Published, not a draft** | ✅ |
| Release assets | `main.js` + `manifest.json` | ✅ 8,651 B / 355 B |
| Artifact check | Downloaded build byte-identical to source | ✅ md5 `529e80eb...` |
| GitHub Actions | Tag triggers automatic release | ✅ Verified |
| Real-device test | Release build installed in Obsidian 1.13.7 | ✅ |

---

## Already done (2026-10-28)

```
✅ Pushed main branch to GitHub
✅ Tagged 1.0.0
✅ Actions built and published the release (not a draft)
✅ Downloaded the release artifact and re-tested it in a live vault — all four behaviours pass
```

---

## Next step: submit to the directory (needs your account)

This part **must be done by you**, because it requires logging into an Obsidian
account and authorizing GitHub.

### 1. Sign in

Go to https://community.obsidian.md/

Sign in with your **Obsidian account** (not GitHub). If you don't have one,
register with an email address — it's free.

### 2. Connect GitHub

- Go to **Account → Connected accounts**
- Click **Connect GitHub** and authorize in the browser
- Confirm it can see `nicholaskj/obsidian-device-tracker`

### 3. Claim the repository

- Go to **Plugins → Claim repository** (may also appear as "Add your plugin")
- Enter: `https://github.com/nicholaskj/obsidian-device-tracker`
- The system checks the repo for a valid `manifest.json` and release
- On success the repository is claimed under your account

### 4. Create the plugin entry

- **Plugins → New plugin**
- **Repository URL**: `https://github.com/nicholaskj/obsidian-device-tracker`
- **Owner**: select **Myself**

### 5. Wait for automated review

Checks typically take a few hours to a few days:

| Check | Status here |
|---|---|
| Manifest completeness | ✅ |
| Unique `id` | ✅ `device-tracker` confirmed free |
| Release exists and isn't a draft | ✅ |
| Tag matches version | ✅ |
| README / LICENSE present | ✅ |
| Code scan (eval / remote loading / risky APIs) | ✅ All local code, no network calls |
| Restricted APIs | ✅ None used |

Once approved, the plugin is merged into
[obsidian-releases](https://github.com/obsidianmd/obsidian-releases) and shows up
in the community plugin list on the next Obsidian update.

---

## If it gets rejected

| Reason | Fix |
|---|---|
| Description too long / contains "Obsidian" | Trim to under 250 chars, don't use the product name |
| `id` collision | Change the id — **note: the id is locked permanently once submitted** |
| Release is a draft | Click Publish on GitHub |
| Tag doesn't match manifest | `git tag -d 1.0.0 && git push github :refs/tags/1.0.0`, bump manifest, re-tag |
| LICENSE missing | Add one (MIT is the most common) |
| Remote code loading | Bundle everything locally |
| `eval` / `new Function` in `main.js` | Remove it |

---

## The id is permanent

Once `device-tracker` is submitted, it cannot change. To rebrand later you can
only change the `name` field; `id` stays the same, and existing users upgrade
seamlessly.

---

## Releasing a new version (for later)

```bash
cd D:/dev/obsidian-device-tracker
# 1. Bump "version" in manifest.json
# 2. Add a line to versions.json: {"<new version>": "<minAppVersion>"}
# 3. Add a section to CHANGELOG.md
git add -A && git commit -m "chore: bump to X.Y.Z"
git tag X.Y.Z
git push github main
git push github X.Y.Z     # ← pushing the tag triggers the release workflow
```

Then click **Publish release** on GitHub.

> `versions.json` must record the `minAppVersion` for **every** published
> version — that's how Obsidian knows which release to serve to users on older
> app versions.

---

## Links

- Submission docs: https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin
- Plugin guidelines: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- Community repo: https://github.com/obsidianmd/obsidian-releases
- Directory: https://community.obsidian.md/
