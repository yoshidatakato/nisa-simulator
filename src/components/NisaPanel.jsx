import React from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { RATE_COLORS, RATE_LABELS, NISA_MAX, formatMan } from '../utils/simulation';

// 5%=index1, 7%=index2, 10%=index3
const PANEL_RATES = [
  { rateIdx: 1, label: RATE_LABELS[1], color: RATE_COLORS[1], nisaKey: 'nisa5',  isMain: false },
  { rateIdx: 2, label: RATE_LABELS[2], color: RATE_COLORS[2], nisaKey: 'nisa7',  isMain: true  },
  { rateIdx: 3, label: RATE_LABELS[3], color: RATE_COLORS[3], nisaKey: 'nisa10', isMain: false },
];

function yAxisFormatter(value) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}億`;
  if (value >= 1000)  return `${(value / 1000).toFixed(0)}千万`;
  return `${value}万`;
}

const NisaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const seen = new Set();
  const entries = payload.filter((e) => {
    if (seen.has(e.name)) return false;
    seen.add(e.name);
    return true;
  });
  return (
    <div className="chart-tooltip">
      <p className="tooltip-age">{label}歳</p>
      {entries.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.stroke }} className="tooltip-row">
          <span>{entry.name}</span>
          <span>{formatMan(entry.value)}円</span>
        </p>
      ))}
    </div>
  );
};

export default function NisaPanel({
  nisaByRate, chartData, monthlyNisa, nisaMax = NISA_MAX,
  selectedYear, maxYear, onYearChange, currentAge,
}) {
  const clampedNisa   = Math.max(0, monthlyNisa || 0);
  const selectedIdx   = Math.min(selectedYear - 1, chartData.length - 1);
  const labelAge      = currentAge + selectedYear;        // ラベル用（○年後＝△歳）
  const refAge        = currentAge + selectedYear - 1;    // グラフの参照線
  const pct           = maxYear > 1 ? ((selectedYear - 1) / (maxYear - 1)) * 100 : 0;

  const principal     = chartData[selectedIdx]?.principal ?? 0;

  const monthsToFull  = clampedNisa > 0 ? Math.ceil(nisaMax / clampedNisa) : null;
  const yearsToFull   = monthsToFull ? (monthsToFull / 12).toFixed(1) : null;

  return (
    <div className="nisa-panel">
      <h3 className="section-title">NISA積立シミュレーション</h3>

      {/* ===== 共有スライダー ===== */}
      <div className="tab-slider-row">
        <input
          type="range"
          className="year-slider"
          min="1"
          max={maxYear}
          value={selectedYear}
          style={{ '--pct': `${pct}%` }}
          onChange={(e) => onYearChange(Number(e.target.value))}
        />
        <span className="year-slider-label">{selectedYear}年後（{labelAge}歳）</span>
      </div>

      {/* ===== 3カードサマリー ===== */}
      <div className="nisa-rate-cards">
        {PANEL_RATES.map((r) => {
          const nisaVal    = chartData[selectedIdx]?.[r.nisaKey] ?? 0;
          const gain       = Math.max(0, nisaVal - principal);
          const growthRate = principal > 0 ? Math.round((gain / principal) * 100) : 0;
          const fullAge    = nisaByRate[r.rateIdx]?.fullContribAge;

          return r.isMain ? (
            <div key={r.label} className="nisa-rate-card nisa-rate-card--main" style={{ borderColor: r.color }}>
              <div className="nrc-badge">メイン</div>
              <div className="nrc-rate nrc-rate--lg" style={{ color: r.color }}>利回り {r.label}</div>
              <div className="nrc-value nrc-value--lg">{formatMan(nisaVal)}円</div>
              <div className="nrc-label">{selectedYear}年後（{labelAge}歳時点）</div>
              <div className="nrc-gain nrc-gain--lg" style={{ color: r.color }}>+{formatMan(gain)}円</div>
              <div className="nrc-pct nrc-pct--lg">増加率 +{growthRate}%</div>
              <div className="nrc-goal">満額達成: {fullAge ?? '—'}歳</div>
            </div>
          ) : (
            <div key={r.label} className="nisa-rate-card nisa-rate-card--sub" style={{ borderLeftColor: r.color }}>
              <div className="nrc-rate" style={{ color: r.color }}>利回り {r.label}</div>
              <div className="nrc-value">{formatMan(nisaVal)}円</div>
              <div className="nrc-label">{selectedYear}年後（{labelAge}歳時点）</div>
              <div className="nrc-gain" style={{ color: r.color }}>+{formatMan(gain)}円</div>
              <div className="nrc-pct">増加率 +{growthRate}%</div>
              <div className="nrc-goal">満額達成: {fullAge ?? '—'}歳</div>
            </div>
          );
        })}
      </div>

      {/* ===== 数値サマリーグリッド ===== */}
      <div className="nisa-stats-grid">
        <div className="nisa-stat">
          <div className="nisa-stat-label">累計積立元本</div>
          <div className="nisa-stat-value">{formatMan(principal)}円</div>
        </div>
        {[
          { label: '運用益（7%）', key: 'nisa7',  color: RATE_COLORS[2], highlight: true  },
          { label: '増加率（7%）', key: 'nisa7',  color: RATE_COLORS[2], highlight: true, pct: true },
          { label: '運用益（5%）', key: 'nisa5',  color: RATE_COLORS[1], highlight: false },
          { label: '増加率（5%）', key: 'nisa5',  color: RATE_COLORS[1], highlight: false, pct: true },
          { label: '運用益（10%）',key: 'nisa10', color: RATE_COLORS[3], highlight: false },
        ].map((s) => {
          const v    = chartData[selectedIdx]?.[s.key] ?? 0;
          const gain = Math.max(0, v - principal);
          const rate = principal > 0 ? Math.round((gain / principal) * 100) : 0;
          return (
            <div key={s.label} className={`nisa-stat ${s.highlight ? 'nisa-stat--highlight' : ''}`}>
              <div className="nisa-stat-label">{s.label}</div>
              <div className="nisa-stat-value" style={{ color: s.color }}>
                {s.pct ? `+${rate}%` : `+${formatMan(gain)}円`}
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== 積み上げ面グラフ ===== */}
      <div className="chart-section-header">
        <span className="chart-section-label">元本・運用益の内訳推移</span>
        <div className="chart-legend-inline">
          <span className="cli-item">
            <span className="cli-swatch" style={{ background: '#475569' }} />元本
          </span>
          <span className="cli-item">
            <span className="cli-swatch" style={{ background: RATE_COLORS[2] }} />運用益7%
          </span>
          <span className="cli-item">
            <span className="cli-dash" style={{ borderColor: RATE_COLORS[1] }} />5%
          </span>
          <span className="cli-item">
            <span className="cli-dash" style={{ borderColor: RATE_COLORS[3] }} />10%
          </span>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <defs>
              <linearGradient id="gradPrincipal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#475569" stopOpacity={0.95} />
                <stop offset="95%" stopColor="#334155" stopOpacity={0.8}  />
              </linearGradient>
              <linearGradient id="gradGain7" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={RATE_COLORS[2]} stopOpacity={0.85} />
                <stop offset="95%" stopColor={RATE_COLORS[2]} stopOpacity={0.35} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="age" stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(v) => `${v}歳`}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={yAxisFormatter} width={56}
            />
            <Tooltip content={<NisaTooltip />} />
            <ReferenceLine x={refAge} stroke="#ffffff33" strokeDasharray="4 4" strokeWidth={1.5} />

            {/* スタック: 元本 + 運用益(7%) */}
            <Area
              type="monotone" dataKey="principal" name="元本"
              stackId="stack"
              fill="url(#gradPrincipal)" stroke="#64748b" strokeWidth={0}
            />
            <Area
              type="monotone" dataKey="gain7" name="運用益(7%)"
              stackId="stack"
              fill="url(#gradGain7)" stroke={RATE_COLORS[2]} strokeWidth={1.5}
            />

            {/* 参考線: 5% と 10% */}
            <Line
              type="monotone" dataKey="nisa5" name="利回り5%"
              stroke={RATE_COLORS[1]} dot={false}
              strokeDasharray="6 3" strokeWidth={1.5}
            />
            <Line
              type="monotone" dataKey="nisa10" name="利回り10%"
              stroke={RATE_COLORS[3]} dot={false}
              strokeDasharray="6 3" strokeWidth={1.5}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 満額達成インフォ */}
      {clampedNisa > 0 && monthsToFull && (
        <div className="nisa-info-box">
          月{clampedNisa.toFixed(1)}万円 × {monthsToFull}ヶ月（約{yearsToFull}年）で生涯投資枠{nisaMax.toLocaleString()}万円に到達
        </div>
      )}
    </div>
  );
}
