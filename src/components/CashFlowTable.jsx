import React, { useState } from 'react';
import { formatMan } from '../utils/simulation';

export default function CashFlowTable({ cashFlows }) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? cashFlows : cashFlows.slice(0, 20);

  return (
    <div className="table-container">
      <h3 className="section-title">年齢別キャッシュフロー</h3>
      <p className="section-note">※現金資産のみ（NISA除く）。赤字年は警告表示。</p>
      <div className="table-scroll">
        <table className="cf-table">
          <thead>
            <tr>
              <th>年齢</th>
              <th>年間収支</th>
              <th>現金資産累計</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isDeficit = row.cash < 0;
              const isNegFlow = row.annualFlow < 0;
              return (
                <tr key={row.age} className={isDeficit ? 'row-deficit' : ''}>
                  <td className="td-age">{row.age}歳</td>
                  <td className={`td-flow ${isNegFlow ? 'negative' : 'positive'}`}>
                    {isNegFlow ? '▼' : '▲'} {formatMan(Math.abs(row.annualFlow))}円
                  </td>
                  <td className={`td-cash ${isDeficit ? 'deficit-value' : ''}`}>
                    {isDeficit && <span className="warning-badge">赤字</span>}
                    {formatMan(row.cash)}円
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {cashFlows.length > 20 && (
        <button className="show-more-btn" onClick={() => setShowAll((v) => !v)}>
          {showAll ? '折りたたむ' : `残り${cashFlows.length - 20}件を表示`}
        </button>
      )}
    </div>
  );
}
