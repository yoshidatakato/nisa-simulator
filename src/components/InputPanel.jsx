import React, { useState, useEffect, useRef } from 'react';
import { RATE_OPTIONS, formatMan } from '../utils/simulation';

// ===== ローカル文字列ステートで中間入力を保持するフック =====
// 「5.」「0.1」のような入力途中でも親ステートをリセットしない

function useNumStr(externalValue) {
  const [str, setStr] = useState(() =>
    externalValue === 0 ? '' : String(externalValue)
  );
  const prevRef = useRef(externalValue);

  useEffect(() => {
    if (prevRef.current === externalValue) return;
    prevRef.current = externalValue;
    // 外部から値が変わったとき（localStorageからの復元など）だけ同期
    const n = parseFloat(str);
    if (isNaN(n) ? externalValue !== 0 : n !== externalValue) {
      setStr(externalValue === 0 ? '' : String(externalValue));
    }
  }, [externalValue]);

  return [str, setStr];
}

// ===== 共通パーツ =====

function NumInput({
  label, value, onChange,
  unit = '万円', note, placeholder = '0',
  min = 0, max, step = 1,
}) {
  const [str, setStr] = useNumStr(value);

  const handleChange = (e) => {
    const raw = e.target.value;
    setStr(raw);
    if (raw === '') { onChange(0); return; }
    const n = parseFloat(raw);
    if (isNaN(n)) return;
    let v = n;
    if (max != null && v > max) v = max;
    if (min != null && v < min) v = min;
    onChange(v);
  };

  return (
    <div className="inp-group">
      <div className="inp-label-row">
        <label className="inp-label">{label}</label>
        {note && <span className="inp-note">{note}</span>}
      </div>
      <div className="inp-row">
        <input
          type="number"
          className="inp-field"
          value={str}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          onChange={handleChange}
        />
        <span className="inp-unit">{unit}</span>
      </div>
    </div>
  );
}

function RateSelect({ value, onChange }) {
  return (
    <select
      className="inp-rate-select"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {RATE_OPTIONS.map((r) => (
        <option key={r.value} value={r.value}>{r.label}</option>
      ))}
    </select>
  );
}

// 資産入力（金額 + 任意の利回り選択）
function AssetRow({ label, note, amount, onAmount, rate, onRate, step = 10, placeholder = '0' }) {
  const [str, setStr] = useNumStr(amount);

  const handleChange = (e) => {
    const raw = e.target.value;
    setStr(raw);
    if (raw === '') { onAmount(0); return; }
    const n = parseFloat(raw);
    if (!isNaN(n)) onAmount(Math.max(0, n));
  };

  return (
    <div className="inp-group">
      <div className="inp-label-row">
        <label className="inp-label">{label}</label>
        {note && <span className="inp-note">{note}</span>}
      </div>
      <div className="inp-row">
        <input
          type="number"
          className="inp-field"
          value={str}
          min={0}
          step={step}
          placeholder={placeholder}
          onChange={handleChange}
        />
        <span className="inp-unit">万円</span>
        {rate !== undefined && <RateSelect value={rate} onChange={onRate} />}
      </div>
    </div>
  );
}

