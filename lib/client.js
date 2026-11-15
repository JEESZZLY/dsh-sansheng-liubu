/*!
 * dsh-sansheng-liubu · 浏览器半（**手写 bundle**，不经 tsdown/esbuild）
 *
 * 形状照 D:\DSH\projects\orchestra\docs\PLUGIN-CONTRACT.md §6：
 *   经典脚本（无 import/export），唯一动作 window.__ModuleLoader__.load({ id, factory })；
 *   factory(require) 体内是 CJS 语义，最终返回一个 cordis 插件对象 { name, inject, apply }。
 *
 * 取数照 D:\DSH\projects\orchestra\docs\SLOTS-AND-TEAM-DATA.md：
 *   主路 props.useProjection('agentTeam') → { members, tasks }（hook，内部已订阅）；
 *   补运行态 ctx.sessions.list 快照的 byId[id].running（subscribe 并解订阅）。
 *
 * 交互轮照 D:\DSH\projects\orchestra\docs\BOARD-INTERACTIVITY-VERDICT.md（判「准其二驳其三」）+
 * docs/UIWORKSPACE-SERVICE.md（服务名与取法改正）：
 *   成员卡点击跳会话（uiWorkspace 走静态 inject + ctx.uiWorkspace，另留 ctx.get 兜底与禁用降级）、
 *   任务卡 description 两行截断 + 常驻展开按钮、已成列改原生 <details> 默认折叠。
 *   静态 inject = ['slots','sessions','uiWorkspace']：浏览器半的 exports.inject 是 cordis fiber inject，
 *   服务就绪才 apply；dsh.client.inject 只管加载顺序。若该服务在本 profile 不存在，本插件会 pending
 *   （表现为整个「三省六部」标签消失）——届时退回纯惰性取法。
 * 风险自述：本文件未在浏览器里跑过（本轮无 shell、不重启），形状对齐靠文档而非实测。
 *
 * 调试：控制台置 window.__SANSHENG_DEBUG__ = true 后刷新，标题行才会带 props keys / ws / sid 诊断串；
 * 默认界面只留「三省六部 · N 官 · M 事」与「圣旨」按钮。
 */
