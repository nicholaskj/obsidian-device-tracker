# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-28

First public release.

### Added
- `created_device` written to frontmatter the first time a note exists on a
  device; never overwritten afterwards.
- `modified_device` written when a human types locally, driven by
  `editor-change` so synced-in changes don't count as local edits.
- Per-device names stored in `localStorage` instead of `data.json`, so syncing
  `.obsidian/` no longer makes all devices share one name.
- Desktop: device name defaults to the system hostname, with a **Detect** button
  in settings.
- Mobile: device name auto-generated as `<model>-<6 chars>` on first run, so two
  phones with the same model don't collide.
- Settings tab for overriding the device name at any time.
- Five coexistence guards for running alongside other frontmatter-writing
  plugins: re-entrancy guard, write-on-change-only, `processFrontMatter` with
  restored timestamps, `source` filtering, and file filtering.

### Notes
- This release is the same code as the internal `v3` line, renumbered `1.0.0`
  for its first public version.
- iOS is not supported; the iOS app has no third-party plugin API.

[1.0.0]: https://github.com/nicholaskj/obsidian-device-tracker/releases/tag/1.0.0
