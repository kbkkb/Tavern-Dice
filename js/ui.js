/* ===== UI 层：页面渲染 + 对局控制器 ===== */
const UI = (() => {
  const $app = () => document.getElementById('app');
  const icons = () => { if (window.lucide) lucide.createIcons(); };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function esc(s) { return String(s).replace(/[&<>"]/g, function(c) { return ESCAPE_MAP[c]; }); }
  const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

  /* ---------- 基础组件 ---------- */
  function toast(msg) {
    const root = document.getElementById('toast-root');
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 2200);
  }
  function modal(html, dark) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="modal-mask"><div class="modal-box ${dark ? 'panel-dark' : 'panel'}"><div class="modal-scroll">${html}</div></div></div>`;
    root.querySelector('.modal-mask').addEventListener('click', e => { if (e.target.classList.contains('modal-mask')) closeModal(); });
    icons();
    return closeModal;
  }
  function closeModal() { document.getElementById('modal-root').innerHTML = ''; }

  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  function dieHTML(value, cls = '', type = 'standard') {
    const d = DATA.DICE[type];
    const style = d && d.color ? ` style="--die-bg:${d.color.bg};--die-pip:${d.color.pip}"` : '';
    let pips = '';
    for (let i = 0; i < 9; i++) pips += PIPS[value] && PIPS[value].includes(i) ? '<span class="pip"></span>' : '<span></span>';
    return `<div class="die ${cls}" data-v="${value}"${style}>${pips}</div>`;
  }
  function probHTML(type) {
    const w = DATA.DICE[type].weights, t = w.reduce((a, b) => a + b, 0);
    return `<div class="prob-bars">` + w.map((x, i) => {
      const p = Math.round(x / t * 100);
      return `<i style="height:${Math.max(8, p * 0.28)}px"><em>${i + 1}</em></i>`;
    }).join('') + `</div>`;
  }
  function probText(type) {
    const w = DATA.DICE[type].weights, t = w.reduce((a, b) => a + b, 0);
    return w.map((x, i) => `${i + 1}点 ${Math.round(x / t * 100)}%`).join(' · ');
  }
  function currencyBar() {
    const s = Save.data;
    return `<div class="currency-bar">
      <span class="currency"><i data-lucide="coins"></i>${s.coins}</span>
      <span class="currency gem"><i data-lucide="gem"></i>${s.gems}</span>
    </div>`;
  }
  function pageHead(title, back = 'home') {
    return `<div class="page-head">
      <button class="back" onclick="UI.go('${back}')"><i data-lucide="arrow-left"></i></button>
      <h2>${title}</h2>
      <div style="flex:1"></div>${currencyBar()}
    </div>`;
  }
  function chargeDots(left, total) {
    let h = '<span class="charge-dots">';
    for (let i = 0; i < total; i++) h += `<i class="${i < left ? '' : 'off'}"></i>`;
    return h + '</span>';
  }
  function banner(text, kind) {
    const b = document.createElement('div');
    b.className = `float-banner ${kind}`;
    b.innerHTML = `<span>${text}</span>`;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 1600);
  }

  /* ---------- 路由 ---------- */
  const SCREENS = {};
  function go(name, params) {
    closeModal();
    $app().classList.add('scrollable');
    SCREENS[name](params);
    icons();
    window.scrollTo(0, 0);
  }

  /* ---------- 主菜单 ---------- */
  SCREENS.home = () => {
    $app().innerHTML = `
    <div class="home">
      <div class="home-cur">${currencyBar()}</div>
      <div class="home-title">
        <h1>酒馆骰局</h1>
        <p>TAVERN&nbsp;DICE</p>
      </div>
      <div class="home-modes">
        <div class="mode-card" onclick="UI.startRandom()">
          <div class="mi"><i data-lucide="swords"></i></div>
          <div><h3>随机挑战</h3><p>与神秘对手一掷高下，赢取软币与徽章</p></div>
        </div>
        <div class="mode-card" onclick="UI.go('map')">
          <div class="mi"><i data-lucide="map"></i></div>
          <div><h3>关卡挑战</h3><p>四章四十关，从烛火酒馆打到王城地下</p></div>
        </div>
        <div class="mode-card" onclick="UI.go('localSetup')">
          <div class="mi"><i data-lucide="users"></i></div>
          <div><h3>本地对战</h3><p>同一台手机，朋友间的公平赌局</p></div>
        </div>
      </div>
      <div class="home-foot">
        <button onclick="UI.go('shop')"><i data-lucide="shopping-bag"></i>商店</button>
        <button onclick="UI.go('achievements')"><i data-lucide="trophy"></i>成就</button>
        <button onclick="UI.go('rules')"><i data-lucide="book-open"></i>规则</button>
      </div>
    </div>`;
  };

  /* ---------- 规则页 ---------- */
  SCREENS.rules = (p) => {
    const rows = DATA.SCORE_TABLE.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
    $app().innerHTML = `
    ${pageHead('规则说明')}
    <div class="rules">
      <div class="panel">
        <h3><i data-lucide="scroll-text"></i>计分表</h3>
        <table class="score-table">${rows}</table>
        <p style="font-size:.72rem;margin-top:8px;opacity:.75">简化计分：只有多同（三同及以上）、顺子和单龬 1 / 5 计分，两颗同数不成组合。</p>
      </div>
      <div class="panel">
        <h3><i data-lucide="repeat"></i>回合流程</h3>
        <div class="flow-steps">
          <div class="fs"><div class="fi"><i data-lucide="dices"></i></div>掷骰</div><span class="arr">→</span>
          <div class="fs"><div class="fi"><i data-lucide="hand"></i></div>扣下组合</div><span class="arr">→</span>
          <div class="fs"><div class="fi"><i data-lucide="rotate-cw"></i></div>继续掷 / 存分</div><span class="arr">→</span>
          <div class="fs"><div class="fi"><i data-lucide="alert-triangle"></i></div>无组合则爆掉</div>
        </div>
        <p style="font-size:.78rem;margin-top:12px;line-height:1.7;opacity:.85">
          每次掷骰后必须至少扣下一颗计分骰子；六颗全部扣下触发 Hot Dice，保留暂存分并重掷六颗。
          无组合可扣即爆掉，本回合暂存分清零。先到目标分或定轮比高分者胜。
        </p>
      </div>
      <div class="panel">
        <h3><i data-lucide="shield"></i>徽章与骰子</h3>
        <p style="font-size:.8rem;line-height:1.8;opacity:.85">
          特殊骰子只改变六面概率，不改变任何规则。徽章每局限用数次，没用完的充能会保留到下一局。
          对局获胜有概率掉落徽章，也可在商店购买。
        </p>
      </div>
      ${p && p.first ? `<button class="btn btn-gold btn-big" style="margin-top:18px" onclick="UI.firstDone()">开始游戏</button>` : ''}
    </div>`;
  };

  /* ---------- 准备页（单模板：单人/关卡/多人复用） ---------- */
  let PREP = null;
  function startPrep(cfg) {
    PREP = cfg;
    SCREENS.prep();
    icons();
  }
  SCREENS.prep = () => {
    const c = PREP;
    const me = c.players[c.editing];
    const foe = c.players[1 - c.editing];
    const foeEditable = c.localEdit;
    const sideHTML = (pl, side, editable, title) => {
      const b = pl.badgeId ? DATA.BADGES[pl.badgeId] : null;
      const summary = {};
      pl.dice.forEach(d => summary[d] = (summary[d] || 0) + 1);
      const summaryText = Object.entries(summary).map(([k, n]) => `${DATA.DICE[k].name}×${n}`).join('、');
      return `
      <div class="prep-side ${editable ? '' : 'readonly'}">
        <h3><i data-lucide="${pl.isAI ? 'bot' : 'user'}"></i>${title}${pl.pers ? ` <span class="chip" style="margin-left:auto">${DATA.PERSONALITIES[pl.pers].name}</span>` : ''}</h3>
        <div class="dice-slots">
          ${pl.dice.map((d, i) => `<div class="dslot filled" ${editable ? `onclick="UI.prepPickDice(${side},${i})"` : ''}>${dieHTML(6, '', d)}</div>`).join('')}
        </div>
        <p style="font-size:.68rem;color:var(--ink-dim);margin-top:6px">${summaryText}</p>
        <div class="prep-badge">
          <div class="badge-slot" ${editable ? `onclick="UI.prepPickBadge(${side})"` : ''}>
            <div class="bi"><i data-lucide="${b ? b.icon : 'shield-off'}"></i></div>
            <div style="flex:1">
              <div class="bname">${b ? b.name : '不携带徽章'}</div>
              <div class="bdesc">${b ? b.desc : (editable ? '点击选择徽章' : '')}</div>
            </div>
            ${b ? chargeDots(b.charges, b.charges) : ''}
          </div>
        </div>
      </div>`;
    };
    $app().innerHTML = `
    ${pageHead(c.title, c.back || 'home')}
    <div class="prep">
      ${c.feeLabel ? `<div class="opt-row" style="margin:0"><span class="chip" style="padding:.5em 1.1em"><i data-lucide="coins"></i>${c.feeLabel}</span></div>` : ''}
      ${(typeof c.optionsHTML === 'function' ? c.optionsHTML() : c.optionsHTML) || ''}
      <div class="prep-cols">
        ${sideHTML(me, c.editing, true, c.localEdit ? '玩家 1 配置' : '我的配置')}
        ${sideHTML(foe, 1 - c.editing, foeEditable, c.localEdit ? '玩家 2 配置' : '对手配置（不可编辑）')}
      </div>
      <div class="prep-actions">
        <button class="btn btn-gold btn-big" onclick="UI.prepStart()"><i data-lucide="swords"></i>${c.kind === 'boss' ? '支付入场 · 挑战霸主' : (c.kind === 'ranked' ? '支付入场 · 开始积分战' : '开始对战')}</button>
      </div>
    </div>`;
  };

  function dicePickerItem(type, disabled, cur, onclick) {
    const d = DATA.DICE[type];
    return `<div class="picker-item ${disabled ? 'disabled' : ''} ${cur ? 'cur' : ''}" ${disabled ? '' : `onclick="${onclick}"`}>
      ${dieHTML(6, 'sm', type)}
      <div class="nm"><b>${d.name}</b><p>${probText(type)}</p></div>
      ${probHTML(type)}
    </div>`;
  }

  /* ---------- 排位竞赛（四区域） ---------- */
  SCREENS.map = () => {
    const s = Save.data;
    const medals = (s.ranked && s.ranked.medals) || [];
    let html = pageHead('排位竞赛') + `
    <div style="padding:0 16px;font-size:.75rem;color:var(--ink-dim);line-height:1.7">
      支付入场费进行积分战：胜 +积分 / 负 -积分。积分达标后可挑战区域霸主（三局两胜），夺冠获得勋章与皮肤。
      ${medals.length ? `已获勋章：${medals.map(id => DATA.REGIONS.find(r => r.id === id).medal).join('、')}` : '尚未获得任何勋章。'}
    </div>
    <div class="rank-grid">`;
    DATA.REGIONS.forEach((reg, i) => {
      const unlocked = i === 0 || medals.includes(DATA.REGIONS[i - 1].id);
      const pts = (s.ranked && s.ranked.pts[reg.id]) || 0;
      const hasMedal = medals.includes(reg.id);
      const bossReady = pts >= reg.ptsToBoss && !hasMedal;
      html += `
      <div class="rank-card ${unlocked ? '' : 'locked'}">
        <div class="rk-head">
          <span class="rk-name">${reg.name}</span>
          ${hasMedal ? `<span class="chip"><i data-lucide="medal"></i>${reg.medal}</span>` : `<span class="chip">${pts}/${reg.ptsToBoss} 分</span>`}
        </div>
        <p class="rk-desc">${reg.desc}</p>
        <div class="rk-pts">积分进度</div>
        <div class="ach-bar"><i style="width:${Math.min(100, pts / reg.ptsToBoss * 100)}%"></i></div>
        <div class="rk-info">
          <span>入场 ${reg.fee} · 胜 +${reg.winCoins} 软币</span>
          <span>胜 +${reg.winPts} 分 / 负 -${reg.losePts} 分 · 目标 ${reg.target}</span>
          <span>霸主：${reg.bossName}（${DATA.PERSONALITIES[reg.bossPers].name}）</span>
        </div>
        ${!unlocked
          ? `<button class="btn btn-ghost" disabled><i data-lucide="lock"></i>先夺得「${DATA.REGIONS[i - 1].medal}」</button>`
          : bossReady
            ? `<button class="btn btn-gold" onclick="Main.startBossChallenge('${reg.id}')"><i data-lucide="crown"></i>挑战霸主（${reg.bossFee}）</button>`
            : hasMedal
              ? `<button class="btn btn-ghost" onclick="Main.startRankedBattle('${reg.id}')"><i data-lucide="swords"></i>继续积分战</button>
                 <p class="rk-done">勋章已入手，积分重置，可反复征战</p>`
              : `<button class="btn btn-gold" onclick="Main.startRankedBattle('${reg.id}')"><i data-lucide="swords"></i>开始积分战</button>`}
      </div>`;
    });
    $app().innerHTML = html + '</div>';
  };

  /* ---------- 商店 ---------- */
  let shopTab = 'dice';
  SCREENS.shop = () => {
    const s = Save.data;
    let cards = '';
    if (shopTab === 'dice') {
      for (const [id, d] of Object.entries(DATA.DICE)) {
        if (id === 'standard') continue;
        const owned = s.dice[id] || 0;
        cards += `<div class="goods-card">
          ${dieHTML(6, 'lg', id)}
          <div class="gname">${d.name}</div>
          <div class="gdesc">${d.desc}</div>
          ${probHTML(id)}
          ${owned ? `<div class="owned-tag">已拥有 ×${owned}</div>` : ''}
          <div class="price ${d.currency === 'gem' ? 'gem' : ''}"><i data-lucide="${d.currency === 'gem' ? 'gem' : 'coins'}"></i>${d.price}</div>
          <button class="btn btn-gold" onclick="Main.buyDice('${id}')">购买</button>
        </div>`;
      }
    } else if (shopTab === 'badge') {
      for (const [id, b] of Object.entries(DATA.BADGES)) {
        const owned = s.badges[id] || 0;
        cards += `<div class="goods-card">
          <div class="bi" style="width:52px;height:52px;border-radius:12px;background:rgba(201,162,39,.12);display:flex;align-items:center;justify-content:center;color:var(--gold)"><i data-lucide="${b.icon}" style="width:26px;height:26px"></i></div>
          <div class="gname">${b.name}</div>
          <div class="gdesc">${b.desc}</div>
          ${chargeDots(b.charges, b.charges)}
          ${owned ? `<div class="owned-tag">剩余充能 ${owned}</div>` : ''}
          <div class="price"><i data-lucide="coins"></i>${b.price}</div>
          <button class="btn btn-gold" onclick="Main.buyBadge('${id}')">购买</button>
        </div>`;
      }
    } else {
      const kindMap = { table: '台面', board: '计分板' };
      for (const [kind, list] of Object.entries(DATA.SKINS)) {
        for (const sk of list) {
          const owned = s.skins.includes(sk.id);
          const equipped = s.equipped[kind] === sk.id;
          const mainVar = kind === 'table' ? sk.vars['--felt'] : kind === 'dice' ? sk.vars['--die-bg'] : sk.vars['--board-bg'];
          cards += `<div class="goods-card">
            <div class="swatch" style="width:44px;height:44px;background:${mainVar}"></div>
            <div class="gname">${sk.name}</div>
            <div class="gdesc">${kindMap[kind]}皮肤</div>
            ${owned
              ? (equipped ? `<div class="owned-tag">已装备</div>` : `<button class="btn btn-ghost" onclick="Main.equipSkin('${kind}','${sk.id}')">装备</button>`)
              : `<div class="price ${sk.currency === 'gem' ? 'gem' : ''}"><i data-lucide="${sk.currency === 'gem' ? 'gem' : 'coins'}"></i>${sk.price}</div>
                 <button class="btn btn-gold" onclick="Main.buySkin('${kind}','${sk.id}')">购买</button>`}
            <button class="btn btn-ghost" style="font-size:.72rem;padding:.4em 1em" onclick="UI.skinPreview('${sk.id}')">预览</button>
          </div>`;
        }
      }
    }
    $app().innerHTML = `
    ${pageHead('商店')}
    <div style="display:flex;justify-content:flex-end;padding:0 16px">
      <button class="btn btn-ghost" style="font-size:.78rem;padding:.45em 1em" onclick="Main.recharge()"><i data-lucide="plus"></i>充值点券（演示）</button>
    </div>
    <div class="shop-tabs">
      <span class="chip ${shopTab === 'dice' ? 'sel' : ''}" onclick="UI.shopTab('dice')">骰子</span>
      <span class="chip ${shopTab === 'badge' ? 'sel' : ''}" onclick="UI.shopTab('badge')">徽章</span>
      <span class="chip ${shopTab === 'skin' ? 'sel' : ''}" onclick="UI.shopTab('skin')">外观</span>
    </div>
    <div class="shop-grid">${cards}</div>`;
  };

  /* ---------- 成就 ---------- */
  SCREENS.achievements = () => {
    const s = Save.data;
    const items = DATA.ACHIEVEMENTS.map(a => {
      const st = s.ach[a.id] || { claimed: false };
      const cur = Main.achProgress(a);
      const done = cur >= a.target;
      const hidden = a.hidden && !done && !st.claimed;
      return `<div class="ach-item ${done && !st.claimed ? 'claimable' : ''}">
        <div class="ai"><i data-lucide="${hidden ? 'help-circle' : a.icon}"></i></div>
        <div class="ainfo">
          <b>${hidden ? '???' : a.name}</b>
          <p>${hidden ? '隐藏成就，达成后揭晓' : a.desc}</p>
          <div class="ach-bar"><i style="width:${Math.min(100, cur / a.target * 100)}%"></i></div>
        </div>
        ${st.claimed ? '<span class="chip">已领取</span>'
          : done ? `<button class="btn btn-gold" onclick="Main.claimAch('${a.id}')">+${a.reward}</button>`
          : `<span class="chip">${Math.min(cur, a.target)}/${a.target}</span>`}
      </div>`;
    }).join('');
    $app().innerHTML = pageHead('成就') + `<div class="ach-list">${items}</div>`;
  };

  /* ---------- 本地对战规则设置 ---------- */
  let localCfg = { mode: 'race', target: 2000, rounds: 8 };
  SCREENS.localSetup = () => {
    const chips = (arr, cur, fn) => arr.map(v => `<span class="chip ${cur === v ? 'sel' : ''}" onclick="${fn}(${v})">${v}</span>`).join('');
    $app().innerHTML = `
    ${pageHead('本地对战 · 规则设置')}
    <div class="prep-cols">
      <div class="prep-side">
        <h3><i data-lucide="settings-2"></i>胜利条件</h3>
        <div class="opt-row"><span class="lbl">模式</span>
          <span class="chip ${localCfg.mode === 'race' ? 'sel' : ''}" onclick="UI.localMode('race')">冲分赛</span>
          <span class="chip ${localCfg.mode === 'rounds' ? 'sel' : ''}" onclick="UI.localMode('rounds')">定轮赛</span>
        </div>
        <div class="opt-row" id="local-opt"></div>
        <p style="font-size:.72rem;color:var(--ink-dim);text-align:center;line-height:1.7">
          本地对战为友谊赛：双方可自由选用全部骰子与徽章（含未拥有），不产生任何奖励与消耗。
        </p>
      </div>
    </div>
    <div class="prep-actions">
      <button class="btn btn-gold btn-big" onclick="UI.localGo()">下一步</button>
    </div>`;
    renderLocalOpt();
    icons();
  };
  function renderLocalOpt() {
    const el = document.getElementById('local-opt');
    if (!el) return;
    el.innerHTML = localCfg.mode === 'race'
      ? `<span class="lbl">目标分</span>` + [1000, 2000, 3000, 5000].map(v => `<span class="chip ${localCfg.target === v ? 'sel' : ''}" onclick="UI.localTarget(${v})">${v}</span>`).join('')
      : `<span class="lbl">轮数</span>` + [3, 5, 8, 10, 15].map(v => `<span class="chip ${localCfg.rounds === v ? 'sel' : ''}" onclick="UI.localRounds(${v})">${v}</span>`).join('');
    icons();
  }

  /* ---------- 对局控制器 ---------- */
  let M = null;
  function startMatch(cfg) {
    M = {
      cfg,
      cur: 0, round: 1, over: false,
      players: cfg.players.map(p => ({ ...p, total: 0, badgeUsed: 0 })),
      turn: null, busy: false,
    };
    newTurn();
    renderMatch();
    if (isAI(curPlayer())) setTimeout(aiPlay, 800);
  }
  const curPlayer = () => M.players[M.cur];
  const isAI = p => !!p.isAI;

  function newTurn() {
    const p = curPlayer();
    M.turn = {
      pending: 0,
      dice: p.dice.map(t => ({ type: t, value: 6, kept: false, extra: false })),
      phase: 'roll', selected: new Set(), might: false, doppel: false,
      fortuneMode: false, transmuteMode: false, fortunePicks: new Set(),
    };
  }
  function badgeLeft(p) {
    if (!p.badge) return 0;
    return DATA.BADGES[p.badge.id].charges - p.badgeUsed;
  }

  function renderMatch() {
    $app().classList.remove('scrollable');
    const cfg = M.cfg, t = M.turn;
    const bar = (pl, i) => `
      <div class="player-bar ${M.cur === i ? 'active' : ''}" data-p="${i}">
        <div class="avatar"><i data-lucide="${pl.isAI ? 'bot' : 'user'}"></i></div>
        <div class="info">
          <div class="name">${esc(pl.name)} ${pl.badge ? `<span class="chip" style="font-size:.62rem"><i data-lucide="${DATA.BADGES[pl.badge.id].icon}"></i>${badgeLeft(pl)}</span>` : ''}</div>
          <div class="pers">${pl.isAI ? DATA.PERSONALITIES[pl.pers].name : (i === 0 ? '（你）' : '（玩家 2）')}</div>
        </div>
        <div class="score">${pl.total}</div>
      </div>`;
    const unkept = t.dice.map((d, i) => ({ d, i })).filter(x => !x.d.kept);
    const kept = t.dice.filter(d => d.kept);
    const selVals = [...t.selected].map(i => t.dice[i].value);
    const selR = Engine.scoreSelection(selVals);
    const p = curPlayer();
    const bl = badgeLeft(p);
    const bdef = p.badge ? DATA.BADGES[p.badge.id] : null;
    const badgeUsable = p.badge && bl > 0 && !isAI(p) && (
      (p.badge.id === 'might' && t.phase === 'roll') ||
      (['fortune', 'transmutation', 'doppelganger'].includes(p.badge.id) && t.phase === 'select' && !t.fortuneMode && !t.transmuteMode)
    );

    let selInfo;
    if (t.phase === 'select') {
      if (t.fortuneMode) selInfo = `<span class="ok">命运徽章：点击至多 2 枚骰子重投（已选 ${t.fortunePicks.size}/2）</span>`;
      else if (t.transmuteMode) selInfo = `<span class="ok">嬗变徽章：点击 1 枚骰子变为 1 点</span>`;
      else if (t.selected.size === 0) selInfo = `<span class="none">点击骰子选择要扣下的计分组合（至少一颗）</span>`;
      else if (selR.valid) selInfo = `<span class="ok">已选 ${t.selected.size} 颗 = ${selR.score} 分${t.doppel ? '（分身翻倍 → ' + selR.score * 2 + '）' : ''}　${selR.steps.map(s2 => s2.name).join(' + ')}</span>`;
      else selInfo = `<span class="bad">该选择中每颗骰子都必须参与计分</span>`;
    } else selInfo = `<span class="none">${t.phase === 'roll' ? '点击「掷骰」开始本回合' : ''}</span>`;

    $app().innerHTML = `
    <div class="match">
      ${bar(M.players[0], 0)}
      ${bar(M.players[1], 1)}
      <div class="hud">
        <div class="panel"><span class="label">${cfg.mode === 'race' ? '目标分' : '轮次'}</span><span class="big">${cfg.mode === 'race' ? cfg.target : `${M.round}/${cfg.rounds}`}</span><span class="sub">${cfg.mode === 'race' ? '冲分赛' : '定轮赛'}</span></div>
        <div class="panel"><span class="label">当前暂存分</span><span class="big pending ${t.pending ? 'has' : ''}">${t.pending}</span><span class="sub">已扣 ${kept.length} 颗 · 未存入</span></div>
        <span class="chip"><i data-lucide="user-check"></i>行动方 · ${esc(p.name)}</span>
        <button class="btn btn-ghost hud-rules" onclick="UI.scoreModal()"><i data-lucide="book-open"></i>规则</button>
      </div>
      <div class="table-zone">
        <div class="kept-tray">${kept.length ? kept.map(d => dieHTML(d.value, 'sm kept', d.type)).join('') : '<span class="empty">已扣骰子区</span>'}</div>
        <div class="roll-area">
          ${unkept.map(({ d, i }) => {
            let cls = '';
            if (t.phase === 'select' && !isAI(p)) cls += ' selectable';
            if (t.selected.has(i) || t.fortunePicks.has(i)) cls += ' selected';
            return `<div onclick="UI.dieTap(${i})" style="display:contents">${dieHTML(d.value, cls, d.type)}</div>`;
          }).join('')}
        </div>
        <div class="sel-info">${selInfo}</div>
      </div>
      <div class="bottom-row">
        <div class="badge-bar">
          <div class="badge-slot ${badgeUsable ? 'usable' : ''}" ${badgeUsable ? `onclick="UI.badgeUse()"` : ''}>
            <div class="bi"><i data-lucide="${bdef ? bdef.icon : 'shield-off'}"></i></div>
            <div style="flex:1"><div class="bname">${bdef ? bdef.name : '无徽章'}</div><div class="bdesc">${bdef ? bdef.desc : ''}</div></div>
            ${bdef ? chargeDots(bl, bdef.charges) : ''}
          </div>
        </div>
        <div class="action-bar">
          ${!isAI(p) ? actionButtons(selR) : `<button class="btn btn-ghost btn-big" disabled>对手行动中…</button>`}
        </div>
      </div>
    </div>`;
    icons();
  }
  function actionButtons(selR) {
    const t = M.turn;
    if (t.phase === 'roll') return `<button class="btn btn-gold btn-big" onclick="UI.doRoll()"><i data-lucide="dices"></i>掷骰${t.might ? '（神力 +1）' : ''}</button>`;
    if (t.phase === 'select') {
      if (t.fortuneMode) return `
        <button class="btn btn-ghost" onclick="UI.fortuneCancel()">取消</button>
        <button class="btn btn-gold btn-big" ${t.fortunePicks.size ? '' : 'disabled'} onclick="UI.fortuneApply()">重投所选</button>`;
      if (t.transmuteMode) return `<button class="btn btn-ghost btn-big" onclick="UI.transmuteCancel()">取消选择</button>`;
      return `
        <button class="btn btn-ghost small" onclick="UI.selectAll()">全部选取</button>
        <button class="btn btn-gold btn-big" ${selR.valid && t.selected.size ? '' : 'disabled'} onclick="UI.keepSelection()">扣下${selR.valid && t.selected.size ? ` +${selR.score * (t.doppel ? 2 : 1)}` : ''}</button>`;
    }
    return `
      <button class="btn btn-ghost" onclick="UI.doRoll()"><i data-lucide="dices"></i>继续掷</button>
      <button class="btn btn-gold btn-big" onclick="UI.bank()"><i data-lucide="coins"></i>存分 ${t.pending}</button>`;
  }

  /* ---- 掷骰 ---- */
  function doRoll() {
    const t = M.turn, p = curPlayer();
    if (t.phase !== 'roll' && t.phase !== 'decide') return;
    if (t.might) {
      t.dice.push({ type: p.dice[0], value: 6, kept: false, extra: true });
      t.might = false;
    }
    const unkept = t.dice.filter(d => !d.kept);
    unkept.forEach(d => Engine.rerollDie(d));
    Main.stat('rolls', unkept.length);
    if (unkept.length >= 6 && unkept.every(d => d.value === unkept[0].value)) Main.stat('sixKind', 1);
    t.selected.clear();
    t.phase = 'select';
    renderMatch();
    // 掷骰动画
    document.querySelectorAll('.roll-area .die').forEach(el => el.classList.add('rolling'));
    // bust 判定（0.6s 内可能触发徽章改骰，判定时重新取最新骰面）
    setTimeout(() => {
      const now = M.turn.dice.filter(d => !d.kept).map(d => d.value);
      if (M.turn.phase === 'select' && !Engine.rollHasScore(now)) onBust();
    }, 600);
  }

  function onBust() {
    const t = M.turn, p = curPlayer();
    if (p.badge && p.badge.id === 'resurrection' && badgeLeft(p) > 0) {
      if (isAI(p)) {
        if (t.pending >= 300) { useResurrection(); return; }
      } else {
        modal(`<div style="padding:20px;text-align:center">
          <h3 style="color:var(--gold-bright);margin-bottom:8px">爆掉了！</h3>
          <p style="font-size:.85rem;margin-bottom:16px">暂存分 ${t.pending} 即将清零。使用复活徽章免费重掷一次？</p>
          <div style="display:flex;gap:10px">
            <button class="btn btn-ghost" style="flex:1" onclick="Main.bustConfirm(false)">放弃</button>
            <button class="btn btn-gold" style="flex:1" onclick="Main.bustConfirm(true)">使用徽章</button>
          </div></div>`, true);
        return;
      }
    }
    doBust();
  }
  function useResurrection() {
    const p = curPlayer();
    p.badgeUsed++;
    banner('复活徽章！', 'hot');
    const unkept = M.turn.dice.filter(d => !d.kept);
    unkept.forEach(d => Engine.rerollDie(d));
    renderMatch();
    const vals = unkept.map(d => d.value);
    if (!Engine.rollHasScore(vals)) setTimeout(() => onBust(), 600);
  }
  function doBust() {
    const t = M.turn;
    banner('爆 掉', 'bust');
    Main.stat('busts', 1);
    t.pending = 0;
    setTimeout(endTurn, 900);
  }

  /* ---- 选择与扣骰 ---- */
  function dieTap(i) {
    const t = M.turn, p = curPlayer();
    if (isAI(p) || t.phase !== 'select') return;
    const d = t.dice[i];
    if (d.kept) return;
    if (t.fortuneMode) {
      if (t.fortunePicks.has(i)) t.fortunePicks.delete(i);
      else if (t.fortunePicks.size < 2) t.fortunePicks.add(i);
      renderMatch(); return;
    }
    if (t.transmuteMode) {
      d.value = 1;
      t.transmuteMode = false;
      p.badgeUsed++;
      banner('嬗变为 1', 'hot');
      t.selected.clear();
      renderMatch();
      checkBustAfterMod();
      return;
    }
    if (t.selected.has(i)) t.selected.delete(i); else t.selected.add(i);
    renderMatch();
  }
  function checkBustAfterMod() {
    const t = M.turn;
    const vals = t.dice.filter(d => !d.kept).map(d => d.value);
    if (!Engine.rollHasScore(vals)) setTimeout(() => onBust(), 500);
  }
  function selectAll() {
    const t = M.turn;
    const unkept = t.dice.map((d, i) => ({ d, i })).filter(x => !x.d.kept);
    const vals = unkept.map(x => x.d.value);
    const best = Engine.bestSelectionIndices(vals);
    t.selected = new Set(best.indices.map(k => unkept[k].i));
    renderMatch();
  }
  function keepSelection() {
    const t = M.turn, p = curPlayer();
    const selVals = [...t.selected].map(i => t.dice[i].value);
    const r = Engine.scoreSelection(selVals);
    if (!r.valid || !t.selected.size) return;
    let sc = r.score;
    if (t.doppel) { sc *= 2; t.doppel = false; }
    t.pending += sc;
    r.steps.forEach(s2 => { if (s2.name.includes('顺子')) Main.stat('straights', 1); });
    t.selected.forEach(i => t.dice[i].kept = true);
    t.selected.clear();
    t.phase = 'decide';
    if (t.dice.every(d => d.kept)) {
      banner('HOT DICE', 'hot');
      Main.stat('hot', 1);
      t.dice = p.dice.map(ty => ({ type: ty, value: 6, kept: false, extra: false }));
    }
    renderMatch();
  }

  /* ---- 存分与回合结束 ---- */
  function bank() {
    const t = M.turn, p = curPlayer();
    p.total += t.pending;
    Main.stat('bestBank', t.pending, true);
    banner(`+${t.pending}`, 'hot');
    setTimeout(endTurn, 500);
  }
  function endTurn() {
    const cfg = M.cfg, p = curPlayer();
    if (cfg.mode === 'race' && p.total >= cfg.target) return matchEnd(M.cur);
    if (M.cur === M.players.length - 1) {
      if (cfg.mode === 'rounds' && M.round >= cfg.rounds) {
        const w = M.players[0].total === M.players[1].total ? -1 : (M.players[0].total > M.players[1].total ? 0 : 1);
        return matchEnd(w);
      }
      M.round++;
    }
    M.cur = (M.cur + 1) % M.players.length;
    newTurn();
    banner(`轮到 ${curPlayer().name}`, 'hot');
    renderMatch();
    if (isAI(curPlayer())) setTimeout(aiPlay, 900);
  }
  function matchEnd(winner) {
    M.over = true;
    M.cfg.onEnd({ winner, totals: M.players.map(p => p.total), players: M.players });
  }

  /* ---- 徽章使用 ---- */
  function badgeUse() {
    const t = M.turn, p = curPlayer();
    if (!p.badge || badgeLeft(p) <= 0) return;
    const id = p.badge.id;
    if (id === 'might' && t.phase === 'roll') {
      p.badgeUsed++; t.might = true;
      banner('神力徽章', 'hot');
      renderMatch();
    } else if (id === 'fortune' && t.phase === 'select') {
      t.fortuneMode = true; t.fortunePicks.clear();
      renderMatch();
    } else if (id === 'transmutation' && t.phase === 'select') {
      t.transmuteMode = true;
      renderMatch();
    } else if (id === 'doppelganger' && t.phase === 'select') {
      p.badgeUsed++; t.doppel = true;
      banner('分身徽章', 'hot');
      renderMatch();
    }
  }
  function fortuneApply() {
    const t = M.turn, p = curPlayer();
    if (!t.fortunePicks.size) return;
    p.badgeUsed++;
    t.fortunePicks.forEach(i => Engine.rerollDie(t.dice[i]));
    t.fortunePicks.clear(); t.fortuneMode = false; t.selected.clear();
    banner('命运重投', 'hot');
    renderMatch();
    checkBustAfterMod();
  }

  /* ---- AI 回合 ---- */
  async function aiPlay() {
    const p = curPlayer();
    while (!M.over && isAI(curPlayer())) {
      await sleep(800);
      const t = M.turn;
      // 神力徽章
      if (p.badge && p.badge.id === 'might' && badgeLeft(p) > 0 && t.pending >= 400 && Math.random() < 0.6) {
        p.badgeUsed++; t.might = true; banner('对手使用神力徽章', 'bust');
      }
      doRoll();
      await sleep(1000);
      if (M.over || M.turn.phase !== 'select') return; // bust 流程已接管
      // 命运徽章：得分太差时重投
      let unkept = t.dice.filter(d => !d.kept);
      let vals = unkept.map(d => d.value);
      let pick = Engine.aiPick(vals);
      if (p.badge && p.badge.id === 'fortune' && badgeLeft(p) > 0 && pick.score < 100) {
        p.badgeUsed++; banner('对手使用命运徽章', 'bust');
        unkept.slice(0, 2).forEach(d => Engine.rerollDie(d));
        renderMatch(); await sleep(800);
        unkept = t.dice.filter(d => !d.kept); vals = unkept.map(d => d.value);
        if (!Engine.rollHasScore(vals)) { onBust(); return; }
        pick = Engine.aiPick(vals);
      }
      // 嬗变徽章
      if (p.badge && p.badge.id === 'transmutation' && badgeLeft(p) > 0 && pick.score < 150 && !vals.includes(1)) {
        p.badgeUsed++; banner('对手使用嬗变徽章', 'bust');
        unkept[unkept.length - 1].value = 1;
        renderMatch(); await sleep(700);
        vals = unkept.map(d => d.value);
        pick = Engine.aiPick(vals);
      }
      // 分身徽章
      let gain = pick.score;
      if (p.badge && p.badge.id === 'doppelganger' && badgeLeft(p) > 0 && pick.score >= 500) {
        p.badgeUsed++; gain *= 2; banner('对手使用分身徽章', 'bust');
      }
      // 扣骰
      const unkeptIdx = t.dice.map((d, i) => ({ d, i })).filter(x => !x.d.kept);
      pick.indices.forEach(k => t.dice[unkeptIdx[k].i].kept = true);
      t.pending += gain;
      renderMatch();
      await sleep(900);
      if (t.dice.every(d => d.kept)) {
        banner('HOT DICE', 'hot'); Main.stat('hot', 1);
        t.dice = p.dice.map(ty => ({ type: ty, value: 6, kept: false, extra: false }));
        renderMatch(); await sleep(700);
      }
      if (Engine.aiShouldBank(t.pending, t.dice.filter(d => !d.kept).length, p.total, p.pers, M.cfg)) {
        bank();
        return;
      }
      t.phase = 'roll';
      renderMatch();
    }
  }

  /* ---------- 系列赛局间页（Boss 三局两胜） ---------- */
  SCREENS.interstitial = (p) => {
    const s = p.series;
    const reg = DATA.REGIONS.find(x => x.id === s.regionId);
    const score = (i) => [0, 1].map(n => n === i ? 'win' : '').join(' ');
    $app().innerHTML = `
    <div class="interstitial">
      <div class="ifi"><i data-lucide="crown"></i></div>
      <h2>霸主战 · 第 ${s.game + 1} 局</h2>
      <div class="series-score">
        <div class="ss-side ${s.wins[0] > s.wins[1] ? 'lead' : ''}">
          <b>我</b><span class="ss-n">${s.wins[0]}</span>
        </div>
        <span class="ss-x">:</span>
        <div class="ss-side ${s.wins[1] > s.wins[0] ? 'lead' : ''}">
          <b>${esc(reg.bossName.split('·')[1] || reg.bossName)}</b><span class="ss-n">${s.wins[1]}</span>
        </div>
      </div>
      <p class="ss-note">三局两胜 · 夺取「${reg.medal}」勋章</p>
      <button class="btn btn-gold btn-big" style="max-width:300px" onclick="Main.seriesNext()">继续下一局</button>
    </div>`;
  };

  /* ---------- 局内计分规则速查 ---------- */
  function scoreModal() {
    const rows = DATA.SCORE_TABLE.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
    modal(`<div style="padding:16px">
      <h3 style="color:var(--gold-bright);letter-spacing:.15em;margin-bottom:10px"><i data-lucide="book-open"></i> 计分规则</h3>
      <table class="score-table">${rows}</table>
      <p style="font-size:.72rem;margin-top:12px;line-height:1.7;opacity:.8">
        每次掷骰后必须至少扣下一颗计分骰子；六颗全部扣下触发 Hot Dice（保留暂存分、重掷六颗）；无组合可扣即爆掉清零。简化计分：只有多同（三同及以上）、顺子和单龬 1 / 5 计分。
      </p>
      <button class="btn btn-gold btn-big" style="margin-top:10px" onclick="UI.closeModal()">返回对局</button>
    </div>`, true);
  }

  /* ---------- 递机过场 ---------- */
  function handoff(name, cb) {
    $app().innerHTML = `
    <div class="handoff">
      <i data-lucide="smartphone" style="width:40px;height:40px;color:var(--gold)"></i>
      <h1>轮到 ${esc(name)}</h1>
      <p>请将设备交给下一名玩家</p>
      <button class="btn btn-gold btn-big" id="handoff-btn" style="max-width:280px">准备好了</button>
    </div>`;
    icons();
    document.getElementById('handoff-btn').onclick = cb;
  }

  /* ---------- 结算 ---------- */
  SCREENS.result = (r) => {
    const win = r.winner === 0;
    $app().innerHTML = `
    <div class="result ${win ? 'win' : 'lose'}">
      <h1 class="anim-up">${r.winner === -1 ? '平 局' : (win ? (r.series ? '夺 冠' : '胜 利') : (r.series ? '挑 战 失 败' : '落 败'))}</h1>
      <div class="vs anim-up" style="animation-delay:.15s">
        ${r.series
          ? `<b>${r.totals[0]}</b> : <b>${r.totals[1]}</b> <span style="font-size:.9rem">（三局两胜）</span>`
          : `<b>${r.totals[0]}</b> vs <b>${r.totals[1]}</b>`}
      </div>
      <div class="reward-list">
        ${(r.rewards || []).map((rw, i) => `<div class="reward-item" style="animation-delay:${.3 + i * .15}s"><i data-lucide="${rw.icon}"></i>${rw.text}</div>`).join('')}
      </div>
      <div class="btns">
        ${r.retry ? `<button class="btn btn-gold btn-big" onclick="UI.retry()">再来一局</button>` : ''}
        <button class="btn btn-ghost btn-big" onclick="UI.go('home')">返回主菜单</button>
      </div>
    </div>`;
  };

  /* ---------- 暴露给全局 ---------- */
  return {
    go, toast, modal, closeModal, banner, dieHTML, probHTML, probText, chargeDots, startMatch, startPrep, handoff,
    doRoll, dieTap, selectAll, keepSelection, bank, badgeUse, onBust, doBust, useResurrection,
    fortuneApply, fortuneCancel() { M.turn.fortuneMode = false; M.turn.fortunePicks.clear(); renderMatch(); },
    transmuteCancel() { M.turn.transmuteMode = false; renderMatch(); },
    scoreModal,
    firstDone() { Save.data.seenRules = true; Save.write(); go('home'); },
    shopTab(t) { shopTab = t; SCREENS.shop(); icons(); },
    localMode(m) { localCfg.mode = m; SCREENS.localSetup(); },
    localTarget(v) { localCfg.target = v; renderLocalOpt(); },
    localRounds(v) { localCfg.rounds = v; renderLocalOpt(); },
    localGo() { Main.startLocal(localCfg); },
    startRandom() { Main.startRandom(); },
    levelDetail(id) { Main.levelDetail(id); },
    prepPickDice(side, slot) { Main.prepPickDice(side, slot); },
    prepPickBadge(side) { Main.prepPickBadge(side); },
    prepStart() { Main.prepStart(); },
    skinPreview(id) { Main.skinPreview(id); },
    retry() { Main.retry(); },
    dicePickerItem,
    _setPrep(cfg) { PREP = cfg; },
    _getPrep: () => PREP,
    _getM: () => M,
    _renderMatch: renderMatch,
  };
})();
