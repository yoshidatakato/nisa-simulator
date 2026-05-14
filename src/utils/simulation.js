// ===== 定数 =====

export const RATE_OPTIONS = [
  { label: '3%',  value: 0.03 },
  { label: '5%',  value: 0.05 },
  { label: '7%',  value: 0.07 },
  { label: '10%', value: 0.10 },
];

// 積み上げグラフのレイヤー（下から順）
export const CHART_LAYERS = [
  { key: 'other',     label: 'その他資産', color: '#60a5fa' },
  { key: 'invest',    label: '運用資産',   color: '#f59e0b' },
  { key: 'nisaChart', label: 'NISA',       color: '#34d399' },
  { key: 'cashChart', label: '現金',       color: '#94a3b8' },
];

export const NISA_CAP       = 1800; // 万円／人（自分・配偶者）
export const NISA_CAP_CHILD =  600; // 万円（子ども：年60万×10年）

// ===== シミュレーション =====

/**
 * 現在の年齢〜90歳まで毎年の資産を計算する。
 *
 * ■ NISA 上限管理（各人 1800万、独立）
 *   自分   : 自分積立枠 + 自分成長投資枠   → 累計 1800万で拠出停止
 *   配偶者 : 配偶者積立枠 + 配偶者成長投資枠 → 累計 1800万で拠出停止
 *   子ども : 子ども積立枠                   → 累計 1800万で拠出停止
 *
 * @returns {{ data, selfFullAge, spouseFullAge, childFullAge }}
 */
