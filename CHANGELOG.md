# Changelog

Notable changes are recorded here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions follow [SemVer](https://semver.org/).

## [0.1.0] - 2026-11-15

First release. Everything below was written in a session without a shell: the files exist, and nothing has been executed end-to-end yet (see README → Compatibility).

### Added

- Session-page tab「三省六部」(`conversation.view`) rendering the host's `agentTeam` projection: three departments on top, six ministries below, task board at the foot.
- Left-rail entry (`sidebar.panellist`) and a full-page `main` panel with a session picker, so the board is reachable without opening a session tab first.
- Imperial edict animation（圣旨）: unrolls when team data first appears, unrolls again when the task count grows, and replays from the header button.
- Task board with 待办 / 在办 / 已成 columns; the completed column is a native `<details>` collapsed by default, and long descriptions clamp to two lines behind an expand button.
- Member cards jump to that member's session through the host `uiWorkspace` service (Lead → plain session id, sub-agent → `continuable` object form), with a disabled fallback when the service is absent.
- Office mapping: exact table (`OFFICE_EXACT`) first, then member-name prefixes (`zhongshu-` / `menxia-` / `shangshu-` / `personnel-` / `hubu-` / `rites-` / `bingbu-` / `xingbu-` / `gongbu-`), otherwise「未授官」.
- Running lamp on a member card, fed by the session-list snapshot rather than by any write into the projection.
