import React, { useMemo, useState, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import InputPanel from './components/InputPanel';
import AssetChart from './components/AssetChart';
import AssetTable from './components/AssetTable';
import HomeTab from './components/HomeTab';
import { simulate } from './utils/simulation';

const DEFAULT_INPUTS = {
  currentAge:          30,
  spouseAge:            0,   // 配偶者の年齢（0=未設定）
  cashSavings:          0,
  nisaBalance:          0,
  nisaRate:           0.05,
  investBalance:        0,
  investRate:         0.05,
  otherAssets:          0,
  monthlyNisaSelf:      0,
  nisaSelfRate:       0.05,
  monthlyNisaSpouse:    0,
  nisaSpouseRate:     0.05,
  monthlyNisaChild:     0,   // 子どものNISA積立
  nisaChildRate:      0.05,
  monthlyGrowth:        0,   // 自分の成長投資枠
  growthRate:         0.05,
  monthlyGrowthSpouse:  0,   // 配偶者の成長投資枠
  growthSpouseRate:   0.05,
  monthlyIncome:        0,
  monthlyExpenses:      0,
  pensionSelf:          0,   // 自分の年金月額
  pensionSpouse:        0,   // 配偶者の年金月額
  pensionStartAge:     65,   // 受給開始年齢
  fireAge:              0,   // 取り崩し開始年齢（0=無効）
  sideFireIncome:       0,   // サイドFIRE収入・月額（0=完全FIRE）
};

const MIN_CHART_H = 150;
const DEFAULT_CHART_H = 400;

const TABS = [
  { id: 'home',  label: 'ホーム',  icon: '🏠' },
  { id: 'input', label: '入力',    icon: '✏️'  },
  { id: 'chart', label: 'グラフ',  icon: '📈' },
  { id: 'table', label: '表',      icon: '📋' },
];

export default function App() {
  const [inputs, setInputs] = useLocalStorage('lp3_inputs', DEFAULT_INPUTS);
  const set = (key, val) => setInputs((p) => ({ ...p, [key]: val }));

  const { data, selfFullAge, spouseFullAge, childFullAge } = useMemo(
    () => simulate(inputs),
    [inputs],
  );

  const [chartHeight, setChartHeight] = useState(DEFAULT_CHART_H);
  const [mobileTab, setMobileTab] = useState('home');

  const startDrag = (clientY) => {
    const startY = clientY;
    const startH = chartHeight;
    const onMove = (y) => setChartHeight(Math.max(MIN_CHART_H, startH + (y - startY)));
    const onMouseMove = (e) => onMove(e.clientY);
    const onTouchMove = (e) => { e.preventDefault(); onMove(e.touches[0].clientY); };
    const cleanup = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   cleanup);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend',  cleanup);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   cleanup);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend',  cleanup);
  };

  return (
    <div className="app">
      <div className="app-layout" data-tab={mobileTab}>

        {/* ── サイドバー（入力）── */}
        <aside className="sidebar panel-input">
          <InputPanel inputs={inputs} set={set} />
        </aside>

        {/* ── メインエリア ── */}
        <main className="main-area panel-main">
          {/* モバイルホームタブ */}
          <div className="panel-home">
            <HomeTab
              data={data}
              inputs={inputs}
              selfFullAge={selfFullAge}
              spouseFullAge={spouseFullAge}
              childFullAge={childFullAge}
            />
          </div>

          {/* グラフ */}
          <div className="panel-chart">
            <AssetChart
              data={data}
              currentAge={inputs.currentAge}
              spouseAge={inputs.spouseAge}
              fireAge={inputs.fireAge}
              selfFullAge={selfFullAge}
              spouseFullAge={spouseFullAge}
              childFullAge={childFullAge}
              chartHeight={chartHeight}
            />
            <div
              className="resize-divider"
              onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientY); }}
              onTouchStart={(e) => startDrag(e.touches[0].clientY)}
            />
          </div>

          {/* 表 */}
          <div className="panel-table">
            <AssetTable
              data={data}
              currentAge={inputs.currentAge}
              spouseAge={inputs.spouseAge}
              selfFullAge={selfFullAge}
              spouseFullAge={spouseFullAge}
              childFullAge={childFullAge}
            />
          </div>
        </main>
      </div>

      {/* モバイル専用タブナビゲーション */}
      <nav className="tab-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${mobileTab === t.id ? 'tab-btn--active' : ''}`}
            onClick={() => setMobileTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