window.__ModuleLoader__.load({
  id: 'dsh-sansheng-liubu',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports

    // 平台 seed 表成员（契约 §2：shell 预置了 react / react-dom / jsx-runtime / ui-primitives）
    const { createElement: h, useEffect, useMemo, useRef, useState, Component } = require('react')

    // ---------------- 样式：极小一段，类名一律 sl- 前缀 ----------------
    try {
      var style = document.createElement('style')
      style.id = 'dsh-sansheng-liubu-style'
      style.dataset.plugin = 'dsh-sansheng-liubu'
      style.dataset.pluginCss = 'sl-board'
      style.textContent = [
        '.sl-board{padding:16px 20px;font-size:13px;line-height:1.6;position:relative}',
        '.sl-hd{font-size:15px;font-weight:600;margin:0 0 12px}',
        '.sl-prov-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0 0 14px}',
        '.sl-prov{border:1px solid rgba(128,128,128,.28);border-radius:8px;padding:8px 10px}',
        '.sl-prov-hd{font-weight:600;margin:0 0 6px}',
        '.sl-duty{font-weight:400;font-size:12px;opacity:.6}',
        '.sl-member{border-top:1px dashed rgba(128,128,128,.28);padding:6px 0 4px}',
        '.sl-member:first-child{border-top:0;padding-top:0}',
        '.sl-member.sl-clickable{cursor:pointer}',
        '.sl-member.sl-clickable:hover{background:rgba(128,128,128,.08)}',
        '.sl-title{font-size:12px;opacity:.85}',
        '.sl-name{font-family:ui-monospace,Consolas,monospace;font-size:12px;word-break:break-all}',
        '.sl-run{display:inline-block;margin-left:6px;padding:0 6px;border-radius:9px;background:rgba(80,180,120,.18);color:var(--dsw-alias-state-success-primary,#2f8f5b);font-size:11px}',
        '.sl-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0 0 14px}',
        '.sl-mou{border:1px solid rgba(128,128,128,.2);border-radius:8px;padding:8px 10px;min-height:0}',
        '.sl-mou-hd{font-weight:600;margin:0 0 4px}',
        '.sl-extra{font-size:12px;opacity:.7;margin:0 0 14px;word-break:break-all}',
        '.sl-tasks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:start}',
        '.sl-col{border:1px solid rgba(128,128,128,.2);border-radius:8px;padding:8px 10px;max-height:52vh;overflow:auto}',
        '.sl-col-hd{font-weight:600;margin:0 0 6px}',
        '.sl-details>summary{cursor:pointer}',
        '.sl-task{border-top:1px dashed rgba(128,128,128,.28);padding:6px 0 4px}',
        '.sl-task:first-child{border-top:0;padding-top:0}',
        '.sl-task-sub{font-size:12px}',
        '.sl-desc{margin:2px 0 0;font-size:11px;opacity:.72;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
        '.sl-desc-open{display:block;overflow:visible}',
        '.sl-more{margin:2px 0 0;padding:0;border:0;background:none;color:var(--dsw-alias-state-success-primary,#2f8f5b);font-size:11px;cursor:pointer}',
        '.sl-task-own{font-size:11px;opacity:.6}',
        '.sl-target{font-size:10px;opacity:.45}',
        '.sl-flag{margin-left:6px;font-size:11px;color:var(--dsw-alias-state-error-primary,#c0392b)}',
        '.sl-empty{font-size:12px;opacity:.5}',
        '.sl-edict{position:absolute;left:50%;top:6px;transform:translateX(-50%);z-index:20;pointer-events:none;animation:sl-edict-in 520ms cubic-bezier(.2,.9,.2,1) both}',
        '.sl-edict-scroll{background:linear-gradient(180deg,#fdf3cf,#f3dd9b 45%,#e8c96f);border:1px solid #c8a24a;border-radius:3px;box-shadow:0 6px 18px rgba(120,90,20,.25);padding:8px 26px;color:#6b3f12;font-family:ui-serif,Georgia,\'Songti SC\',serif}',
        '.sl-edict-rod{position:absolute;top:0;bottom:0;width:6px;background:linear-gradient(90deg,#8a5a1c,#d9b25c,#8a5a1c);border-radius:3px}',
        '.sl-edict-out{animation:sl-edict-out 420ms ease-in both}',
        '@keyframes sl-edict-in{from{opacity:0;transform:translateX(-50%) scaleX(.04)}to{opacity:1;transform:translateX(-50%) scaleX(1)}}',
        '@keyframes sl-edict-out{from{opacity:1;transform:translateX(-50%) scaleY(1)}to{opacity:0;transform:translateX(-50%) scaleY(.06)}}',
        '.sl-edict-line1{font-size:11px;letter-spacing:.32em;opacity:.75}',
        '.sl-edict-line2{font-size:14px;font-weight:600;letter-spacing:.14em}',
        '.sl-edict-seal{display:inline-block;margin-left:8px;padding:1px 4px;border:1px solid #b23b2e;border-radius:2px;color:#b23b2e;font-size:10px;transform:rotate(-4deg)}',
        '.sl-edict-btn{margin-left:8px;padding:0 6px;border:1px solid rgba(128,128,128,.35);border-radius:9px;background:none;font-size:11px;cursor:pointer;color:inherit;opacity:.7}',
        '@media (prefers-reduced-motion: reduce){.sl-edict,.sl-edict-out{animation:none}}',
        '.sl-pick{margin:0 0 8px;font-size:12px;opacity:.8}',
        '.sl-pick-sel{margin-left:6px;max-width:320px;font-size:12px;padding:1px 4px;border:1px solid rgba(128,128,128,.35);border-radius:6px;background:transparent;color:inherit}',
        '.sl-open-btn{margin-left:8px;padding:0 6px;border:1px solid rgba(128,128,128,.35);border-radius:9px;background:none;font-size:11px;cursor:pointer;color:inherit}',
      ].join('\n')
      if (!document.getElementById(style.id)) document.head.appendChild(style)
    } catch (e) {
      console.error('[sansheng-liubu]', e)
    }

    // ---------------- 官职映射：精确表优先，前缀兜底，都不中 → 未授官 ----------------
    // bureau 用 ASCII 键，显示名走 BUREAU_NAME；title 为空表示只知行省、不知阶。
    const OFFICE_EXACT = {
      'lead': { bureau: 'shangshu', title: '尚书令' },
      '总管': { bureau: 'shangshu', title: '尚书令' },
      'bishu-auditor': { bureau: 'menxia', title: '给事中' },
      'bishu-builder': { bureau: 'gongbu', title: '郎中' },
      'bishu-builder-dev': { bureau: 'gongbu', title: '员外郎' },
      'bishu-tmpfix': { bureau: 'gongbu', title: '主事' },
      'bishu-publisher': { bureau: 'bingbu', title: '郎中' },
      'bishu-docs': { bureau: 'rites', title: '郎中' },
      'bishu-docs2': { bureau: 'rites', title: '员外郎' },
      'gitee-api-researcher': { bureau: 'zhongshu', title: '中书舍人' },
    }
    const BUREAU_NAME = {
      zhongshu: '中书省',
      menxia: '门下省',
      shangshu: '尚书省',
      personnel: '吏部',
      hubu: '户部',
      rites: '礼部',
      bingbu: '兵部',
      xingbu: '刑部',
      gongbu: '工部',
    }
    const BUREAU_DUTY = { zhongshu: '拟诏', menxia: '封驳', shangshu: '调度' }
    const PROVINCES = ['zhongshu', 'menxia', 'shangshu']
    const MINISTRIES = ['personnel', 'hubu', 'rites', 'bingbu', 'xingbu', 'gongbu']
    const PREFIX_BUREAUS = [
      ['zhongshu-', 'zhongshu'],
      ['menxia-', 'menxia'],
      ['shangshu-', 'shangshu'],
      ['personnel-', 'personnel'],
      ['hubu-', 'hubu'],
      ['rites-', 'rites'],
      ['bingbu-', 'bingbu'],
      ['xingbu-', 'xingbu'],
      ['gongbu-', 'gongbu'],
    ]

    function officeOf(member) {
      var name = (member && member.name) || ''
      if (Object.prototype.hasOwnProperty.call(OFFICE_EXACT, name)) return OFFICE_EXACT[name]
      for (var i = 0; i < PREFIX_BUREAUS.length; i++) {
        var pair = PREFIX_BUREAUS[i]
        if (name.indexOf(pair[0]) === 0) return { bureau: pair[1], title: '' }
      }
      return { bureau: '', title: '' }
    }

    function officeText(office) {
      var o = office || { bureau: '', title: '' }
      if (!o.bureau) return '未授官'
      var b = BUREAU_NAME[o.bureau] || o.bureau
      return o.title ? b + ' · ' + o.title : b
    }

    // ---------------- 取数：主路 useProjection + 运行态会话快照 ----------------
    function useTeam(props) {
      var team = null
      try {
        if (props && typeof props.useProjection === 'function') team = props.useProjection('agentTeam')
      } catch (e) {
        console.error('[sansheng-liubu]', e)
      }
      return team || null
    }

    // 团队数据：按会话投影表取（判词 §2/§4 官方同款 selector），只在目标值变化时重渲染。
    // 不用 byId[lead].projectionValues —— 那只是列表缓存子集（判词 §2 驳）。
    function useTeamFor(props, lead) {
      if (!props || typeof props.useSessions !== 'function' || !lead) return void 0
      return props.useSessions(function (state) {
        var entry = state && state.projectionsBySession ? state.projectionsBySession[lead] : null
        return entry && entry.values ? entry.values.agentTeam : void 0
      })
    }

    // 按需加载（判词 §4）：父投影为空就 refreshProjections(lead)，每个 lead 至多一次，try/catch 不抛出。
    function ensureProjection(props, lead, team, reqRef) {
      try {
        var seen = reqRef && reqRef.current ? reqRef.current : null
        if (!seen || !lead || team || seen[lead]) return
        seen[lead] = true
        var sessions = props && props.sessions
        if (sessions && typeof sessions.refreshProjections === 'function') sessions.refreshProjections(lead)
      } catch (e) {
        console.error('[sansheng-liubu] refreshProjections', e)
      }
    }

    // 会话列表快照里若有投影表，就按 lead 取那份 agentTeam（中栏 root 插槽没有 seat hook 时唯一的取数路）。
    // 字段名与 useSessions 的 state 同形（projectionsBySession[lead].values.agentTeam），取不到一律 undefined。
    function teamFromRows(rows, lead) {
      try {
        if (!rows || !lead) return void 0
        var p = rows.projectionsBySession || rows.projections || null
        var entry = p ? p[lead] : null
        var v = entry && (entry.values || entry)
        return v && v.agentTeam ? v.agentTeam : void 0
      } catch (e) {
        console.error('[sansheng-liubu] teamFromRows', e)
        return void 0
      }
    }

    // 兜底按钮：拿 uiWorkspace 打开该会话（拿不到就静默，不抛）
    function openSessionOf(props) {
      try {
        var ws = props && typeof props.getUiWorkspace === 'function' ? props.getUiWorkspace() : null
        var sid = props && props.sessionId
        if (ws && typeof ws.openSession === 'function' && sid) ws.openSession(sid)
      } catch (e) {
        console.error('[sansheng-liubu] openSession', e)
      }
    }

    function useSessionRows(sessions) {
      var list = sessions && sessions.list
      var [rows, setRows] = useState(function () {
        try {
          return list && typeof list.getSnapshot === 'function' ? list.getSnapshot() : null
        } catch (e) {
          console.error('[sansheng-liubu]', e)
          return null
        }
      })
      useEffect(function () {
        if (!list || typeof list.subscribe !== 'function') return undefined
        var off = list.subscribe(function () {
          try {
            setRows(list.getSnapshot())
          } catch (e) {
            console.error('[sansheng-liubu]', e)
          }
        })
        setRows(list.getSnapshot()) // 订阅后补一次，防丢事件
        return function () {
          if (typeof off === 'function') off() // 解订阅
        }
      }, [list])
      return rows
    }

    // 会话 id 列表（给中栏下拉用）：有排序数组就用它，再用 byId 的键补齐。
    // 快照真实形状只证到 byId（官方 client.js:91 state.byId[id].running），排序键按常见写法兜三路。
    function sessionIds(rows) {
      if (!rows) return []
      var byId = rows.byId || {}
      var ids = Object.keys(byId)
      var order = rows.order || rows.ids || rows.list || null
      if (Array.isArray(order) && order.length) {
        var out = []
        for (var i = 0; i < order.length; i++) {
          var it = order[i]
          var id = typeof it === 'string' ? it : (it && it.id)
          if (id && byId[id] && out.indexOf(id) < 0) out.push(id)
        }
        for (var j = 0; j < ids.length; j++) if (out.indexOf(ids[j]) < 0) out.push(ids[j])
        return out
      }
      return ids
    }

    // 下拉显示名：标题优先，取不到就退成 id 前 8 位（绝不显示 undefined）。
    function sessionLabel(rows, id) {
      var row = rows && rows.byId ? rows.byId[id] : null
      var t = (row && (row.title || row.displayTitle || row.name)) || ''
      return t ? (t.length > 24 ? t.slice(0, 24) + '…' : t) : String(id).slice(0, 8)
    }

    // ---------------- 点击跳会话（判 §若准 1/2：惰性 uiWorkspace + 三分支 + 不抛出） ----------------
    // 卡片是否可点：uiWorkspace.openSession 在 + 拿得到 sessionId，缺任一即禁用态（绝不 pending、绝不静默）。
    // 服务解析：三路兜底 + 模块级缓存。ctx.inject 那条**异步生效**（订阅到之后下一次渲染/点击才可用），
    // 绝不 await、绝不阻塞 apply —— 拿不到就是 null，插件照常装载、看板照常渲染成禁用态。
    var wsCache = null

    function resolveUiWorkspace(ctx) {
      if (wsCache) return wsCache
      // 正路（勘察 UIWORKSPACE-SERVICE.md §④）：exports.inject 声明 uiWorkspace 后，
      // cordis fiber inject 会等该服务就绪才 apply，故 ctx.uiWorkspace 是最可靠的取法。
      try {
        wsCache = (ctx && ctx.uiWorkspace) || null
      } catch (e) {}
      if (wsCache) return wsCache
      try {
        wsCache = ctx && typeof ctx.get === 'function' ? ctx.get('uiWorkspace') : null
      } catch (e) {}
      if (wsCache) return wsCache
      try {
        wsCache = ctx && ctx.root && typeof ctx.root.get === 'function' ? ctx.root.get('uiWorkspace') : null
      } catch (e) {}
      if (wsCache) return wsCache
      try {
        if (ctx && typeof ctx.inject === 'function') {
          ctx.inject(['uiWorkspace'], function (sub) {
            try { wsCache = (sub && sub.get('uiWorkspace')) || wsCache } catch (e) {}
          })
        }
      } catch (e) {}
      return wsCache
    }

    function canJump(props) {
      var ws = props && props.getUiWorkspace ? props.getUiWorkspace() : null
      return !!(ws && typeof ws.openSession === 'function' && props.sessionId)
    }

    function jumpHint(props) {
      var ws = props && props.getUiWorkspace ? props.getUiWorkspace() : null
      if (!ws || typeof ws.openSession !== 'function') return '无 uiWorkspace 服务，点击不可用'
      return '无会话上下文，点击不可用'
    }

    // 本会话的 Lead 会话 id：用 sessions 服务的专用方法（判词 §1），异常/取不到就退回自身。
    function leadSessionId(props) {
      var sid = (props && props.sessionId) || ''
      try {
        var sessions = props && props.sessions
        var address = sessions && typeof sessions.subagentAddress === 'function' ? sessions.subagentAddress(sid) : null
        return (address && address.parentSessionId) || sid
      } catch (e) {
        console.error('[sansheng-liubu] leadSessionId', e)
        return sid
      }
    }

    function openMember(props, member) {
      try {
        var ws = props && props.getUiWorkspace ? props.getUiWorkspace() : null
        // 分支①：没有 uiWorkspace 或没有 openSession → 什么都不做（卡片此时是禁用态，不挂 onClick）
        if (!ws || typeof ws.openSession !== 'function') return
        var lead = leadSessionId(props)
        if (!lead) return
        if (member && member.id && member.id === lead) {
          // 分支②：点的是 Lead 本人 → 一元形态
          ws.openSession(lead)
        } else if (member && member.id) {
          // 分支③：点的是子代理 → 对象形态 + continuable
          ws.openSession({ parentSessionId: lead, childSessionId: member.id, mode: 'continuable' })
        }
      } catch (e) {
        console.error('[sansheng-liubu] openMember', e) // 不抛出：点击失败不许连坐看板
      }
    }

    // ---------------- 版面小件 ----------------
    function MemberCard(props) {
      var m = props.member || {}
      var clickable = canJump(props)
      var attrs = {
        className: 'sl-member' + (clickable ? ' sl-clickable' : ''),
        title: clickable ? (m.id || '') : jumpHint(props),
      }
      if (clickable) {
        attrs.onClick = function () { openMember(props, m) }
      }
      return h('div', attrs,
        h('div', { className: 'sl-title' }, officeText(props.office)),
        h('div', null,
          h('span', { className: 'sl-name' }, m.name || '无名'),
          m.name === 'lead' ? h('span', { className: 'sl-duty' }, '（尚书令）') : null,
          props.running ? h('span', { className: 'sl-run' }, '在办') : null
        )
      )
    }

    function Bucket(props) {
      var items = props.items || []
      return h('div', { className: props.boxClass, 'data-bureau': props.bureau || '' },
        h('div', { className: props.headClass },
          BUREAU_NAME[props.bureau] || props.bureau || '旁支',
          props.duty ? h('span', { className: 'sl-duty' }, '（' + props.duty + '）') : null,
          h('span', { className: 'sl-duty' }, ' · ' + (items.length ? items.length + ' 人' : '无人'))
        ),
        items.length
          ? items.map(function (it) {
              return h(MemberCard, {
                key: it.member.id || it.member.name, member: it.member, office: it.office, running: it.running,
                sessions: props.sessions, getUiWorkspace: props.getUiWorkspace, sessionId: props.sessionId,
              })
            })
          : h('div', { className: 'sl-empty' }, props.emptyText)
      )
    }

    function TaskCard(props) {
      var t = props.task || {}
      var [expanded, setExpanded] = useState(false) // 零副作用：只在点击时切，不量高度
      var desc = t.description || ''
      var blocked = t.status === 'pending' && !t.ready
      var office = t.ownerName ? officeText(officeOf({ name: t.ownerName })) : ''
      var ownerText = !t.ownerName ? '未指派' : (office === '未授官' ? t.ownerName : office)
      return h('div', { className: 'sl-task' + (blocked ? ' sl-blocked' : ''), title: t.id || '' },
        h('div', { className: 'sl-task-sub' }, t.subject || '(无标题)'),
        desc ? h('div', { className: 'sl-desc' + (expanded ? ' sl-desc-open' : '') }, desc) : null,
        desc
          ? h('button', {
              className: 'sl-more',
              type: 'button',
              onClick: function () { setExpanded(function (v) { return !v }) },
            }, expanded ? '收起' : '展开')
          : null,
        h('div', { className: 'sl-task-own' },
          ownerText,
          t.ownerName && office !== '未授官' ? h('span', { className: 'sl-target' }, ' ' + t.ownerName) : null,
          blocked ? h('span', { className: 'sl-flag' }, '被阻塞') : null
        )
      )
    }

    function TaskColumn(props) {
      var items = props.items || []
      var items2 = items.length
        ? items.map(function (t) { return h(TaskCard, { key: t.id || t.subject, task: t }) })
        : h('div', { className: 'sl-empty' }, '无事')
      var head = props.title + '（' + items.length + '）'
      // 已成列用原生 details，默认折叠：开合状态在 DOM 里，不押「组件不重挂载」
      if (props.collapsible) {
        return h('details', { className: 'sl-col sl-details', 'data-status': props.status },
          h('summary', { className: 'sl-col-hd' }, head),
          items2
        )
      }
      return h('div', { className: 'sl-col', 'data-status': props.status },
        h('div', { className: 'sl-col-hd' }, head),
        items2
      )
    }

    // ---------------- 看板主体 ----------------
    // ---------------- 圣旨：首次有数据展一次，事数变多再展一次，也可手动重播 ----------------
    function Edict(props) {
      var [phase, setPhase] = useState('in')
      useEffect(function () {
        var t = setTimeout(function () { setPhase('out') }, 2200)
        return function () { clearTimeout(t) }
      }, [])
      var line2 = props.pending > 0
        ? ('×' + props.pending + ' 事待办 · 着三省六部拟诏')
        : '诸事已毕 · 各归其曹'
      return h('div', { className: 'sl-edict' + (phase === 'out' ? ' sl-edict-out' : '') },
        h('div', { className: 'sl-edict-rod', style: { left: '-6px' } }),
        h('div', { className: 'sl-edict-scroll' },
          h('div', { className: 'sl-edict-line1' }, '奉 天 承 运'),
          h('div', { className: 'sl-edict-line2' }, line2, h('span', { className: 'sl-edict-seal' }, '敕'))
        ),
        h('div', { className: 'sl-edict-rod', style: { right: '-6px' } })
      )
    }

    // 看板渲染体的错误边界：任何一帧抛错只塌掉这一块，不连坐整个会话页（发布审计 P0-5）
    class BoardBoundary extends Component {
      constructor(props) {
        super(props)
        this.state = { error: null }
      }

      static getDerivedStateFromError(error) {
        return { error: error }
      }

      componentDidCatch(error, info) {
        try {
          console.error('[sansheng-liubu] board crashed', error, info && info.componentStack)
        } catch (e) {}
      }

      render() {
        if (!this.state.error) return this.props.children
        var msg = String((this.state.error && this.state.error.message) || this.state.error || '')
        if (msg.length > 500) msg = msg.slice(0, 500) + '…'
        var keys = Object.keys(this.props.teamKeys || {}).join(',') || '（无）'
        return h('div', { className: 'sl-board' },
          h('div', { className: 'sl-empty' }, '团队数据异常'),
          h('details', { className: 'sl-details' },
            h('summary', { className: 'sl-more' }, '详情'),
            h('div', { className: 'sl-extra' }, 'error: ' + msg),
            h('div', { className: 'sl-extra' }, 'team keys: ' + keys)
          )
        )
      }
    }

    function Board(props) {
      var lead = leadSessionId(props)
      var fromStore = useTeamFor(props, lead) // 先订阅会话投影表（hooks 顺序固定）
      var selfTeam = useTeam(props)           // 照旧无条件调用：自己就是 Lead 时才用它兜底
      var rowsSub = useSessionRows(props && props.sessions) // 也照旧订阅：中栏没有 seat hook 时的取数源
      var rows = (props && props.rows) || rowsSub               // 外层（BoardView）已订阅时直接用它的快照
      var reqRef = useRef({})
      useEffect(function () { ensureProjection(props, lead, fromStore, reqRef) }, [lead, fromStore])
      var isSelf = !!(props && props.sessionId && lead === props.sessionId)
      // 取数优先级（判词 §3 回退锁不变）：投影表 → 会话列表快照 → 自己就是 Lead 才读自己的本子
      var team = fromStore || teamFromRows(rows, lead) || (isSelf ? selfTeam : null)
      var byId = (rows && rows.byId) || {}
      var members = (team && team.members) || []
      var tasks = (team && team.tasks) || []

      // 分组与分列只依赖 team/lead：useMemo 记住，不在渲染里重建大数组（判词 §4/§5）
      var grouped = useMemo(function () {
        var byBureau = {}
        var list = (team && team.members) || []
        for (var i = 0; i < list.length; i++) {
          var m = list[i] || {}
          var office = officeOf(m)
          var key = office.bureau || 'none'
          if (!byBureau[key]) byBureau[key] = []
          byBureau[key].push({ member: m, office: office })
        }
        var byStatus = {}
        var all = (team && team.tasks) || []
        for (var j = 0; j < all.length; j++) {
          var t = all[j]
          if (!t) continue
          if (!byStatus[t.status]) byStatus[t.status] = []
          byStatus[t.status].push(t)
        }
        return { byBureau: byBureau, byStatus: byStatus }
      }, [team, lead])

      // 圣旨触发：首次进入有数据展一次；之后只在「事数变多」时再展（挂载点的 key 用 Date.now 逼重播）
      var taskN = tasks.length
      var prevN = useRef(null)
      var edictT = useRef(null)
      var [edict, setEdict] = useState(null)

      function showEdict(pending) {
        if (edictT.current) clearTimeout(edictT.current)
        setEdict({ n: taskN, key: Date.now(), pending: pending || 0 })
        // 计时清理由 Board 负责（2700ms > 收起动画 2200+420）：Edict 只管 2200ms 切 'out'
        edictT.current = setTimeout(function () { setEdict(null) }, 2700)
      }

      useEffect(function () {
        var prev = prevN.current
        prevN.current = taskN
        if (prev === null) {
          if (taskN > 0) showEdict(grouped.byStatus.pending ? grouped.byStatus.pending.length : 0)
        } else if (taskN > prev) {
          showEdict(0)
        }
      }, [taskN])

      useEffect(function () {
        return function () { if (edictT.current) clearTimeout(edictT.current) }
      }, [])

      if (!team) {
        if (isSelf) {
          return h('div', { className: 'sl-board' },
            h('div', { className: 'sl-empty' }, '此会话无团队数据（看板仅在 Lead 会话可见）')
          )
        }
        // 中栏是 root 级插槽：既没有 useSessions/useProjection，快照里也没投影表 → 明说取不到，给一条去会话页的路
        var hasSeat = !!(props && (typeof props.useSessions === 'function' || typeof props.useProjection === 'function'))
        if (!hasSeat) {
          return h('div', { className: 'sl-board' },
            h('div', { className: 'sl-empty' }, '此页面取不到团队投影（root 级插槽不注入 hook）'),
            h('button', { className: 'sl-open-btn', onClick: function () { openSessionOf(props) } }, '去会话页查看')
          )
        }
        return h('div', { className: 'sl-board' },
          h('div', { className: 'sl-empty', title: '父会话：' + lead }, '加载中（父会话投影未就绪）')
        )
      }

      if (!members.length) {
        return h('div', { className: 'sl-board' },
          h('div', { className: 'sl-empty' }, '此会话无团队数据（看板仅在 Lead 会话可见）')
        )
      }

      function running(id) {
        return !!(id && byId[id] && byId[id].running)
      }

      // 归组结果来自 grouped；运行态（byId）每帧现算，只做几次查表
      var buckets = grouped.byBureau

      function withRunning(list) {
        if (!list.length) return list
        return list.map(function (it) { return { member: it.member, office: it.office, running: running(it.member.id) } })
      }

      var provinces = PROVINCES.map(function (b) {
        return h(Bucket, {
          key: b, bureau: b, duty: BUREAU_DUTY[b], boxClass: 'sl-prov', headClass: 'sl-prov-hd',
          emptyText: '虚位', items: withRunning(buckets[b] || []),
          sessions: props.sessions, getUiWorkspace: props.getUiWorkspace, sessionId: props.sessionId,
        })
      })

      var ministries = MINISTRIES.map(function (b) {
        return h(Bucket, {
          key: b, bureau: b, duty: '', boxClass: 'sl-mou', headClass: 'sl-mou-hd',
          emptyText: '无人', items: withRunning(buckets[b] || []),
          sessions: props.sessions, getUiWorkspace: props.getUiWorkspace, sessionId: props.sessionId,
        })
      })

      var orphans = buckets.none || []

      var cols = [
        { status: 'pending', title: '待办' },
        { status: 'in_progress', title: '在办' },
        { status: 'completed', title: '已成' },
      ].map(function (c) {
        return h(TaskColumn, {
          key: c.status, status: c.status, title: c.title, collapsible: c.status === 'completed',
          items: grouped.byStatus[c.status] || [],
        })
      })

      // 调试串只在 window.__SANSHENG_DEBUG__ 为真时挂（发布审计 P0-3）
      var debug = !!(typeof window !== 'undefined' && window.__SANSHENG_DEBUG__)
      return h(BoardBoundary, { teamKeys: team },
        h('div', { className: 'sl-board' },
        edict ? h(Edict, { key: edict.key, pending: edict.pending }) : null,
        h('div', { className: 'sl-hd', title: debug ? ('props keys: ' + Object.keys(props || {}).join(',') + ' | sessionId=' + String(props && props.sessionId || '')) : void 0 },
          '三省六部 · ' + members.length + ' 官 · ' + tasks.length + ' 事',
          debug ? h('span', { className: 'sl-duty' },
            ' · ws:' + (props && props.getUiWorkspace && props.getUiWorkspace() ? '有' : '无') +
            ' · sid:' + (props && props.sessionId ? '有' : '无')) : null,
          h('button', {
            className: 'sl-edict-btn',
            onClick: function () { showEdict(grouped.byStatus.pending ? grouped.byStatus.pending.length : 0) },
          }, '圣旨')
        ),
        h('div', { className: 'sl-prov-row' }, provinces),
        h('div', { className: 'sl-grid' }, ministries),
        orphans.length
          ? h('div', { className: 'sl-extra' },
              '未授官：' + orphans.map(function (it) { return (it.member && it.member.name) || '无名' }).join('、')
            )
          : null,
        h('div', { className: 'sl-tasks' }, cols)
        )
      )
    }

    // 中栏整页（keyed 'main'）是 root 级插槽、宿主不给 sessionId：
    // 改为用会话列表自选（默认第一个 + 下拉切换），不猜宿主隐藏字段。
    function BoardView(props) {
      var sessions = props && props.sessions
      var getWs = props && props.getUiWorkspace
      var rows = useSessionRows(sessions)
      var ids = sessionIds(rows)
      var [pick, setPick] = useState(null)
      var sid = props && props.sessionId ? props.sessionId : (pick && ids.indexOf(pick) >= 0 ? pick : (ids[0] || null))
      if (!sid) {
        return h('div', { className: 'sl-board' },
          h('div', { className: 'sl-empty' }, '暂无会话可展示：先开一个会话，再回来看')
        )
      }
      // 只传这三个键：展开整个 props 会把 useSessions 等未知键塞进 Board，扰 hooks。
      return h('div', { className: 'sl-board' },
        h('div', { className: 'sl-pick' }, '会话：',
          h('select', {
            className: 'sl-pick-sel',
            value: sid,
            onChange: function (e) { setPick(e.target.value) },
          }, ids.map(function (id) {
            return h('option', { key: id, value: id }, sessionLabel(rows, id))
          }))
        ),
        h(Board, { sessions: sessions, getUiWorkspace: getWs, sessionId: sid, rows: rows })
      )
    }

    // ---------------- 注册会话页标签页 ----------------
    function apply(ctx) {
      try {
        // 判 §若准 1：uiWorkspace 惰性取 + 三路兜底，不进静态 inject（服务不到时整页 pending 是红线）
        ctx.effect(function () {
          resolveUiWorkspace(ctx)
          return ctx.slots.inject('conversation.view', function () {
            return ctx.slots.register(
              {
                name: 'conversation.view',
                id: 'sansheng-liubu',
                order: 40,
                label: function () { return '三省六部' },
                inject: function () {
                  // 只给服务，不给 sessionId：插槽 props 里本就有 sessionId，
                  // 若在此返回 undefined 会盖掉它，导致成员卡全部禁用。
                  // 传的是**取值函数**而不是值：uiWorkspace 可能晚到（ctx.inject 异步生效），
                  // 渲染/点击时再取才不会锁死成 null。
                  return {
                    sessions: ctx.sessions,
                    getUiWorkspace: function () { return resolveUiWorkspace(ctx) },
                  }
                },
              },
              function (props) { return h(Board, props) }
            )
          })
        }, 'sansheng-liubu: tab')

        // 左栏导航一行（sidebar.panellist 是 list 插槽，条目认 options.id；图标自己画）
        ctx.effect(function () {
          return ctx.slots.inject('sidebar.panellist', function () {
            return ctx.slots.register(
              {
                name: 'sidebar.panellist',
                id: 'sansheng',
                order: 30,
                label: function () { return '三省六部' },
              },
              function (p) {
                var size = (p && p.size) || 18
                // 图标位留白不写字（陛下要求把「臣」字拿掉），保留占位宽度，免得这行文字比别行左移
                return h('span', { style: { display: 'inline-block', width: size, height: size }, title: '三省六部' })
              }
            )
          })
        }, 'sansheng-liubu: sidebar entry')

        // 中栏整页（main 是 keyed 插槽）：layout 只认 options.key（ui-layout :697/:699），
        // 故 key 必写；id 一并写上做兜底（多一个未知属性不会被当 key 用）。
        ctx.effect(function () {
          return ctx.slots.inject('main', function () {
            return ctx.slots.register(
              {
                name: 'main',
                key: 'sansheng',
                id: 'sansheng',
                order: 30,
                inject: function () {
                  // main 是 root 级插槽，宿主不传 sessionId（ui-layout:127 renderSlot("main", {})）；
                  // 当前会话 id 的公开读法没核到，这里不猜字段，交给 BoardView 出提示行。
                  return {
                    sessions: ctx.sessions,
                    getUiWorkspace: function () { return resolveUiWorkspace(ctx) },
                  }
                },
              },
              BoardView
            )
          })
        }, 'sansheng-liubu: main panel')
      } catch (e) {
        console.error('[sansheng-liubu]', e)
      }
    }

    // 静态 inject 必须含 'uiWorkspace'：浏览器半的 exports.inject 是 cordis fiber inject，
    // 管 apply 时序（服务就绪才 apply）；dsh.client.inject 只管加载顺序，两码事。
    module.exports = { name: 'dsh-sansheng-liubu', inject: ['slots', 'sessions', 'uiWorkspace'], apply: apply }
    return module.exports
  },
})