export function simulate(inputs) {
  const {
    currentAge            = 30,
    fireAge               = 0,    // 取り崩し開始年齢（0=無効）
    cashSavings           = 0,
    nisaBalance           = 0,
    nisaRate              = 0.05,
    nisaSpouseBalance     = 0,
    nisaSpouseBalRate     = 0.05,
    investBalance         = 0,
    investRate            = 0.05,
    otherAssets           = 0,
    monthlyNisaSelf       = 0,
    nisaSelfRate          = 0.05,
    monthlyNisaSpouse     = 0,
    nisaSpouseRate        = 0.05,
    monthlyNisaChild      = 0,   // 子どものNISA積立
    nisaChildRate         = 0.05,
    monthlyGrowth         = 0,
    growthRate            = 0.05,
    monthlyGrowthSpouse   = 0,
    growthSpouseRate      = 0.05,
    monthlyIncome         = 0,
    monthlyExpenses       = 0,
    pensionSelf           = 0,   // 自分の年金月額
    pensionSpouse         = 0,   // 配偶者の年金月額
    pensionStartAge       = 65,  // 受給開始年齢（自分の年齢基準）
    sideFireIncome        = 0,   // サイドFIRE収入（月額）
  } = inputs;

  const age0  = Math.max(18, Math.min(89, Math.round(currentAge) || 30));
  const years = 91 - age0;

  // ── 初期値 ──
  let cash          = cashSavings   || 0;
  let nisaBase      = nisaBalance   || 0;
  let selfNisaAcc   = 0;
  let selfGrowthAcc = 0;
  let spsNisaBase   = nisaSpouseBalance || 0; // 配偶者の初期NISA残高
  let spsNisaAcc    = 0;                      // 配偶者の月次積立累計
  let spsGrowthAcc  = 0;
  let childNisaAcc  = 0;
  let invest        = investBalance || 0;
  const other       = otherAssets   || 0;

  // ── NISA累計拠出額・満額年齢 ──
  let selfContrib   = 0;
  let spsContrib    = 0;
  let childContrib  = 0;
  let selfFullAge   = null;
  let spouseFullAge = null;
  let childFullAge  = null;

  // ── 月次利回り ──
  const mrNisa         = (nisaRate            || 0) / 12;
  const mrNisaSelf     = (nisaSelfRate        || 0) / 12;
  const mrNisaSpsBal   = (nisaSpouseBalRate   || 0) / 12; // 配偶者NISA残高の利回り
  const mrNisaSps      = (nisaSpouseRate      || 0) / 12; // 配偶者NISA積立の利回り
  const mrNisaChild = (nisaChildRate    || 0) / 12;
  const mrGrowth    = (growthRate       || 0) / 12;
  const mrGrowthSps = (growthSpouseRate || 0) / 12;
  const mrInvest    = (investRate       || 0) / 12;
  const monthlyNetWork  = (monthlyIncome    || 0) - (monthlyExpenses || 0);
  const monthlyNetFire  = (sideFireIncome  || 0) - (monthlyExpenses || 0);

  const data = [];

  for (let t = 0; t < years; t++) {
    let annualWithdrawal = 0;
    if (t > 0) {
      const yearAge  = age0 + t;
      const isFire   = fireAge > 0 && yearAge >= fireAge;
      const monthlyNet = isFire ? monthlyNetFire : monthlyNetWork;
      const monthlyPension = (pensionStartAge > 0 && yearAge >= pensionStartAge)
        ? (pensionSelf || 0) + (pensionSpouse || 0)
        : 0;

      for (let m = 0; m < 12; m++) {
        // 複利運用
        nisaBase      *= (1 + mrNisa);
        selfNisaAcc   *= (1 + mrNisaSelf);
        selfGrowthAcc *= (1 + mrGrowth);
        spsNisaBase   *= (1 + mrNisaSpsBal);
        spsNisaAcc    *= (1 + mrNisaSps);
        spsGrowthAcc  *= (1 + mrGrowthSps);
        childNisaAcc  *= (1 + mrNisaChild);
        invest        *= (1 + mrInvest);
        cash += monthlyNet + monthlyPension;

        // 自分のNISA拠出（積立枠 + 成長投資枠）満額まで継続
        if (selfContrib < NISA_CAP) {
          const remaining  = NISA_CAP - selfContrib;
          const wantNisa   = monthlyNisaSelf || 0;
          const wantGrowth = monthlyGrowth   || 0;
          const wantTotal  = wantNisa + wantGrowth;
          if (wantTotal > 0) {
            const addTotal  = Math.min(wantTotal, remaining);
            const ratio     = addTotal / wantTotal;
            selfNisaAcc   += wantNisa   * ratio;
            selfGrowthAcc += wantGrowth * ratio;
            selfContrib   += addTotal;
            cash          -= addTotal;
          }
        }

        // 配偶者のNISA拠出（積立枠 + 成長投資枠）満額まで継続
        if (spsContrib < NISA_CAP) {
          const remaining  = NISA_CAP - spsContrib;
          const wantNisa   = monthlyNisaSpouse   || 0;
          const wantGrowth = monthlyGrowthSpouse || 0;
          const wantTotal  = wantNisa + wantGrowth;
          if (wantTotal > 0) {
            const addTotal  = Math.min(wantTotal, remaining);
            const ratio     = addTotal / wantTotal;
            spsNisaAcc   += wantNisa   * ratio;
            spsGrowthAcc += wantGrowth * ratio;
            spsContrib   += addTotal;
            cash         -= addTotal;
          }
        }

        // 子どものNISA拠出（上限 600万）満額まで継続
        if (childContrib < NISA_CAP_CHILD) {
          const add = Math.min(monthlyNisaChild || 0, NISA_CAP_CHILD - childContrib);
          if (add > 0) {
            childNisaAcc += add;
            childContrib += add;
            cash         -= add;
          }
        }
      }

      if (selfFullAge   === null && selfContrib  >= NISA_CAP)       selfFullAge   = age0 + t;
      if (spouseFullAge === null && spsContrib   >= NISA_CAP)       spouseFullAge = age0 + t;
      if (childFullAge  === null && childContrib >= NISA_CAP_CHILD) childFullAge  = age0 + t;

      // ── 4%取り崩し（年末に適用）──
      // 対象：現金・その他以外の全運用資産（NISA + 成長投資枠 + 運用資産）
      const totalInvested = nisaBase + selfNisaAcc + selfGrowthAcc + spsNisaBase + spsNisaAcc + spsGrowthAcc + childNisaAcc + invest;
      if (isFire && totalInvested > 0) {
        const withdrawal = totalInvested * 0.04;
        const ratio = withdrawal / totalInvested;
        nisaBase      *= (1 - ratio);
        selfNisaAcc   *= (1 - ratio);
        selfGrowthAcc *= (1 - ratio);
        spsNisaBase   *= (1 - ratio);
        spsNisaAcc    *= (1 - ratio);
        spsGrowthAcc  *= (1 - ratio);
        childNisaAcc  *= (1 - ratio);
        invest        *= (1 - ratio);
        cash          += withdrawal; // 取り崩し分を現金として受け取る
        annualWithdrawal = withdrawal;
      }
    }

    // ── スナップショット ──
    const rCash       = Math.round(cash);
    const rNisaBase   = Math.round(nisaBase);
    const rSelfNisa   = Math.round(selfNisaAcc);
    const rSelfGrowth = Math.round(selfGrowthAcc);
    const rSpsNisaBase = Math.round(spsNisaBase);
    const rSpsNisa    = Math.round(spsNisaAcc);
    const rSpsGrowth  = Math.round(spsGrowthAcc);
    const rChild      = Math.round(childNisaAcc);
    const rInvest     = Math.round(invest);

    const nisaTot = rNisaBase + rSelfNisa + rSelfGrowth + rSpsNisaBase + rSpsNisa + rSpsGrowth + rChild;

    data.push({
      age:    age0 + t,
      cash:   rCash,
      nisa:   rNisaBase + rSelfNisa + rSpsNisaBase + rSpsNisa + rChild,
      growth: rSelfGrowth + rSpsGrowth,
      invest: rInvest,
      other,
      total:  rCash + nisaTot + rInvest + other,
      // ツールチップ用（個別内訳）
      selfNisa:    rNisaBase + rSelfNisa,
      selfGrowth:  rSelfGrowth,
      spouseNisa:  rSpsNisaBase + rSpsNisa,
      spouseGrowth:rSpsGrowth,
      childNisa:   rChild,
      // グラフ用
      cashChart: Math.max(0, rCash),
      nisaChart: nisaTot,
      // FIRE取り崩し
      annualWithdrawal: Math.round(annualWithdrawal),
    });
  }

  return { data, selfFullAge, spouseFullAge, childFullAge };
}

// ===== フォーマット =====

export function formatMan(val) {
  if (val === undefined || val === null || isNaN(val)) return '—';
  const sign = val < 0 ? '-' : '';
  const abs  = Math.abs(val);
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(1)}億`;
  return `${sign}${abs.toLocaleString()}万`;
}
