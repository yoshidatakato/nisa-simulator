import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { CHART_LAYERS, NISA_CAP, NISA_CAP_CHILD, formatMan } from '../utils/simulation';

function yFmt(v) {
  const abs = Math.abs(v);
  if (abs >= 10000) return `${(v / 10000).toFixed(1)}億`;
  if (abs >= 1000)  return `${(v / 1000).toFixed(0)}千万`;
  return `${v}万`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="ct-box">
      <p className="ct-age">{label}歳</p>
      <div className="ct-rows">
        <TRow color="#34d399" label="自分NISA積立"    value={d.selfNisa} />
        <TRow color="#2dd4bf" label="自分成長投資枠"  value={d.selfGrowth} />
        <TRow color="#a78bfa" label="配偶者NISA積立"  value={d.spouseNisa} />
        <TRow color="#c4b5fd" label="配偶者成長投資枠" value={d.spouseGrowth} />
        <TRow color="#fb923c" label="子どもNISA積立"  value={d.childNisa} />
        <TRow color="#f59e0b" label="運用資産"        value={d.invest} />
        <TRow color="#94a3b8" label="現金"            value={d.cash} neg={d.cash < 0} />
        <TRow color="#60a5fa" label="その他資産"      value={d.other} />
      </div>
      <hr className="ct-hr" />
      <p className="ct-total">総資産　{formatMan(d.total)}円</p>
    </div>
  );
};

function TRow({ color, label, value, neg }) {
  return (
    <p className="ct-row">
      <span className="ct-dot" style={{ background: color }} />
      <span className="ct-row-label">{label}</span>
      <span className={`ct-row-value ${neg ? 'ct-row-value--neg' : ''}`}>
        {formatMan(value)}円
      </span>
    </p>
  );
}

// 参照線ラベルのカスタムレンダラー
function RefLabel({ viewBox, text, color, yOffset = 0 }) {
  const { x, y } = viewBox;
  const tx = x + 5;
  const ty = y + 14 + yOffset;
  const w  = text.length * 7 + 8;
  return (
    <g>
      <rect
        x={tx - 2}
        y={ty - 11}
        width={w}
        height={15}
        fill="#0f172acc"
        rx={3}
      />
      <text
        x={tx}
        y={ty}
        fill={color}
        fontSize={10}
        fontWeight={700}
      >
        {text}
      </text>
    </g>
  );
}

export default function AssetChart({ data, currentAge, spouseAge, fireAge, selfFullAge, spouseFullAge, childFullAge, chartHeight = 400 }) {
  if (!data?.length) return null;

  // 配偶者の実年齢に変換（spouseAge が設定されている場合）
  const spouseAgeAt = (selfAge) =>
    spouseAge > 0 ? spouseAge + (selfAge - currentAge) : selfAge;

  return (
    <div className="chart-card">
      {/* 凡例 + NISA満額バッジ */}
      <div className="chart-header">
        <div className="chart-legend">
          {CHART_LAYERS.map((l) => (
            <span key={l.key} className="chart-legend-item">
              <span className="chart-legend-swatch" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
        <div className="nisa-full-badges">
          <span className="nfb nfb--self">
            自分NISA満額：{selfFullAge != null ? `${selfFullAge}歳` : '未到達'}
          </span>
          <span className="nfb nfb--spouse">
            配偶者NISA満額：{spouseFullAge != null
              ? spouseAge > 0
                ? `配偶者${spouseAgeAt(spouseFullAge)}歳`
                : `自分${spouseFullAge}歳`
              : '未到達'}
          </span>
          <span className="nfb nfb--child">
            子どもNISA満額（{NISA_CAP_CHILD}万）：{childFullAge != null ? `自分${childFullAge}歳時` : '未到達'}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <AreaChart data={data} margin={{ top: 16, right: 16, left: 4, bottom: 4 }}>
          <defs>
            {CHART_LAYERS.map((l) => (
              <linearGradient key={l.key} id={`g-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={l.color} stopOpacity={0.85} />
                <stop offset="100%" stopColor={l.color} stopOpacity={0.40} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f30" />

          <XAxis
            dataKey="age"
            stroke="#475569"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(v) => `${v}歳`}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#475569"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={yFmt}
            width={62}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff18', strokeWidth: 1 }} />

          {/* FIRE取り崩し開始 */}
          {fireAge > 0 && fireAge > currentAge && fireAge <= 90 && (
            <ReferenceLine
              x={fireAge}
              stroke="#ef444499"
              strokeDasharray="none"
              strokeWidth={2}
              label={<RefLabel text="🔥FIRE" color="#ef4444" yOffset={0} />}
            />
          )}

          {/* 現在年齢 */}
          <ReferenceLine
            x={currentAge}
            stroke="#60a5fa55"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={<RefLabel text="現在" color="#60a5fa" yOffset={20} />}
          />

          {/* 自分NISA満額 */}
          {selfFullAge != null && selfFullAge !== currentAge && (
            <ReferenceLine
              x={selfFullAge}
              stroke="#34d39988"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={<RefLabel text="自分満額" color="#34d399" yOffset={40} />}
            />
          )}

          {/* 配偶者NISA満額 */}
          {spouseFullAge != null && spouseFullAge !== currentAge && (
            <ReferenceLine
              x={spouseFullAge}
              stroke="#a78bfa88"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={<RefLabel
                text={spouseAge > 0 ? `配偶者${spouseAgeAt(spouseFullAge)}歳満額` : '配偶者満額'}
                color="#a78bfa"
                yOffset={60}
              />}
            />
          )}

          {/* 子どもNISA満額 */}
          {childFullAge != null && childFullAge !== currentAge && (
            <ReferenceLine
              x={childFullAge}
              stroke="#fb923c88"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={<RefLabel text="子ども満額" color="#fb923c" yOffset={80} />}
            />
          )}

          {/* 積み上げエリア（下から順） */}
          {CHART_LAYERS.map((l) => (
            <Area
              key={l.key}
              type="monotone"
              dataKey={l.key}
              stackId="s"
              stroke={l.color}
              strokeWidth={1}
              fill={`url(#g-${l.key})`}
              name={l.label}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
