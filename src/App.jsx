import React, { useMemo, useState, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import InputPanel from './components/InputPanel';
import AssetChart from './components/AssetChart';
import AssetTable from './components/AssetTable';
import HomeTab from './components/HomeTab';
import MobileChartPanel from './components/MobileChartPanel';
import { simulate } from './utils/simulation';

const DEFAULT_INPUTS = {
  currentAge:          30,
  spouseAge:            0,   // 配偶者の年齢（0=未設定）
  cashSavings:          0,
  nisaBalance:          0,
  nisaRate:           0.05,
  nisaSpouseBalance:    0,
  nisaSpouseBalRate:  0.05,
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

const IconHome  = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12L12 3l9 9" />
    <path d="M9 21V12h6v9" />
    <path d="M4 12v9h16v-9" />
  </svg>
);
const IconInput = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <line x1="8" y1="9"  x2="16" y2="9"  />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="12" y2="17" />
  </svg>
);
const IconChart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3"  y="12" width="4" height="9" rx="1" />
    <rect x="10" y="7"  width="4" height="14" rx="1" />
    <rect x="17" y="3"  width="4" height="18" rx="1" />
  </svg>
);
const IconTable = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3"  y1="9"  x2="21" y2="9"  />
    <line x1="3"  y1="15" x2="21" y2="15" />
    <line x1="9"  y1="9"  x2="9"  y2="21" />
    <line x1="15" y1="9"  x2="15" y2="21" />
  </svg>
);

const TABS = [
  { id: 'home',  label: 'ホーム',  Icon: IconHome  },
  { id: 'input', label: '入力',    Icon: IconInput },
  { id: 'chart', label: 'グラフ',  Icon: IconChart },
  { id: 'table', label: '表',      Icon: IconTable },
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

          {/* グラフ（PC: リサイズ可能なAssetChart / モバイル: MobileChartPanel） */}
          <div className="panel-chart">
            {/* PC用 */}
            <div className="panel-chart-pc">
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
            {/* モバイル用 */}
            <div className="panel-chart-mobile">
              <MobileChartPanel
                data={data}
                inputs={inputs}
                selfFullAge={selfFullAge}
                spouseFullAge={spouseFullAge}
                childFullAge={childFullAge}
              />
            </div>
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
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`tab-btn ${mobileTab === id ? 'tab-btn--active' : ''}`}
            onClick={() => setMobileTab(id)}
          >
            <span className="tab-icon"><Icon /></span>
            <span className="tab-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