// 積立入力（金額 + 任意の利回り選択）
function ContribRow({ label, note, amount, onAmount, rate, onRate, max, placeholder = '0' }) {
  const [str, setStr] = useNumStr(amount);

  const handleChange = (e) => {
    const raw = e.target.value;
    setStr(raw);
    if (raw === '') { onAmount(0); return; }
    const n = parseFloat(raw);
    if (isNaN(n)) return;
    const v = max != null ? Math.min(n, max) : n;
    onAmount(Math.max(0, v));
  };

  return (
    <div className="inp-group">
      <div className="inp-label-row">
        <label className="inp-label">{label}</label>
        {note && <span className="inp-note">{note}</span>}
      </div>
      <div className="inp-row">
        <input
          type="number"
          className="inp-field"
          value={str}
          min={0}
          max={max}
          step={0.1}
          placeholder={placeholder}
          onChange={handleChange}
        />
        <span className="inp-unit">万円/月</span>
        {rate !== undefined && <RateSelect value={rate} onChange={onRate} />}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="inp-section-title">{children}</h3>;
}

function Subtotal({ label, value, suffix = '円', color }) {
  return (
    <div className="inp-subtotal" style={color ? { borderLeftColor: color } : undefined}>
      <span className="inp-subtotal-label">{label}</span>
      <span className="inp-subtotal-value" style={color ? { color } : undefined}>
        {formatMan(value)}{suffix}
      </span>
    </div>
  );
}

// ===== メインコンポーネント =====

export default function InputPanel({ inputs, set }) {
  const totalAssets =
    (inputs.cashSavings       || 0) +
    (inputs.nisaBalance       || 0) +
    (inputs.nisaSpouseBalance || 0) +
    (inputs.investBalance     || 0) +
    (inputs.otherAssets       || 0);

  const monthlyContribs =
    (inputs.monthlyNisaSelf      || 0) +
    (inputs.monthlyNisaSpouse    || 0) +
    (inputs.monthlyNisaChild     || 0) +
    (inputs.monthlyGrowth        || 0) +
    (inputs.monthlyGrowthSpouse  || 0);

  const monthlyLeft =
    (inputs.monthlyIncome   || 0) -
    (inputs.monthlyExpenses || 0) -
    monthlyContribs;

  return (
    <div className="input-panel">
      <div className="panel-heading">
        <span className="panel-logo">📊</span>
        <span className="panel-title-text">ライフプラン<br />資産シミュレーター</span>
      </div>

      {/* ===== 現在の年齢 ===== */}
      <SectionTitle>現在の年齢</SectionTitle>
      <NumInput
        label="自分の年齢" unit="歳" placeholder="例：30"
        value={inputs.currentAge}
        onChange={(v) => set('currentAge', Math.max(18, Math.min(89, v || 18)))}
        min={18} max={89}
      />
      <NumInput
        label="配偶者の年齢" unit="歳" placeholder="例：28"
        value={inputs.spouseAge}
        onChange={(v) => set('spouseAge', Math.max(0, Math.min(89, v || 0)))}
        min={0} max={89}
      />

      {/* ===== 現在の資産 ===== */}
      <SectionTitle>現在の資産</SectionTitle>

      <AssetRow
        label="現金・貯金" placeholder="例：100"
        amount={inputs.cashSavings}
        onAmount={(v) => set('cashSavings', v)}
      />
      <AssetRow
        label="NISA累計積立額" note="利回り" placeholder="例：50"
        amount={inputs.nisaBalance}
        onAmount={(v) => set('nisaBalance', v)}
        rate={inputs.nisaRate}
        onRate={(v) => set('nisaRate', v)}
      />
      <AssetRow
        label="配偶者のNISA累計積立額" note="利回り" placeholder="例：50"
        amount={inputs.nisaSpouseBalance}
        onAmount={(v) => set('nisaSpouseBalance', v)}
        rate={inputs.nisaSpouseBalRate}
        onRate={(v) => set('nisaSpouseBalRate', v)}
      />
      <AssetRow
        label="運用資産・株式など" note="利回り" placeholder="例：200"
        amount={inputs.investBalance}
        onAmount={(v) => set('investBalance', v)}
        rate={inputs.investRate}
        onRate={(v) => set('investRate', v)}
      />
      <AssetRow
        label="その他資産・不動産など" note="運用なし" placeholder="例：500"
        amount={inputs.otherAssets}
        onAmount={(v) => set('otherAssets', v)}
      />

      <Subtotal label="現在の総資産" value={totalAssets} color="#34d399" />

      {/* ===== 毎月の積立 ===== */}
      <SectionTitle>毎月の積立</SectionTitle>

      <ContribRow
        label="自分のNISA積立" note="上限10万" placeholder="例：5"
        amount={inputs.monthlyNisaSelf}
        onAmount={(v) => set('monthlyNisaSelf', v)}
        rate={inputs.nisaSelfRate}
        onRate={(v) => set('nisaSelfRate', v)}
        max={10}
      />
      <ContribRow
        label="配偶者のNISA積立" note="上限10万" placeholder="例：5"
        amount={inputs.monthlyNisaSpouse}
        onAmount={(v) => set('monthlyNisaSpouse', v)}
        rate={inputs.nisaSpouseRate}
        onRate={(v) => set('nisaSpouseRate', v)}
        max={10}
      />
      <ContribRow
        label="子どものNISA積立" note="年60万・上限600万" placeholder="例：5"
        amount={inputs.monthlyNisaChild}
        onAmount={(v) => set('monthlyNisaChild', v)}
        rate={inputs.nisaChildRate}
        onRate={(v) => set('nisaChildRate', v)}
        max={5}
      />
      <ContribRow
        label="成長投資枠（自分）" note="上限20万" placeholder="例：10"
        amount={inputs.monthlyGrowth}
        onAmount={(v) => set('monthlyGrowth', v)}
        max={20}
        rate={inputs.growthRate}
        onRate={(v) => set('growthRate', v)}
      />
      <ContribRow
        label="成長投資枠（配偶者）" note="上限20万" placeholder="例：10"
        amount={inputs.monthlyGrowthSpouse}
        onAmount={(v) => set('monthlyGrowthSpouse', v)}
        max={20}
        rate={inputs.growthSpouseRate}
        onRate={(v) => set('growthSpouseRate', v)}
      />

      <Subtotal label="月の積立合計" value={monthlyContribs} suffix="円/月" color="#f59e0b" />

      {/* ===== FIRE（取り崩し）===== */}
      <SectionTitle>FIRE・取り崩し</SectionTitle>
      <NumInput
        label="取り崩し開始年齢" unit="歳" placeholder="例：55（0で無効）"
        value={inputs.fireAge}
        onChange={(v) => set('fireAge', Math.max(0, Math.min(89, v || 0)))}
        min={0} max={89}
        note="運用資産の4%/年"
      />
      <NumInput
        label="取り崩し後の収入" unit="万円/月" placeholder="0＝完全FIRE"
        value={inputs.sideFireIncome}
        onChange={(v) => set('sideFireIncome', Math.max(0, v || 0))}
        min={0} step={0.5}
        note="サイドFIRE"
      />

      {/* ===== 月の収支 ===== */}
      <SectionTitle>月の収支</SectionTitle>

      <NumInput
        label="月の手取り" unit="万円/月" placeholder="例：30"
        value={inputs.monthlyIncome}
        onChange={(v) => set('monthlyIncome', v)}
        min={0} step={0.5}
      />
      <NumInput
        label="毎月の支出" unit="万円/月" placeholder="例：20"
        value={inputs.monthlyExpenses}
        onChange={(v) => set('monthlyExpenses', v)}
        min={0} step={0.5}
      />

      {/* ===== 年金 ===== */}
      <SectionTitle>年金</SectionTitle>
      <NumInput
        label="受給開始年齢" unit="歳" placeholder="65"
        value={inputs.pensionStartAge}
        onChange={(v) => set('pensionStartAge', Math.max(60, Math.min(89, v || 65)))}
        min={60} max={89}
      />
      <NumInput
        label="自分の年金" unit="万円/月" placeholder="例：15"
        value={inputs.pensionSelf}
        onChange={(v) => set('pensionSelf', Math.max(0, v || 0))}
        min={0} step={0.1}
      />
      <NumInput
        label="配偶者の年金" unit="万円/月" placeholder="例：10"
        value={inputs.pensionSpouse}
        onChange={(v) => set('pensionSpouse', Math.max(0, v || 0))}
        min={0} step={0.1}
      />

      <div className={`inp-balance ${monthlyLeft < 0 ? 'inp-balance--neg' : ''}`}>
        <span className="inp-balance-label">月の残り</span>
        <span className="inp-balance-value">
          {monthlyLeft >= 0 ? '+' : ''}{monthlyLeft.toFixed(1)}万円
        </span>
      </div>
    </div>
  );
}
