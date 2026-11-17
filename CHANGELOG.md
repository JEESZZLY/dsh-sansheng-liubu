# Changelog

Notable changes are recorded here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions follow [SemVer](https://semver.org/).

## [0.1.1] - 2026-11-17

Works again on DSH 0.2.2-rc.3, where the `agentTeam` projection dropped its `members` array.

### Fixed

- Team data now comes from `agentTeam` **plus** `subagentCatalog`: `membersOf(team, catalog, lead)` keeps using `team.members` when the host still ships it, otherwise builds the roster from the Lead plus every catalog entry (`entry.name || entry.label || entry.id`). Without this the board showed "0 官" and every bureau was empty on rc.3.
- Empty-state detection changed from `if (!team)` to `if (!team && !members.length)`, so a session with a roster but no tasks no longer looks like "no team data".
- Completed column is sorted newest-first via `taskSeq()` / `recentFirst()` (task ids only — the host exposes no completion timestamp, so this is id order, not real completion order).

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
