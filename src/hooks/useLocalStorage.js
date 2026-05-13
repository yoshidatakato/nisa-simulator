import { useState, useEffect } from 'react';

/**
 * useState と同じ API で、値を localStorage に自動保存・復元するカスタムフック。
 *
 * - 初回マウント時に localStorage から読み込む
 * - defaultValue がオブジェクト（非配列）の場合は、保存値と defaults をマージ
 *   → フィールド追加などのスキーマ変更に自動対応
 * - 値が変わるたびに localStorage へ書き込む
 * - JSON のパースや書き込みに失敗しても例外を出さず、デフォルト値で動作継続
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;

      const parsed = JSON.parse(raw);

      // オブジェクト（非配列）のとき：デフォルトとマージして新しいキーを補完
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        typeof defaultValue === 'object' &&
        !Array.isArray(defaultValue)
      ) {
        return { ...defaultValue, ...parsed };
      }

      return parsed;
    } catch {
      return defaultValue;
    }
  });

  // 値が変わるたびに保存
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage が使えない環境（プライベートブラウジング等）では無視
    }
  }, [key, value]);

  return [value, setValue];
}
