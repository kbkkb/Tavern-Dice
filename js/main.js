/* ===== 入口 / 存档 / 经济 / 成就 / 流程编排 ===== */

/* ---------- 存档 ---------- */
const Save = {
  KEY: 'tavern_dice_save_v1',
  data: null,
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { d = null; }
    // 与默认存档深度合并：老存档缺新字段（如 ranked）时自动补齐，避免 undefined 崩溃
    const base = DATA.defaultSave();
    this.data = Object.assign(base, d || {});
    if (!this.data.stats || typeof this.data.stats !== 'object') this.data.stats = base.stats;
    this.data.stats = Object.assign({}, base.stats, this.data.stats);
    if (!this.data.ranked || typeof this.data.ranked !== 'object') this.data.ranked = base.ranked;
    this.data.ranked = Object.assign({}, base.ranked, this.data.ranked);
    if (!this.data.ranked.pts || typeof this.data.ranked.pts !== 'object') this.data.ranked.pts = {};
    if (!Array.isArray(this.data.ranked.medals)) this.data.ranked.medals = [];
    if (!this.data.dice || typeof this.data.dice !== 'object') this.data.dice = base.dice;
    if (!Array.isArray(this.data.skins)) this.data.skins = base.skins;
    if (!this.data.equipped || typeof this.data.equipped !== 'object') this.data.equipped = base.equipped;
    if (!Array.isArray(this.data.loadout) || this.data.loadout.length !== 6) this.data.loadout = base.loadout;
    if (!this.data.ach || typeof this.data.ach !== 'object') this.data.ach = {};
    this.data.badges = this.data.badges && typeof this.data.badges === 'object' ? this.data.badges : {};
  },
  write() { try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* file:// 下被跟踪防护拦截时静默降级为内存存档 */ } },
};

