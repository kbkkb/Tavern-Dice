/* ===== 规则引擎（纯逻辑，无 DOM） =====
 * 掷骰 / 计分组合搜索 / bust 判定 / AI 决策
 * Unity 移植时此文件对应核心 GameRules 模块。
 */
const Engine = (() => {

  const TRIPLE = v => v === 1 ? 1000 : v * 100;
  const KIND_MULT = { 3: 1, 4: 2, 5: 3 };   // 六同单独封顶 2000
  const KIND_NAME = { 3: '三同', 4: '四同', 5: '五同', 6: '六同' };

  function countsOf(values) {
    const c = [0, 0, 0, 0, 0, 0, 0];
    values.forEach(v => c[v]++);
    return c;
  }
  function subCounts(counts, use) { return counts.map((c, i) => c - (use[i] || 0)); }
  function totalCount(counts) { return counts.reduce((a, b) => a + b, 0); }

  /* 给定计数，枚举所有可独立成立的计分组合 */
  function comboList(counts) {
    const list = [];
    for (let v = 1; v <= 6; v++) {
      for (const k of [6, 5, 4, 3]) {
        if (counts[v] >= k) {
          const use = [0, 0, 0, 0, 0, 0, 0]; use[v] = k;
          list.push({ use, score: k === 6 ? 2000 : TRIPLE(v) * KIND_MULT[k], name: `${KIND_NAME[k]}·${v}` });
        }
      }
    }
    if (counts[1] >= 1) { const u = [0, 0, 0, 0, 0, 0, 0]; u[1] = 1; list.push({ use: u, score: 100, name: '单 1' }); }
    if (counts[5] >= 1) { const u = [0, 0, 0, 0, 0, 0, 0]; u[5] = 1; list.push({ use: u, score: 50, name: '单 5' }); }
    if ([1, 2, 3, 4, 5].every(v => counts[v] >= 1)) list.push({ use: [0, 1, 1, 1, 1, 1, 0], score: 500, name: '顺子 1-5' });
    if ([2, 3, 4, 5, 6].every(v => counts[v] >= 1)) list.push({ use: [0, 0, 1, 1, 1, 1, 1], score: 750, name: '顺子 2-6' });
    const pairs = [];
    for (let v = 1; v <= 6; v++) if (counts[v] >= 2) pairs.push(v);
    if (pairs.length >= 3) {
      const u = [0, 0, 0, 0, 0, 0, 0];
      pairs.slice(0, 3).forEach(v => u[v] = 2);
      list.push({ use: u, score: 600, name: '三对' });
    }
    for (let a = 1; a <= 6; a++) if (counts[a] >= 3)
      for (let b = 1; b <= 6; b++) if (b !== a && counts[b] >= 2) {
        const u = [0, 0, 0, 0, 0, 0, 0]; u[a] = 3; u[b] = 2;
        list.push({ use: u, score: TRIPLE(a) + b * 50, name: `葫芦 ${a}·${b}` });
      }
    return list;
  }

  /* 全量覆盖最优解：选中的骰子必须每一颗都参与计分，否则视为非法选择 */
  const memoFull = new Map(), memoPart = new Map();
  function bestFull(counts) {
    if (totalCount(counts) === 0) return { valid: true, score: 0, steps: [] };
    const key = counts.join(',');
    if (memoFull.has(key)) return memoFull.get(key);
    let best = null;
    for (const c of comboList(counts)) {
      const rest = bestFull(subCounts(counts, c.use));
      if (rest.valid) {
        const sc = c.score + rest.score;
        if (!best || sc > best.score) best = { valid: true, score: sc, steps: [c, ...rest.steps] };
      }
    }
    const r = best || { valid: false, score: 0, steps: [] };
    memoFull.set(key, r);
    return r;
  }
  /* 部分覆盖最优解（用于 bust 判定提示与 AI 取子） */
  function bestPartial(counts) {
    const key = counts.join(',');
    if (memoPart.has(key)) return memoPart.get(key);
    let best = { score: 0, steps: [] };
    for (const c of comboList(counts)) {
      const rest = bestPartial(subCounts(counts, c.use));
      const sc = c.score + rest.score;
      if (sc > best.score) best = { score: sc, steps: [c, ...rest.steps] };
    }
    memoPart.set(key, best);
    return best;
  }

  /* 玩家选择校验：非空 + 每颗都参与计分 */
  function scoreSelection(values) {
    if (!values.length) return { valid: false, score: 0, steps: [] };
    const r = bestFull(countsOf(values));
    return r.valid ? { valid: true, score: r.score, steps: r.steps } : { valid: false, score: 0, steps: [] };
  }
  function rollHasScore(values) { return comboList(countsOf(values)).length > 0; }

  /* 「全部选取」：按最优部分解返回建议下标 */
  function bestSelectionIndices(values) {
    const plan = bestPartial(countsOf(values));
    const used = new Array(values.length).fill(false);
    const indices = [];
    for (const step of plan.steps) {
      for (let v = 1; v <= 6; v++) {
        let need = step.use[v] || 0;
        for (let i = 0; i < values.length && need > 0; i++) {
          if (!used[i] && values[i] === v) { used[i] = true; indices.push(i); need--; }
        }
      }
    }
    return { indices, score: plan.score, steps: plan.steps };
  }

  /* ---- 加权掷骰 ---- */
  function rollValue(weights) {
    const t = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * t;
    for (let i = 0; i < 6; i++) { r -= weights[i]; if (r <= 0) return i + 1; }
    return 6;
  }
  function rollDice(types) { return types.map(t => ({ type: t, value: rollValue(DATA.DICE[t].weights) })); }
  function rerollDie(die) { die.value = rollValue(DATA.DICE[die.type].weights); return die; }

  /* ---- AI ---- */
  function aiShouldBank(pending, unkeptCount, total, persKey, cfg) {
    const p = DATA.PERSONALITIES[persKey];
    if (cfg.mode === 'race' && total + pending >= cfg.target) return true;   // 冲线必存
    if (pending >= p.bank * 1.6) return true;
    if (pending >= p.bank) return Math.random() < p.bankProb;
    if (unkeptCount <= 2 && pending >= p.bank * 0.6) return Math.random() < p.bankProb * 0.8;
    return false;
  }
  /* AI 取子：最优部分解 */
  function aiPick(values) { return bestSelectionIndices(values); }

  return { countsOf, comboList, scoreSelection, rollHasScore, bestSelectionIndices, rollValue, rollDice, rerollDie, aiShouldBank, aiPick, TRIPLE };
})();
