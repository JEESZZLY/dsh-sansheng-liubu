# dsh-sansheng-liubu · Sansheng Liubu Board

English | [中文](README.zh.md)

Sansheng Liubu — a Three Departments & Six Ministries board for DSH agent teams.

A session-page tab, a left-rail entry and a full-page panel that render DSH's `agentTeam` projection the way a Tang court was drawn: 中书省 (drafting), 门下省 (review) and 尚书省 (dispatch) on top, the six ministries below, and a three-column task board at the bottom. When team data first arrives — or the task count grows — a yellow imperial edict unrolls across the header.

- **Zero dependencies**: only `react` from the host whitelist; no external fonts or images.
- **Read-only**: it does not dispatch work, change tasks or touch other plugins; jumping to a session goes through the host `uiWorkspace` service.
- **Pure front end**: the host half `lib/index.js` is an empty `apply` — it only exists so the Loader recognises the package.

## What it shows

| Area | Content |
|---|---|
| Header | 「三省六部 · N 官 · M 事」and the 「圣旨」 replay button. A `ws:yes/no · sid:yes/no` diagnostic tail (and a `props keys` tooltip) appears only after you set `window.__SANSHENG_DEBUG__ = true` in the console and reload |
| Three departments | 中书省 (drafting) / 门下省 (review) / 尚书省 (dispatch), one line per member: office + English target |
| Six ministries | 吏部 / 户部 / 礼部 / 兵部 / 刑部 / 工部 — 「无人」 when nobody is seated there |
| Tasks | 待办 / 在办 / 已成; the completed column is collapsed by default and scrolls |
| Edict | unrolls once when data first appears, again when the task count grows; the 「圣旨」 button replays it |

Office mapping: the exact table (`OFFICE_EXACT`) wins, then the member-name prefixes (`zhongshu-` / `menxia-` / `shangshu-` / `personnel-` / `hubu-` / `rites-` / `bingbu-` / `xingbu-` / `gongbu-`), otherwise 「未授官」.

## Install

```sh
dsh plugin add dsh-sansheng-liubu
```

Manual, when pnpm cannot run: copy `package.json`, `cordis.patch.yml` and `lib/` into `node_modules/dsh-sansheng-liubu/` inside the target profile, then append `"dsh-sansheng-liubu"` to `dsh.profile.bundles` in that profile's `package.json`. This is not a real dependency — a later `pnpm install` treats it as extraneous and removes it.

Restart the desktop app; 「三省六部」 shows up as a tab in any session, and as an entry in the left rail. Nothing is registered before a restart.

## Uninstall

Remove `"dsh-sansheng-liubu"` from `dsh.profile.bundles`, delete `node_modules/dsh-sansheng-liubu/`, restart.

## Compatibility

- **Host range**: `engines.dsh` = `>=0.2.1-rc.1 <0.3.0-0`. Inside that range the plugin is expected to load; outside it nothing is promised, and a 0.3 host will almost certainly need changes.
- **Client hook**: `dsh.client.inject` names the internal package `@deepseek-ai/dsh-client-ui-conversation`. That is a host-internal name, not a public API — a host upgrade may rename it, and a rename breaks this plugin silently.
- **Slot names** `conversation.view`, `sidebar.panellist` and `main` come from the host layout and are pinned to the range above, not to a permanent contract.
- **Not executed end-to-end.** No shell was available while these files were written: the code exists, has never been run in a browser, and every behavioural claim above is a reading of the source, not a test result.

## Privacy

- The board reads only what the host already exposes: the `agentTeam` projection (`props.useProjection('agentTeam')` → `{ members, tasks }`) and a snapshot of the session list (`byId` / `projectionsBySession`) for the running lamp.
- It never writes session data, never modifies tasks or members, makes no network requests and uploads nothing. There is no telemetry and no storage-domain usage; the only mutable state is DOM-local (a column's open flag, a description's expanded flag).
- Jumping to a session calls the host `uiWorkspace` service. The plugin asks the host to open a session; it does not read that session's contents.

## Known limitations

- Team data exists only in a Lead session. A sub-session finds its Lead through `sessions.subagentAddress(sid).parentSessionId` and reads that projection; when it cannot, the board says 「加载中」 instead of guessing.
- The board is read-only: it cannot create a card, change a status or delete anything.
- The main-panel slot is root-level, so the host passes no `sessionId`; that view offers a session picker with the first session preselected.
- `slots.register` is called with `label` as a function and without `locale`; if a future host validates the options strictly, the registration is swallowed by the local `try/catch` and the tab simply never appears.
- `tools/install.ps1` and `tools/pack.ps1` are Windows PowerShell 5.1 helper scripts with machine-local paths hardcoded (`D:\DSH\.dsh\profiles\desktop\`, `D:\DSH\skills\store\`). On another machine, edit them or just use `dsh plugin add` — they are not part of the published package.
- Every line above is a known gap, not a promise; see Compatibility for the missing end-to-end run.

MIT License.
