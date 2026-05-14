import React from 'react';
import { formatMan } from '../utils/simulation';

const THIS_YEAR = new Date().getFullYear();

export default function HomeTab({ data, inputs }) {
  const current = data?.[0] || {};
  const total   = current.total || 0;
  const cash    = current.cash  || 0;
  const nisa    = (current.selfNisa || 0) + (current.spouseNisa || 0) + (current.childNisa || 0);
  const growth  = current.growth || 0;
  const invest  = current.invest || 0;
  const other   = current.other  || 0;

  // FIRE目標額（4%ルール：月支出×300 = 年支出×25）
  const fireTarget = (inputs.monthlyExpenses || 0) * 300;
  const fireProgress = fireTarget > 0 ? Math.min(100, (total / fireTarget) * 100) : 0;

  // FIRE到達年齢（シミュレーションデータから）
  const fireRow = inputs.fireAge > 0
    ? data?.find((r) => r.age === inputs.fireAge)
    : null;

  return (
    <div className="home-tab">

      {/* ── 総資産サマリー ── */}
      <div className="ht-card">
        <div className="ht-card-header">
          <span className="ht-card-icon">📊</span>
          <span className="ht-card-title">現在の総資産</span>
        </div>
        <div className="ht-total">{formatMan(total)}円</div>
        <div className="ht-age-note">{inputs.currentAge}歳時点（{THIS_YEAR}年）</div>

        {/* 内訳グリッド */}
        <div className="ht-breakdown">
          <div className="ht-item">
            <span className="ht-item-label">現金</span>
            <span className="ht-item-value" style={{ color: '#94a3b8' }}>{formatMan(cash)}円</span>
          </div>
          <div className="ht-item">
            <span className="ht-item-label">NISA</span>
            <span className="ht-item-value" style={{ color: '#34d399' }}>{formatMan(nisa)}円</span>
          </div>
          <div className="ht-item">
            <span className="ht-item-label">成長投資</span>
            <span className="ht-item-value" style={{ color: '#2dd4bf' }}>{formatMan(growth)}円</span>
          </div>
          <div className="ht-item">
            <span className="ht-item-label">運用資産</span>
            <span className="ht-item-value" style={{ color: '#f59e0b' }}>{formatMan(invest)}円</span>
          </div>
          <div className="ht-item">
            <span className="ht-item-label">その他</span>
            <span className="ht-item-value" style={{ color: '#60a5fa' }}>{formatMan(other)}円</span>
          </div>
        </div>
      </div>

      {/* ── FIRE進捗 ── */}
      {fireTarget > 0 && (
        <div className="ht-card">
          <div className="ht-card-header">
            <span className="ht-card-icon">🎯</span>
            <span className="ht-card-title">FIRE達成まで</span>
            {inputs.fireAge > 0 && (
              <span className="ht-fire-age-badge">{inputs.fireAge}歳目標</span>
            )}
          </div>

          <div className="ht-progress-wrap">
            <div className="ht-progress-bar">
              <div
                className="ht-progress-fill"
                style={{ width: `${fireProgress}%` }}
              />
            </div>
            <span className="ht-progress-pct">{Math.round(fireProgress)}%</span>
          </div>

          <div className="ht-progress-nums">
            <div>
              <div className="ht-pnum-label">現在</div>
              <div className="ht-pnum-value">{formatMan(total)}円</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="ht-pnum-label">目標（月支出×300）</div>
              <div className="ht-pnum-value">{formatMan(fireTarget)}円</div>
            </div>
          </div>

          {fireRow && (
            <div className="ht-fire-note">
              {inputs.fireAge}歳時点の試算総資産：
              <strong style={{ color: '#ef4444' }}> {formatMan(fireRow.total)}円</strong>
            </div>
          )}
        </div>
      )}

      {/* ── 使い方ガイド ── */}
      <div className="ht-card ht-guide">
        <div className="ht-card-header">
          <span className="ht-card-icon">📖</span>
          <span className="ht-card-title">使い方</span>
        </div>
        <ol className="ht-steps">
          <li>
            <span className="ht-step-num">1</span>
            <div>
              <strong>✏️ 入力</strong>タブで現在の資産・収入・支出・NISA積立を入力する
            </div>
          </li>
          <li>
            <span className="ht-step-num">2</span>
            <div>
              <strong>📈 グラフ</strong>タブで90歳までの資産推移を視覚的に確認する
            </div>
          </li>
          <li>
            <span className="ht-step-num">3</span>
            <div>
              <strong>📋 表</strong>タブで各年の詳細数値・NISA満額時期を確認する
            </div>
          </li>
        </ol>
      </div>

    </div>
  );
}