/* ---------- 主控制器 ---------- */
const Main = (() => {
  let lastStart = null;
  const _seriesRef = { v: null };

  /* ---- 皮肤（台面/计分板；骰子颜色随类型，不参与皮肤系统） ---- */
  function applySkins() {
    const s = Save.data;
    for (const kind of ['table', 'board']) {
      const sk = DATA.skinById(s.equipped[kind]);
      if (sk) for (const [k, v] of Object.entries(sk.vars)) document.body.style.setProperty(k, v);
    }
  }

  /* ---- 统计与成就 ---- */
  function stat(key, n, isMax) {
    const st = Save.data.stats;
    if (isMax) st[key] = Math.max(st[key] || 0, n);
    else st[key] = (st[key] || 0) + n;
    Save.write();
  }
  function achProgress(a) {
    const s = Save.data;
    if (a.stat === 'medals') return (s.ranked && s.ranked.medals) ? s.ranked.medals.length : 0;
    if (a.stat === 'diceOwned') return Object.entries(s.dice).filter(([k]) => k !== 'standard').reduce((n, [, c]) => n + c, 0);
    return s.stats[a.stat] || 0;
  }
  function claimAch(id) {
    const a = DATA.ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return;
    if (!Save.data.ach[id]) Save.data.ach[id] = {};
    if (Save.data.ach[id].claimed) return;
    Save.data.ach[id].claimed = true;
    Save.data.coins += a.reward;
    Save.write();
    UI.toast(`成就达成：${a.name}，+${a.reward} 软币`);
    UI.go('achievements');
  }

  /* ---- 商店 ---- */
  function canPay(price, currency) {
    const s = Save.data;
    if (currency === 'gem' && s.gems < price) { UI.toast('点券不足'); return false; }
    if (currency !== 'gem' && s.coins < price) { UI.toast('软币不足'); return false; }
    return true;
  }
  function pay(price, currency) {
    if (currency === 'gem') Save.data.gems -= price; else Save.data.coins -= price;
  }
  function buyDice(id) {
    const d = DATA.DICE[id];
    if (!canPay(d.price, d.currency)) return;
    pay(d.price, d.currency);
    Save.data.dice[id] = (Save.data.dice[id] || 0) + 1;
    Save.write();
    UI.toast(`购入 ${d.name}`);
    UI.go('shop');
  }
  function buyBadge(id) {
    const b = DATA.BADGES[id];
    if (!canPay(b.price, b.currency)) return;
    pay(b.price, b.currency);
    Save.data.badges[id] = (Save.data.badges[id] || 0) + b.charges;
    Save.write();
    UI.toast(`购入 ${b.name}（充能 +${b.charges}）`);
    UI.go('shop');
  }
  function buySkin(kind, id) {
    const sk = DATA.skinById(id);
    if (!canPay(sk.price, sk.currency)) return;
    pay(sk.price, sk.currency);
    Save.data.skins.push(id);
    Save.data.equipped[kind] = id;
    Save.write(); applySkins();
    UI.toast(`已购入并装备「${sk.name}」`);
    UI.go('shop');
  }
  function equipSkin(kind, id) {
    Save.data.equipped[kind] = id;
    Save.write(); applySkins();
    UI.go('shop');
  }
  function recharge() {
    UI.modal(`<div style="padding:20px;text-align:center">
      <h3 style="color:var(--gold-bright);margin-bottom:8px"><i data-lucide="gem"></i> 充值点券（演示）</h3>
      <p style="font-size:.82rem;margin-bottom:16px;opacity:.8">demo 假充值流程：点击确认即模拟支付成功，获得 ${DATA.ECON.rechargeGems} 点券。</p>
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost" style="flex:1" onclick="UI.closeModal()">取消</button>
        <button class="btn btn-gold" style="flex:1" onclick="Main.rechargeOk()">确认支付</button>
      </div></div>`, true);
  }
  function rechargeOk() {
    Save.data.gems += DATA.ECON.rechargeGems;
    Save.write();
    UI.closeModal();
    UI.toast(`充值成功（模拟）：+${DATA.ECON.rechargeGems} 点券`);
    UI.go('shop');
  }
  function skinPreview(id) {
    const sk = DATA.skinById(id);
    const mainVar = sk.vars['--felt'] || sk.vars['--die-bg'] || sk.vars['--board-bg'];
    UI.modal(`<div>
      <div style="height:240px;background:${mainVar};display:flex;align-items:center;justify-content:center;gap:10px">
        ${UI.dieHTML(1)}${UI.dieHTML(3)}${UI.dieHTML(6)}
      </div>
      <div style="padding:16px;text-align:center">
        <h3 style="color:var(--gold-bright)">${sk.name}</h3>
        <p style="font-size:.75rem;color:var(--ink-dim);margin:6px 0 14px">预览为该皮肤在对局中的实际效果</p>
        <button class="btn btn-ghost" onclick="UI.closeModal()">返回</button>
      </div></div>`, true);
  }

  /* ---------- 准备页编排 ---------- */
  function mkBadge(id, free) {
    if (!id) return null;
    const def = DATA.BADGES[id];
    const left = free ? def.charges : Math.min(def.charges, Save.data.badges[id] || 0);
    return left > 0 ? { id, charges: left } : null;
  }

  /* 随机挑战 */
  let randCfg = null;
  function startRandom() {
    const pers = ['steady', 'balanced', 'gambler'][Math.floor(Math.random() * 3)];
    const specialKeys = Object.keys(DATA.DICE).filter(k => k !== 'standard');
    const enemyDice = Array.from({ length: 6 }, () => Math.random() < 0.4
      ? specialKeys[Math.floor(Math.random() * specialKeys.length)] : 'standard');
    const badgeKeys = Object.keys(DATA.BADGES);
    const enemyBadge = Math.random() < 0.6 ? badgeKeys[Math.floor(Math.random() * badgeKeys.length)] : null;
    randCfg = { mode: 'race', target: 4000 };
    UI._setPrep({
      title: '随机挑战 · 准备', back: 'home', editing: 0, localEdit: false,
      players: [
        { name: '我', dice: [...Save.data.loadout], badgeId: Save.data.badge, free: false },
        { name: '神秘赌客', isAI: true, pers, dice: enemyDice, badgeId: enemyBadge, free: true },
      ],
      optionsHTML: () => `<div class="opt-row" style="padding:10px 16px 0"><span class="lbl">目标分（难度）</span>${[2000, 4000, 8000].map(v =>
        `<span class="chip ${randCfg.target === v ? 'sel' : ''}" onclick="Main.randTarget(${v})">${v}</span>`).join('')}</div>`,
      matchCfg: () => ({ ...randCfg }),
      kind: 'random',
    });
    UI.go('prep');
  }
  function randTarget(v) { randCfg.target = v; UI.go('prep'); }

  /* ---- 排位竞赛（四个区域：积分战 → Boss 三局两胜夺勋章） ---- */
  function regPts(id) { return (Save.data.ranked && Save.data.ranked.pts[id]) || 0; }
  function regionUnlocked(reg, idx) { return idx === 0 || (Save.data.ranked && Save.data.ranked.medals.includes(DATA.REGIONS[idx - 1].id)); }
  function summarizeDice(dice) {
    const m = {};
    dice.forEach(d => m[d] = (m[d] || 0) + 1);
    return Object.entries(m).map(([k, c]) => `${DATA.DICE[k].name}×${c}`).join('、');
  }
  function startRankedBattle(id) {
    const reg = DATA.REGIONS.find(x => x.id === id);
    UI._setPrep({
      title: `排位 · ${reg.name}`, back: 'map', editing: 0, localEdit: false, kind: 'ranked', regionId: id,
      fee: reg.fee, feeLabel: `支付 ${reg.fee} 软币入场 · 目标 ${reg.target} 分（胜 +${reg.winPts} 分 / 负 -${reg.losePts} 分）`,
      players: [
        { name: '我', dice: [...Save.data.loadout], badgeId: Save.data.badge, free: false },
        { name: reg.name + ' 常客', isAI: true, pers: reg.pers, dice: reg.dice, badgeId: reg.badge, free: true },
      ],
      matchCfg: () => ({ mode: 'race', target: reg.target }),
    });
    UI.go('prep');
  }
  function startBossChallenge(id) {
    const reg = DATA.REGIONS.find(x => x.id === id);
    UI._setPrep({
      title: `霸主战 · ${reg.name}`, back: 'map', editing: 0, localEdit: false, kind: 'boss', regionId: id,
      fee: reg.bossFee, feeLabel: `支付 ${reg.bossFee} 软币入场 · 三局两胜 · 夺取「${reg.medal}」勋章`,
      players: [
        { name: '我', dice: [...Save.data.loadout], badgeId: Save.data.badge, free: false },
        { name: reg.bossName, isAI: true, pers: reg.bossPers, dice: reg.bossDice, badgeId: reg.bossBadge, free: true },
      ],
      matchCfg: () => ({ mode: 'race', target: reg.target }),
    });
    UI.go('prep');
  }

  /* 本地对战 */
  function startLocal(cfg) {
    UI._setPrep({
      title: '本地对战 · 双方配置', back: 'home', editing: 0, localEdit: true,
      players: [
        { name: '玩家 1', dice: ['standard', 'standard', 'standard', 'standard', 'standard', 'standard'], badgeId: null, free: true },
        { name: '玩家 2', dice: ['standard', 'standard', 'standard', 'standard', 'standard', 'standard'], badgeId: null, free: true },
      ],
      matchCfg: () => ({ ...cfg, local: true }),
      kind: 'local',
    });
    UI.go('prep');
  }

  /* ---- 准备页选择器 ---- */
  function prepPickDice(side, slot) {
    const P = UI._getPrep();
    const pl = P.players[side];
    const s = Save.data;
    let items = '';
    for (const [id, d] of Object.entries(DATA.DICE)) {
      if (!pl.free) {
        const owned = s.dice[id] || 0;
        const usedInSide = pl.dice.filter(x => x === id).length;
        const usedElsewhere = side === 0 && P.kind !== 'local' ? 0 : 0;
        const avail = owned - usedInSide - usedElsewhere;
        if (owned === 0) continue;
        items += UI.dicePickerItem(id, avail <= 0, pl.dice[slot] === id, `Main.pickDice(${side},${slot},'${id}')`);
      } else {
        items += UI.dicePickerItem(id, false, pl.dice[slot] === id, `Main.pickDice(${side},${slot},'${id}')`);
      }
    }
    UI.modal(`<div style="padding:16px 16px 4px"><h3 style="color:var(--gold-bright);letter-spacing:.15em">选择骰子（槽位 ${slot + 1}）</h3>
      <p style="font-size:.72rem;opacity:.7;margin-top:4px">百分比为该面出现的概率</p></div>
      <div class="picker-list">${items}</div>`);
  }
  function pickDice(side, slot, id) {
    const P = UI._getPrep();
    P.players[side].dice[slot] = id;
    UI.closeModal();
    UI.go('prep');
  }
  function prepPickBadge(side) {
    const P = UI._getPrep();
    const pl = P.players[side];
    const s = Save.data;
    let items = `<div class="picker-item ${!pl.badgeId ? 'cur' : ''}" onclick="Main.pickBadge(${side},null)">
      <div class="bi" style="width:34px;height:34px;border-radius:8px;background:rgba(201,162,39,.1);display:flex;align-items:center;justify-content:center;color:var(--gold)"><i data-lucide="shield-off"></i></div>
      <div class="nm"><b>不携带</b><p>赤手空拳上阵</p></div></div>`;
    for (const [id, b] of Object.entries(DATA.BADGES)) {
      const left = pl.free ? b.charges : (s.badges[id] || 0);
      if (!pl.free && left <= 0) continue;
      items += `<div class="picker-item ${pl.badgeId === id ? 'cur' : ''}" onclick="Main.pickBadge(${side},'${id}')">
        <div class="bi" style="width:34px;height:34px;border-radius:8px;background:rgba(201,162,39,.1);display:flex;align-items:center;justify-content:center;color:var(--gold)"><i data-lucide="${b.icon}"></i></div>
        <div class="nm"><b>${b.name}</b><p>${b.desc}</p></div>
        ${UI.chargeDots(Math.min(left, b.charges), b.charges)}
      </div>`;
    }
    UI.modal(`<div style="padding:16px 16px 4px"><h3 style="color:var(--gold-bright);letter-spacing:.15em">选择徽章</h3></div>
      <div class="picker-list">${items}</div>`);
  }
  function pickBadge(side, id) {
    UI._getPrep().players[side].badgeId = id;
    UI.closeModal();
    UI.go('prep');
  }

  /* ---- 开战 ---- */
  function consumeBadge(badgeId, used) {
    if (!badgeId || !used) return;
    const s = Save.data;
    s.badges[badgeId] = Math.max(0, (s.badges[badgeId] || 0) - used);
    if (s.badges[badgeId] <= 0) delete s.badges[badgeId];
  }
  function prepStart() {
    const P = UI._getPrep();
    // 单人模式：保存构筑回存档
    if (P.kind !== 'local') {
      Save.data.loadout = [...P.players[0].dice];
      Save.data.badge = P.players[0].badgeId;
      Save.write();
    }
    // 排位/Boss：先付入场费
    if (P.kind === 'ranked' || P.kind === 'boss') {
      if (Save.data.coins < P.fee) { UI.toast(`软币不足：需 ${P.fee} 软币入场`); return; }
      Save.data.coins -= P.fee;
      Save.write();
      UI.toast(`已支付入场费 ${P.fee} 软币`);
    }
    const players = P.players.map(pl => ({
      name: pl.name, isAI: !!pl.isAI, pers: pl.pers,
      dice: [...pl.dice],
      badge: mkBadge(pl.badgeId, pl.free),
    }));
    const cfg = { ...P.matchCfg(), players, local: P.kind === 'local', onEnd: r => onMatchEnd(P, r) };
    lastStart = () => prepStart();
    if (P.kind === 'boss') {
      // Boss 三局两胜系列赛
      const prepCharges = P.players[0].badgeId ? Math.min(DATA.BADGES[P.players[0].badgeId].charges, Save.data.badges[P.players[0].badgeId] || 0) : 0;
      playSeriesGame({ regionId: P.regionId, wins: [0, 0], game: 0, prepPlayers: P.players, prepCharges, prepBadgeId: P.players[0].badgeId });
    } else {
      UI.startMatch(cfg);
    }
  }
  function buildSeriesPlayers(series) {
    const P = { players: series.prepPlayers };
    return series.prepPlayers.map(pl => ({
      name: pl.name, isAI: !!pl.isAI, pers: pl.pers,
      dice: [...pl.dice],
      badge: pl.free ? mkBadge(pl.badgeId, true)
        : (pl.badgeId ? { id: pl.badgeId, charges: series.prepCharges } : null),
    }));
  }
  function playSeriesGame(series) {
    const reg = DATA.REGIONS.find(x => x.id === series.regionId);
    _seriesRef.v = series;
    const players = buildSeriesPlayers(series);
    series.game++;
    lastStart = () => playSeriesGame({ ...series, game: series.game - 1 });
    UI.startMatch({
      mode: 'race', target: reg.target, players,
      onEnd: r => onBossGameEnd(series, r),
    });
  }
  function onBossGameEnd(series, r) {
    const reg = DATA.REGIONS.find(x => x.id === series.regionId);
    // 每局消耗玩家徽章充能（局间重置为准备页时的量，但用掉的从存档扣）
    consumeBadge(series.prepBadgeId, r.players[0].badgeUsed || 0);
    if (r.winner === 0) series.wins[0]++; else if (r.winner === 1) series.wins[1]++;
    Save.write();
    if (series.wins[0] >= 2) return bossVictory(series, reg);
    if (series.wins[1] >= 2) {
      UI.go('result', { winner: 1, totals: series.wins, series: true, rewards: [
        { icon: 'shield-x', text: '霸主卫冕成功 · 勋章未夺得（入场费不退）' },
      ], retry: true });
      return;
    }
    UI.go('interstitial', { series });
  }
  function bossVictory(series, reg) {
    const s = Save.data;
    s.coins += reg.bossCoins;
    if (!s.ranked.medals.includes(reg.id)) s.ranked.medals.push(reg.id);
    s.ranked.pts[reg.id] = 0;
    s.stats.wins++;
    if (!series.prepBadgeId) s.stats.noBadgeWins++;
    const rewards = [
      { icon: 'medal', text: `夺得勋章「${reg.medal}」` },
      { icon: 'coins', text: `夺冠奖金 +${reg.bossCoins} 软币` },
    ];
    if (reg.skinReward && !s.skins.includes(reg.skinReward)) {
      s.skins.push(reg.skinReward);
      rewards.push({ icon: 'palette', text: `附赠皮肤「${DATA.skinById(reg.skinReward).name}」` });
    }
    if (Math.random() < DATA.ECON.badgeDropRate) {
      const keys = Object.keys(DATA.BADGES);
      const bid = keys[Math.floor(Math.random() * keys.length)];
      s.badges[bid] = (s.badges[bid] || 0) + DATA.BADGES[bid].charges;
      rewards.push({ icon: DATA.BADGES[bid].icon, text: `掉落徽章：${DATA.BADGES[bid].name}` });
    }
    Save.write();
    UI.go('result', { winner: 0, totals: series.wins, series: true, rewards, retry: true });
  }
  function seriesNext() {
    if (Main._series) playSeriesGame(Main._series);
  }
  function retry() { if (lastStart) lastStart(); }

  /* 复活徽章确认（委托 UI 流程，保证 bust 处理不断链） */
  function bustConfirm(use) {
    UI.closeModal();
    if (use) {
      const M = UI._getM();
      M.players[M.cur].badgeUsed++;
      UI.useResurrection();
    } else {
      UI.doBust();
    }
  }

  /* ---- 对局结束结算（随机挑战 / 排位普通战） ---- */
  function onMatchEnd(P, r) {
    const win = r.winner === 0;
    const rewards = [];
    if (P.kind === 'local') {
      // 经济隔离：无奖励无消耗
    } else {
      const s = Save.data;
      const used = r.players[0].badgeUsed || 0;
      consumeBadge(P.players[0].badgeId, used);
      if (P.kind === 'ranked') {
        const reg = DATA.REGIONS.find(x => x.id === P.regionId);
        if (win) {
          s.stats.wins++;
          if (!P.players[0].badgeId) s.stats.noBadgeWins++;
          s.coins += reg.winCoins;
          s.ranked.pts[reg.id] = regPts(reg.id) + reg.winPts;
          rewards.push({ icon: 'coins', text: `胜场奖金 +${reg.winCoins} 软币（入场费已付）` });
          rewards.push({ icon: 'trending-up', text: `排位积分 +${reg.winPts}` });
          if (regPts(reg.id) >= reg.ptsToBoss && !s.ranked.medals.includes(reg.id))
            rewards.push({ icon: 'medal', text: `Boss 挑战已解锁！回排位页挑战 ${reg.bossName}` });
        } else {
          s.stats.losses++;
          s.ranked.pts[reg.id] = Math.max(0, regPts(reg.id) - reg.losePts);
          rewards.push({ icon: 'trending-down', text: `排位积分 -${reg.losePts}（入场费不退）` });
        }
      } else {
        if (win) {
          s.stats.wins++;
          if (!P.players[0].badgeId) s.stats.noBadgeWins++;
          s.coins += DATA.ECON.winCoins;
          rewards.push({ icon: 'coins', text: `胜利奖励 +${DATA.ECON.winCoins} 软币` });
        } else {
          s.stats.losses++;
          s.coins += DATA.ECON.loseCoins;
          rewards.push({ icon: 'coins', text: `参与奖励 +${DATA.ECON.loseCoins} 软币` });
        }
        if (Math.random() < DATA.ECON.badgeDropRate) {
          const keys = Object.keys(DATA.BADGES);
          const bid = keys[Math.floor(Math.random() * keys.length)];
          s.badges[bid] = (s.badges[bid] || 0) + DATA.BADGES[bid].charges;
          rewards.push({ icon: DATA.BADGES[bid].icon, text: `掉落徽章：${DATA.BADGES[bid].name}` });
        }
      }
      Save.write();
    }
    UI.go('result', { winner: r.winner, totals: r.totals, rewards, retry: true });
  }

  return {
    applySkins, stat, achProgress, claimAch,
    buyDice, buyBadge, buySkin, equipSkin, recharge, rechargeOk, skinPreview,
    startRandom, randTarget, startRankedBattle, startBossChallenge, startLocal,
    prepPickDice, pickDice, prepPickBadge, pickBadge, prepStart, retry, bustConfirm, seriesNext,
    get _series() { return _seriesRef.v; },
  };
})();

/* ---------- 启动 ---------- */
function boot() {
  Save.load();
  Main.applySkins();
  if (!Save.data.seenRules) UI.go('rules', { first: true });
  else UI.go('home');
}
if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot);
else boot();
