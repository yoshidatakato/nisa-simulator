import React, { useState } from 'react';
import AssetChart from './AssetChart';
import { formatMan } from '../utils/simulation';

const THIS_YEAR = new Date().getFullYear();

const ITEMS = [
  { key: 'cash',        label: '現金',       color: '#94a3b8' },
  { key: 'selfNisa',    label: '自分NISA',   color: '#34d399' },
  { key: 'selfGrowth',  label: '自分成長枠', color: '#2dd4bf' },
  { key: 'spouseNisa',  label: '配偶者NISA', color: '#a78bfa' },
  { key: 'spouseGrowth',label: '配偶者成長枠',color: '#c4b5fd' },
  { key: 'childNisa',   label: '子NISA',     color: '#fb923c' },
  { key: 'invest',      label: '運用資産',   color: '#f59e0b' },
  { key: 'other',       label: 'その他',     color: '#60a5fa' },
];

export default function MobileChartPanel({
  data, inputs, selfFullAge, spouseFullAge, childFullAge,
}) {
  const minAge = data?.[0]?.age ?? inputs.currentAge;
  const maxAge = data?.[data.length - 1]?.age ?? 90;

  const [selectedAge, setSelectedAge] = useState(inputs.currentAge);
  const row = data?.find((r) => r.age === selectedAge) ?? data?.[0] ?? {};
  const year = THIS_YEAR + (selectedAge - inputs.currentAge);

  // グラフ高さ：画面の約38%
  const chartH = Math.max(180, Math.round(window.innerHeight * 0.38));

  return (
    <div className="mcp-wrap">
      {/* ── グラフ ── */}
      <div className="mcp-chart-area">
        <AssetChart
          data={data}
          currentAge={inputs.currentAge}
          spouseAge={inputs.spouseAge}
          fireAge={inputs.fireAge}
          selfFullAge={selfFullAge}
          spouseFullAge={spouseFullAge}
          childFullAge={childFullAge}
          chartHeight={chartH}
          highlightAge={selectedAge}
        />
      </div>

      {/* ── 資産内訳 ── */}
      <div className="mcp-breakdown">
        <div className="mcp-bd-header">
          <div className="mcp-bd-age">
            {selectedAge}歳
            <span className="mcp-bd-year">（{year}年）</span>
          </div>
          <div className="mcp-bd-total">{formatMan(row.total)}円</div>
        </div>
        <div className="mcp-bd-grid">
          {ITEMS.map(({ key, label, color }) => (
            <div key={key} className="mcp-bd-item">
              <span className="mcp-bd-dot" style={{ background: color }} />
              <span className="mcp-bd-label">{label}</span>
              <span className="mcp-bd-val">{formatMan(row[key] ?? 0)}円</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 年齢スライダー ── */}
      <div className="mcp-slider-wrap">
        <span className="mcp-sl-edge">{minAge}歳</span>
        <input
          className="mcp-slider"
          type="range"
          min={minAge}
          max={maxAge}
          value={selectedAge}
          onChange={(e) => setSelectedAge(Number(e.target.value))}
        />
        <span className="mcp-sl-edge">{maxAge}歳</span>
      </div>
    </div>
  );
}
