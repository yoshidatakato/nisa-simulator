import React, { useRef, useEffect } from 'react';
import { formatMan } from '../utils/simulation';

const THIS_YEAR = new Date().getFullYear();

export default function LifePlanTable({
  chartData,
  currentAge,
  monthlyIncome,
  fixedCosts,
  variableEvents,
  nisaTotal,
}) {
  const currentRowRef = useRef(null);

  // 固定費月額合計
  const fixedTotal = Object.values(fixedCosts).reduce((s, v) => s + (Number(v) || 0), 0);

  // 年間固定値
  const annualIncome = monthlyIncome * 12;
  const annualFixed  = fixedTotal * 12;
  const annualNisa   = nisaTotal * 12;

  // マウント時に現在年齢行へスクロール
  useEffect(() => {
    if (currentRowRef.current) {
      currentRowRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [currentAge]);

  return (
    <div className="lifeplan-wrap">
      <div className="lifeplan-scroll">
        <table className="lifeplan-table">
          <thead>
            <tr>
              <th className="lpt-th lpt-th--age">年齢</th>
              <th className="lpt-th lpt-th--year">西暦</th>
              <th className="lpt-th lpt-th--num">年収</th>
              <th className="lpt-th lpt-th--num">固定費合計</th>
              <th className="lpt-th lpt-th--event">変動費イベント</th>
              <th className="lpt-th lpt-th--num">NISA積立</th>
              <th className="lpt-th lpt-th--num">年間収支</th>
              <th className="lpt-th lpt-th--num">総資産（5%）</th>
              <th className="lpt-th lpt-th--num lpt-th--main">総資産（7%）</th>
              <th className="lpt-th lpt-th--num">総資産（10%）</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row) => {
              const isCurrent  = row.age === currentAge;
              const isNegative = row.annualFlow < 0;

              // その年齢に紐づく変動費イベント
              const eventsThisYear = (variableEvents || []).filter(
                (ev) => Number(ev.age) === row.age && Number(ev.amount) > 0
              );
              const eventsTotal = eventsThisYear.reduce((s, ev) => s + Number(ev.amount), 0);
              const eventsLabel = eventsThisYear
                .map((ev) => ev.label || '支出')
                .join('、');

              return (
                <tr
                  key={row.age}
                  ref={isCurrent ? currentRowRef : null}
                  className={[
                    'lpt-row',
                    isCurrent  ? 'lpt-row--current'  : '',
                    isNegative ? 'lpt-row--negative' : '',
                  ].join(' ')}
                >
                  {/* 年齢 */}
                  <td className="lpt-td lpt-td--age">
                    {isCurrent && <span className="lpt-current-marker" />}
                    {row.age}歳
                  </td>

                  {/* 西暦 */}
                  <td className="lpt-td lpt-td--year">
                    {THIS_YEAR + (row.age - currentAge)}
                  </td>

                  {/* 年収 */}
                  <td className="lpt-td lpt-td--num">
                    {annualIncome.toLocaleString()}万
                  </td>

                  {/* 固定費合計 */}
                  <td className="lpt-td lpt-td--num">
                    {annualFixed > 0 ? `${annualFixed.toFixed(1)}万` : '—'}
                  </td>

                  {/* 変動費イベント */}
                  <td className="lpt-td lpt-td--event">
                    {eventsTotal > 0 ? (
                      <span className="lpt-event">
                        <span className="lpt-event-amount">
                          −{eventsTotal.toLocaleString()}万
                        </span>
                        {eventsLabel && (
                          <span className="lpt-event-label">（{eventsLabel}）</span>
                        )}
                      </span>
                    ) : (
                      <span className="lpt-dash">—</span>
                    )}
                  </td>

                  {/* NISA積立 */}
                  <td className="lpt-td lpt-td--num">
                    {annualNisa > 0 ? `${annualNisa.toFixed(1)}万` : '—'}
                  </td>

                  {/* 年間収支 */}
                  <td className={`lpt-td lpt-td--num lpt-cashflow ${row.annualFlow < 0 ? 'lpt-cashflow--neg' : 'lpt-cashflow--pos'}`}>
                    {row.annualFlow >= 0 ? '+' : ''}
                    {row.annualFlow.toLocaleString()}万
                  </td>

                  {/* 総資産 5% */}
                  <td className="lpt-td lpt-td--num lpt-asset">
                    {formatMan(row.total5)}円
                  </td>

                  {/* 総資産 7% (メイン) */}
                  <td className="lpt-td lpt-td--num lpt-asset lpt-asset--main">
                    {formatMan(row.total7)}円
                  </td>

                  {/* 総資産 10% */}
                  <td className="lpt-td lpt-td--num lpt-asset">
                    {formatMan(row.total10)}円
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
