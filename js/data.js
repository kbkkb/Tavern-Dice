/* ===== 数据配置层 =====
 * 所有数值集中在此，Unity 移植时照此表配置。
 * 骰子 weights = 六面权重数组（内部表示）；UI 展示时归一化为百分比。
 */
const DATA = (() => {

  /* ---- 计分表（简化版：只保留多同与顺子） ---- */
  const SCORE_TABLE = [
    ['单个 1', '100'], ['单个 5', '50'],
    ['三同', '1=1000，2~6=面值×100'], ['四同', '三同×2'], ['五同', '三同×3'],
    ['六同', '2000（封顶）'], ['顺子 1-5', '500'], ['顺子 2-6', '750'],
  ];

  /* ---- 特殊骰子（8 颗 + 标准骰，纯概率分布，规则零改动） ----
   * color = 每种骰子的专属底色/点色（UI 辨识用，也替代了原来的骰子皮肤） */
  const DICE = {
    standard: { name: '标准骰', weights: [1, 1, 1, 1, 1, 1], price: 0, currency: 'soft', color: { bg: '#efe6d0', pip: '#2a1f14' }, desc: '酒馆里最普通的骰子，六面均等。' },
    steady:   { name: '稳健骰', weights: [2, 1, 1, 2, 3, 3], price: 200, currency: 'soft', color: { bg: '#d6e8cc', pip: '#2e4a26' }, desc: '偏向 5 与 6，更难爆掉，但保底面变少。' },
    lucky:    { name: '幸运骰', weights: [2, 1, 1, 1, 2, 1], price: 200, currency: 'soft', color: { bg: '#f2dfa8', pip: '#5a4410' }, desc: '偏向 1 与 5，小分细水长流。' },
    brave:    { name: '勇士骰', weights: [1, 1, 1, 1, 1, 3], price: 500, currency: 'soft', color: { bg: '#e8c0b0', pip: '#6a1e14' }, desc: '三面逢 6，为三同而生的赌徒利器。' },
    lone:     { name: '孤胆骰', weights: [2, 0, 0, 0, 2, 2], price: 500, currency: 'soft', color: { bg: '#d4c4ea', pip: '#3a2464' }, desc: '只有 1、5、6，没有中间地带。' },
    craft:    { name: '匠心骰', weights: [1.5, 2, 2, 2, 2, 1.5], price: 500, currency: 'soft', color: { bg: '#c0d8ee', pip: '#1e3a5c' }, desc: '偏向 3 与 4，中盘三同流水线。' },
    heavy:    { name: '重压骰', weights: [2, 1, 1, 1, 3, 1], price: 600, currency: 'soft', color: { bg: '#e8cfa4', pip: '#5a3a14' }, desc: '5 占三成，稳定产出的中分机器。' },
    gambler:  { name: '赌徒骰', weights: [3, 1, 1, 1, 1, 2], price: 800, currency: 'soft', color: { bg: '#3a3a44', pip: '#d84a3a' }, desc: '1 占近半，要么大发，要么爆掉。' },
    demon:    { name: '恶魔骰', weights: [2.5, 0.25, 0.25, 0.25, 0.25, 2.5], price: 300, currency: 'gem', color: { bg: '#241018', pip: '#e84a3a' }, desc: '双极分布。恶魔在对你微笑。' },
  };

  /* ---- 徽章（5 种，充能制，跨局保留，用完才消耗） ---- */
  const BADGES = {
    resurrection:  { name: '复活徽章', charges: 2, price: 400,  currency: 'soft', icon: 'heart-pulse', desc: '即将爆掉时，免费重掷一次救命。' },
    fortune:       { name: '命运徽章', charges: 2, price: 350,  currency: 'soft', icon: 'clover',      desc: '掷骰后任选至多 2 枚骰子重投。' },
    transmutation: { name: '嬗变徽章', charges: 1, price: 500,  currency: 'soft', icon: 'wand-2',      desc: '将任意 1 枚骰子的点数变为 1。' },
    might:         { name: '神力徽章', charges: 2, price: 450,  currency: 'soft', icon: 'dices',       desc: '本次掷骰额外增加 1 枚骰子。' },
    doppelganger:  { name: '分身徽章', charges: 1, price: 1200, currency: 'soft', icon: 'copy',        desc: '本次扣骰的得分翻倍。' },
  };

  /* ---- AI 性格 ---- */
  const PERSONALITIES = {
    steady:   { name: '稳健', bank: 250, bankProb: 0.9,  desc: '见好就收，绝不恋战。' },
    balanced: { name: '均衡', bank: 350, bankProb: 0.6,  desc: '进退有度，难以捉摸。' },
    gambler:  { name: '赌徒', bank: 500, bankProb: 0.35, desc: '不掷到最后一颗决不罢休。' },
  };

  /* ---- 皮肤（台面/计分板两类；骰子颜色跟类型走，不做骰子皮肤） ---- */
  const SKINS = {
    table: [
      { id: 'table_wood',      name: '酒馆木桌',        price: 0,   currency: 'soft', vars: { '--felt': 'radial-gradient(ellipse at 50% 30%, #3a2c1c 0%, #241a10 55%, #171008 100%)', '--glow': 'rgba(255,170,60,.10)' } },
      { id: 'table_wood_red',  name: '酒馆木桌 · 酒红',  price: 150, currency: 'soft', vars: { '--felt': 'radial-gradient(ellipse at 50% 30%, #4a1e1a 0%, #2e1210 55%, #1a0a08 100%)', '--glow': 'rgba(255,120,60,.12)' } },
      { id: 'table_wood_dark', name: '酒馆木桌 · 墨黑',  price: 150, currency: 'soft', vars: { '--felt': 'radial-gradient(ellipse at 50% 30%, #26262e 0%, #16161c 55%, #0c0c10 100%)', '--glow': 'rgba(140,140,255,.08)' } },
      { id: 'table_marble',    name: '骨牌大理石',      price: 200, currency: 'gem',  vars: { '--felt': 'radial-gradient(ellipse at 50% 30%, #4a4a52 0%, #2e2e36 55%, #1a1a20 100%)', '--glow': 'rgba(200,200,220,.08)' } },
      { id: 'table_witch',     name: '女巫的诅咒桌',    price: 200, currency: 'gem',  vars: { '--felt': 'radial-gradient(ellipse at 50% 30%, #1e3a2a 0%, #12241a 55%, #08140c 100%)', '--glow': 'rgba(80,255,140,.08)' } },
    ],
    board: [
      { id: 'board_parchment', name: '羊皮纸计分板', price: 0,   currency: 'soft', vars: { '--board-bg': 'linear-gradient(160deg,#e8dcc4,#d8c8a8)', '--board-ink': '#3a2c1a' } },
      { id: 'board_iron',      name: '铁艺计分板',   price: 150, currency: 'soft', vars: { '--board-bg': 'linear-gradient(160deg,#3a3a42,#26262c)', '--board-ink': '#d8d8e0' } },
    ],
  };
  const ALL_SKINS = [...SKINS.table, ...SKINS.board];
  const skinById = id => ALL_SKINS.find(s => s.id === id);

  /* ---- 排位竞赛（四个区域：付费积分战 → Boss 三局两胜夺勋章） ----
   * fee/winCoins：普通战入场费与胜场软币；winPts/losePts：积分增减
   * ptsToBoss：积分达到后解锁 Boss 挑战（三局两胜）
   * bossFee/bossCoins：Boss 战入场费与夺冠奖励；skinReward：勋章附赠皮肤 */
  const REGIONS = [
    { id: 'r1', name: '烛火酒馆', bossName: '酒馆老板·老油条', medal: '酒馆铜杯', desc: '新手与醉汉的聚集地。',
      fee: 60, winCoins: 100, winPts: 40, losePts: 20, ptsToBoss: 120, target: 2000,
      pers: 'balanced', dice: ['steady', 'lucky', 'standard', 'standard', 'standard', 'standard'], badge: 'fortune',
      bossFee: 150, bossPers: 'balanced', bossDice: ['heavy', 'heavy', 'steady', 'lucky', 'standard', 'standard'], bossBadge: 'might', bossCoins: 200,
      skinReward: 'table_wood_red' },
    { id: 'r2', name: '码头赌档', bossName: '码头霸主·铁手格雷', medal: '码头银锚', desc: '水手们的钱袋在这里易主。',
      fee: 120, winCoins: 200, winPts: 50, losePts: 25, ptsToBoss: 150, target: 4000,
      pers: 'gambler', dice: ['craft', 'craft', 'brave', 'standard', 'standard', 'standard'], badge: 'transmutation',
      bossFee: 300, bossPers: 'gambler', bossDice: ['brave', 'brave', 'craft', 'craft', 'heavy', 'standard'], bossBadge: 'doppelganger', bossCoins: 400,
      skinReward: 'table_wood_dark' },
    { id: 'r3', name: '贵族牌室', bossName: '伯爵的管家·莫尔文', medal: '贵族金骰', desc: '丝绸手套下藏着灌铅的骰子。',
      fee: 250, winCoins: 400, winPts: 60, losePts: 30, ptsToBoss: 180, target: 4000,
      pers: 'steady', dice: ['heavy', 'heavy', 'gambler', 'lucky', 'standard', 'standard'], badge: 'resurrection',
      bossFee: 600, bossPers: 'steady', bossDice: ['gambler', 'gambler', 'lone', 'lone', 'heavy', 'heavy'], bossBadge: 'resurrection', bossCoins: 800,
      skinReward: 'board_iron' },
    { id: 'r4', name: '王城地下', bossName: '地下之王·暗骰者', medal: '王城传奇', desc: '传说没人能从这里赢走最后一枚金币。',
      fee: 500, winCoins: 800, winPts: 70, losePts: 35, ptsToBoss: 210, target: 8000,
      pers: 'gambler', dice: ['gambler', 'gambler', 'brave', 'brave', 'craft', 'craft'], badge: 'doppelganger',
      bossFee: 1000, bossPers: 'gambler', bossDice: ['demon', 'demon', 'gambler', 'gambler', 'brave', 'brave'], bossBadge: 'doppelganger', bossCoins: 1600,
      skinReward: 'table_marble' },
  ];
  const ENEMY_POOLS = [
    [['standard','standard','standard','standard','standard','standard'], ['steady','standard','standard','standard','standard','standard']],
    [['lucky','lucky','standard','standard','standard','standard'], ['craft','craft','steady','standard','standard','standard'], ['brave','standard','standard','standard','standard','standard']],
    [['heavy','heavy','lucky','standard','standard','standard'], ['brave','brave','craft','craft','standard','standard'], ['gambler','heavy','heavy','standard','standard','standard']],
    [['gambler','gambler','brave','brave','standard','standard'], ['demon','demon','heavy','heavy','lucky','lucky'], ['demon','gambler','gambler','lone','lone','brave']],
  ];
  const badgeKeys = Object.keys(BADGES);

  /* ---- 成就（模板化：同类型换数值档位） ---- */
  const ACHIEVEMENTS = [];
  const ROMAN = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'];
  function tier(icon, stat, name, desc, targets, rewards) {
    targets.forEach((t, i) => ACHIEVEMENTS.push({
      id: `${stat}_${i}`, icon, stat, name: `${name} ${ROMAN[i]}`,
      desc: desc.replace('{n}', t), target: t, reward: rewards[i], hidden: false,
    }));
  }
  tier('crown', 'wins', '常胜', '累计获胜 {n} 场', [1, 10, 50], [50, 150, 400]);
  tier('flame-kindling', 'busts', '爆掉的学费', '累计爆掉 {n} 次', [5, 25, 100], [30, 100, 300]);
  tier('dices', 'rolls', '老赌棍', '累计掷骰 {n} 次', [50, 300, 1000], [30, 100, 300]);
  tier('medal', 'medals', '荣耀之路', '赢得 {n} 枚区域勋章', [1, 2, 3, 4], [150, 300, 500, 1000]);
  tier('gem', 'diceOwned', '收藏家', '拥有 {n} 颗特殊骰', [1, 4, 8], [100, 250, 500]);
  tier('flame', 'hot', '火热手感', '累计触发 {n} 次 Hot Dice', [1, 10, 30], [50, 150, 400]);
  tier('coins', 'bestBank', '盆满钵满', '单回合存分达 {n}', [400, 700, 1000], [80, 200, 500]);
  ACHIEVEMENTS.push(
    { id: 'sixkind', icon: 'sparkles', stat: 'sixKind', name: '天命所归', desc: '掷出一次六同', target: 1, reward: 500, hidden: true },
    { id: 'nobadge', icon: 'hand', stat: 'noBadgeWins', name: '赤手空拳', desc: '不装备徽章获胜 1 场', target: 1, reward: 200, hidden: true },
    { id: 'straight5', icon: 'arrow-right', stat: 'straights', name: '一气呵成', desc: '累计掷出 5 次顺子', target: 5, reward: 150, hidden: true },
  );

  /* ---- 经济参数 ---- */
  const ECON = {
    winCoins: 100, loseCoins: 30, levelReplayCoins: 40,
    badgeDropRate: 0.25,
    rechargeGems: 500,
  };

  /* ---- 初始存档 ---- */
  function defaultSave() {
    return {
      coins: 0, gems: 0,
      dice: { standard: 6 },
      badges: {},
      skins: ['table_wood', 'board_parchment'],
      equipped: { table: 'table_wood', board: 'board_parchment' },
      loadout: ['standard', 'standard', 'standard', 'standard', 'standard', 'standard'],
      badge: null,
      ranked: { pts: {}, medals: [] },
      ach: {},
      stats: { wins: 0, losses: 0, busts: 0, rolls: 0, sixKind: 0, bestBank: 0, hot: 0, straights: 0, noBadgeWins: 0, levels: 0, diceOwned: 0 },
      seenRules: false,
    };
  }

  return { SCORE_TABLE, DICE, BADGES, PERSONALITIES, SKINS, ALL_SKINS, skinById, REGIONS, ACHIEVEMENTS, ECON, defaultSave };
})();
