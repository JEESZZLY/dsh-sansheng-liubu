# dsh-sansheng-liubu · 三省六部看板

[English](README.md) | 中文

Sansheng Liubu — 给 DSH agent 团队画的一块唐代三省六部看板。

这是一个「会话页标签 + 左栏入口 + 整页面板」插件，把 DSH 的 `agentTeam` 投影按唐制画出来：中书省（拟诏）、门下省（封驳）、尚书省（调度）三块在上，吏户礼兵刑工六部在下，底部是待办／在办／已成三列任务板。首次拿到团队数据时——以及任务变多时——顶部会展开一卷明黄圣旨。

- **零依赖**：只用宿主白名单里的 `react`，无外部字体与图片。
- **只读**：不派活、不改任务、不动别的插件；跳会话靠宿主的 `uiWorkspace` 服务。
- **纯前端**：宿主半 `lib/index.js` 是个空 `apply`，只负责让 Loader 认得这个包。

## 界面

| 区域 | 内容 |
|---|---|
| 标题 | 「三省六部 · N 官 · M 事」与「圣旨」重播按钮；末尾小字 `ws:有/无 · sid:有/无` 与 `props keys` 悬浮提示默认不显示，需在控制台置 `window.__SANSHENG_DEBUG__ = true` 后刷新 |
| 三省 | 中书省（拟诏）／门下省（封驳）／尚书省（调度），每人一行「官职 + 英文 target」 |
| 六部 | 吏部／户部／礼部／兵部／刑部／工部，无人时显示「无人」 |
| 任务 | 待办／在办／已成；「已成」列默认折叠、可滚 |
| 圣旨 | 首次有数据展一次、事数变多再展一次，标题右侧「圣旨」按钮可重播 |

官职映射：精确表（`OFFICE_EXACT`）优先，其次按成员名前缀（`zhongshu-` / `menxia-` / `shangshu-` / `personnel-` / `hubu-` / `rites-` / `bingbu-` / `xingbu-` / `gongbu-`），都不中归「未授官」。

## 安装

```sh
dsh plugin add dsh-sansheng-liubu
```

跑不了 pnpm 时的手工装法：把 `package.json`、`cordis.patch.yml`、`lib/` 复制到目标 profile 的 `node_modules/dsh-sansheng-liubu/`，再往该 profile `package.json` 的 `dsh.profile.bundles` 末尾加 `"dsh-sansheng-liubu"`。注意这种装法**不是正规依赖**——之后跑一次 `pnpm install` 会把它当 extraneous 清掉。

装完重启桌面端，任一会话的标签栏里出现「三省六部」，左栏也多一条入口。不重启则什么都不注册。

## 卸载

删掉 `dsh.profile.bundles` 里的 `"dsh-sansheng-liubu"`，删掉 `node_modules/dsh-sansheng-liubu/`，重启。

## 兼容性

- **宿主范围**：`engines.dsh` = `>=0.2.1-rc.1 <0.3.0-0`。范围内预期能加载；范围外不作保证，0.3 线上大概率要改。
- **客户端挂钩**：`dsh.client.inject` 指向内部包名 `@deepseek-ai/dsh-client-ui-conversation`。这是宿主内部名，不是公开 API——宿主升级可能改名，一改名本插件就静默失效。
- **插槽名** `conversation.view`、`sidebar.panellist`、`main` 取自宿主版面，只钉在上面那个版本范围内，不是永久契约。
- **未端到端运行过。** 写这些文件时没有 shell：代码在，但从没在浏览器里跑过；上面每一条行为描述都是读源码得出的，不是测试结果。

## 隐私

- 看板只读宿主已经给出的东西：`agentTeam` 投影（`props.useProjection('agentTeam')` → `{ members, tasks }`），以及会话列表快照（`byId` / `projectionsBySession`）里的运行态。
- 不写会话数据、不改任务与成员、不发网络请求、不上传任何内容；没有埋点，也没用 storage-domain。唯一的可变状态是 DOM 局部的（某列开着、某段描述展开了）。
- 跳会话时调用宿主 `uiWorkspace` 服务：只是请宿主打开一个会话，不读那个会话的内容。

## 已知限制

- 团队数据只在 Lead 会话里有。子会话靠 `sessions.subagentAddress(sid).parentSessionId` 找到 Lead 再读它的投影，找不到就显示「加载中」，不去猜。
- 看板只读：不能建卡、不能改状态、不能删。
- 整页面板是 root 级插槽，宿主不传 `sessionId`；那一页给一个会话下拉，默认选第一个。
- `slots.register` 的 `label` 是按契约传的函数，且未传 `locale`；将来宿主若严格校验选项，注册会被本地 `try/catch` 吞掉，表现为标签根本不出现。
- `tools/install.ps1`、`tools/pack.ps1` 是 Windows PowerShell 5.1 脚本，路径写死本机（`D:\DSH\.dsh\profiles\desktop\`、`D:\DSH\skills\store\`）。换台机器请改路径，或直接用 `dsh plugin add`——这两个脚本不进发布包。
- 以上每条都是已知缺口，不是承诺；缺的那次端到端运行见「兼容性」。

MIT License.
