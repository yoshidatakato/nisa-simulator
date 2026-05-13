import React, { useRef, useEffect } from 'react';
import { formatMan, NISA_CAP, NISA_CAP_CHILD } from '../utils/simulation';

const THIS_YEAR = new Date().getFullYear();

export default function AssetTable({ data, currentAge, spouseAge, selfFullAge, spouseFullAge, childFullAge }) {
  const currentRef = useRef(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [currentAge]);

  if (!data?.length) return null;

  // 配偶者の実年齢
  const spouseAgeAt = (selfAge) =>
    spouseAge > 0 ? spouseAge + (selfAge - currentAge) : null;

  return (
    <div className="table-card">
      {/* NISA満額情報バー */}
      <div className="nisa-full-bar">
        <span className="nfb nfb--self">
          自分NISA満額：
          {selfFullAge != null
            ? <strong>{selfFullAge}歳（{THIS_YEAR + selfFullAge - currentAge}年）</strong>
            : <span className="nfb-none">未到達</span>}
        </span>
        <span className="nfb nfb--spouse">
          配偶者NISA満額：
          {spouseFullAge != null
            ? <strong>
                {spouseAge > 0
                  ? `配偶者${spouseAgeAt(spouseFullAge)}歳`
                  : `自分${spouseFullAge}歳`}
                （{THIS_YEAR + spouseFullAge - currentAge}年）
              </strong>
            : <span className="nfb-none">未到達</span>}
        </span>
        <span className="nfb nfb--child">
          子どもNISA満額（{NISA_CAP_CHILD}万）：
          {childFullAge != null
            ? <strong>自分{childFullAge}歳時（{THIS_YEAR + childFullAge - currentAge}年）</strong>
            : <span className="nfb-none">未到達</span>}
        </span>
      </div>

      <div className="table-scroll">
        <table className="asset-table">
          <thead>
            <tr>
              <th>西暦</th>
              <th>年齢</th>
              <th>総資産</th>
              <th>現金</th>
              <th>自分NISA</th>
              <th>配偶者NISA</th>
              <th>子どもNISA</th>
              <th>成長投資枠</th>
              <th>運用資産</th>
              <th>その他</th>
              <th className="th-fire">年間取り崩し<br /><span style={{fontWeight:400,fontSize:'0.68rem'}}>（月換算）</span></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const isCurrent    = row.age === currentAge;
              const isSelfFull   = row.age === selfFullAge;
              const isSpouseFull = row.age === spouseFullAge;
              const isChildFull  = row.age === childFullAge;

              return (
                <tr
                  key={row.age}
                  ref={isCurrent ? currentRef : null}
                  className={[
                    isCurrent    ? 'trow--current'     : '',
                    isSelfFull   ? 'trow--self-full'   : '',
                    isSpouseFull ? 'trow--spouse-full' : '',
                    isChildFull  ? 'trow--child-full'  : '',
                  ].filter(Boolean).join(' ') || undefined}
                >
                  <td className="td-muted">
                    {THIS_YEAR + (row.age - currentAge)}
                  </td>
                  <td className="td-age">
                    {isCurrent && <span className="td-now-dot" />}
                    {row.age}歳
                    {isSelfFull   && <span className="td-badge td-badge--self">自分満額</span>}
                    {isSpouseFull && <span className="td-badge td-badge--spouse">
                      {spouseAge > 0 ? `配偶者${spouseAgeAt(spouseFullAge)}歳満額` : '配偶者満額'}
                    </span>}
                    {isChildFull  && <span className="td-badge td-badge--child">子ども満額</span>}
                  </td>
                  <td className="td-total">{formatMan(row.total)}円</td>
                  <td className={row.cash < 0 ? 'td-neg' : 'td-num'}>
                    {formatMan(row.cash)}円
                  </td>
                  <td className="td-num">
                    {formatMan(row.selfNisa)}円
                    {isSelfFull && <span className="td-badge td-badge--self">満額</span>}
                  </td>
                  <td className="td-num">
                    {formatMan(row.spouseNisa)}円
                    {isSpouseFull && <span className="td-badge td-badge--spouse">満額</span>}
                  </td>
                  <td className="td-num">
                    {formatMan(row.childNisa)}円
                    {isChildFull && <span className="td-badge td-badge--child">満額</span>}
                  </td>
                  <td className="td-num">{formatMan(row.growth)}円</td>
                  <td className="td-num">{formatMan(row.invest)}円</td>
                  <td className="td-num">{formatMan(row.other)}円</td>
                  <td className={row.annualWithdrawal > 0 ? 'td-fire' : 'td-muted'}>
                    {row.annualWithdrawal > 0 ? (
                      <>
                        {formatMan(row.annualWithdrawal)}円
                        <br />
                        <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                          ({formatMan(Math.round(row.annualWithdrawal / 12))}円/月)
                        </span>
                      </>
                    ) : '—'}
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
