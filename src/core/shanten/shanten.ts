import { Tile } from '../types/tile';
import { ShantenResult } from '../types/shanten';
import { tilesToCountArray } from '../hand/hand';

const YAOKYU_INDICES = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

/**
 * 国士無双のシャンテン数を計算 (門前13-14枚のみ)
 */
export function calcKokushiShanten(counts: number[]): number {
  let yaokyuKinds = 0;
  let hasPair = false;

  for (const idx of YAOKYU_INDICES) {
    if (counts[idx] > 0) {
      yaokyuKinds++;
      if (counts[idx] >= 2) {
        hasPair = true;
      }
    }
  }

  return 13 - yaokyuKinds - (hasPair ? 1 : 0);
}

/**
 * 七対子のシャンテン数を計算 (門前13-14枚のみ)
 */
export function calcChiitoitsuShanten(counts: number[]): number {
  let pairs = 0;
  let kinds = 0;

  for (let i = 0; i < 34; i++) {
    if (counts[i] > 0) {
      kinds++;
      if (counts[i] >= 2) {
        pairs++;
      }
    }
  }

  return 6 - pairs + Math.max(0, 7 - kinds);
}

interface SuitAnalysisResult {
  mentsu: number;
  tatsu: number;
}

/**
 * 数牌(萬子/筒子/索子の各9枚)の面子・塔子数を再帰探索
 */
function analyzeSuit(counts: number[], offset: number, index: number, mentsu: number, tatsu: number, bestResults: SuitAnalysisResult[]) {
  if (index >= 9) {
    bestResults.push({ mentsu, tatsu });
    return;
  }

  const c = counts[offset + index];
  if (c === 0) {
    analyzeSuit(counts, offset, index + 1, mentsu, tatsu, bestResults);
    return;
  }

  // 1. 刻子 (3枚)
  if (c >= 3) {
    counts[offset + index] -= 3;
    analyzeSuit(counts, offset, index, mentsu + 1, tatsu, bestResults);
    counts[offset + index] += 3;
  }

  // 2. 順子 (index, index+1, index+2)
  if (index <= 6 && counts[offset + index] >= 1 && counts[offset + index + 1] >= 1 && counts[offset + index + 2] >= 1) {
    counts[offset + index] -= 1;
    counts[offset + index + 1] -= 1;
    counts[offset + index + 2] -= 1;
    analyzeSuit(counts, offset, index, mentsu + 1, tatsu, bestResults);
    counts[offset + index] += 1;
    counts[offset + index + 1] += 1;
    counts[offset + index + 2] += 1;
  }

  // 3. 塔子: 対子 (2枚)
  if (c >= 2) {
    counts[offset + index] -= 2;
    analyzeSuit(counts, offset, index, mentsu, tatsu + 1, bestResults);
    counts[offset + index] += 2;
  }

  // 4. 塔子: 順子塔子 (両面/辺張: index, index+1)
  if (index <= 7 && counts[offset + index] >= 1 && counts[offset + index + 1] >= 1) {
    counts[offset + index] -= 1;
    counts[offset + index + 1] -= 1;
    analyzeSuit(counts, offset, index, mentsu, tatsu + 1, bestResults);
    counts[offset + index] += 1;
    counts[offset + index + 1] += 1;
  }

  // 5. 塔子: 嵌張 (index, index+2)
  if (index <= 6 && counts[offset + index] >= 1 && counts[offset + index + 2] >= 1) {
    counts[offset + index] -= 1;
    counts[offset + index + 2] -= 1;
    analyzeSuit(counts, offset, index, mentsu, tatsu + 1, bestResults);
    counts[offset + index] += 1;
    counts[offset + index + 2] += 1;
  }

  // 6. 何も作らず次へスキップ (孤立牌として扱う)
  analyzeSuit(counts, offset, index + 1, mentsu, tatsu, bestResults);
}

/**
 * 1スート（萬子/筒子/索子）から最適な (mentsu, tatsu) の組み合わせ一覧を抽出
 */
function getSuitCombinations(counts: number[], offset: number): SuitAnalysisResult[] {
  const results: SuitAnalysisResult[] = [];
  const tempCounts = [...counts];
  analyzeSuit(tempCounts, offset, 0, 0, 0, results);

  if (results.length === 0) return [{ mentsu: 0, tatsu: 0 }];

  const bestMap = new Map<number, number>();
  for (const r of results) {
    const currentMax = bestMap.get(r.mentsu) ?? -1;
    if (r.tatsu > currentMax) {
      bestMap.set(r.mentsu, r.tatsu);
    }
  }

  const pruned: SuitAnalysisResult[] = [];
  bestMap.forEach((tatsu, mentsu) => {
    pruned.push({ mentsu, tatsu });
  });
  return pruned;
}

/**
 * 字牌の面子・対子数を集計
 */
function getHonorCombinations(counts: number[]): SuitAnalysisResult {
  let mentsu = 0;
  let tatsu = 0;
  for (let i = 27; i < 34; i++) {
    if (counts[i] >= 3) {
      mentsu++;
    } else if (counts[i] === 2) {
      tatsu++;
    }
  }
  return { mentsu, tatsu };
}

/**
 * 面子手（一般形：targetMentsu面子 + 1雀頭）のシャンテン数を計算
 * 手牌枚数 (13, 10, 7, 4 または 14, 11, 8, 5) に対応
 */
export function calcMentsuShanten(counts: number[]): number {
  const totalTiles = counts.reduce((sum, c) => sum + c, 0);
  const targetMentsu = Math.min(4, Math.floor(totalTiles / 3));
  const baseShanten = 2 * targetMentsu; // 例: 4面子手なら8, 3面子手なら6, 2面子手なら4

  let minShanten = baseShanten;

  // 1. 雀頭なしの場合のシャンテン数計算
  const evalWithoutHead = (c: number[]) => {
    const manList = getSuitCombinations(c, 0);
    const pinList = getSuitCombinations(c, 9);
    const souList = getSuitCombinations(c, 18);
    const honor = getHonorCombinations(c);

    for (const m of manList) {
      for (const p of pinList) {
        for (const s of souList) {
          const totalMentsu = m.mentsu + p.mentsu + s.mentsu + honor.mentsu;
          const rawTatsu = m.tatsu + p.tatsu + s.tatsu + honor.tatsu;
          const validTatsu = Math.min(rawTatsu, Math.max(0, targetMentsu - totalMentsu));
          const shanten = baseShanten - 2 * totalMentsu - validTatsu;
          if (shanten < minShanten) {
            minShanten = shanten;
          }
        }
      }
    }
  };

  evalWithoutHead(counts);

  // 2. 雀頭ありの場合 (counts[i] >= 2 の牌を雀頭として抜く)
  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 2) {
      counts[i] -= 2;
      const manList = getSuitCombinations(counts, 0);
      const pinList = getSuitCombinations(counts, 9);
      const souList = getSuitCombinations(counts, 18);
      const honor = getHonorCombinations(counts);

      for (const m of manList) {
        for (const p of pinList) {
          for (const s of souList) {
            const totalMentsu = m.mentsu + p.mentsu + s.mentsu + honor.mentsu;
            const rawTatsu = m.tatsu + p.tatsu + s.tatsu + honor.tatsu;
            const validTatsu = Math.min(rawTatsu, Math.max(0, targetMentsu - totalMentsu));
            const shanten = baseShanten - 2 * totalMentsu - validTatsu - 1; // 雀頭分 -1
            if (shanten < minShanten) {
              minShanten = shanten;
            }
          }
        }
      }
      counts[i] += 2;
    }
  }

  return minShanten;
}

/**
 * 手牌(Tile[] または number[34])から総合シャンテン数と詳細を計算
 */
export function calcShanten(tilesOrCounts: Tile[] | number[]): ShantenResult {
  const counts = Array.isArray(tilesOrCounts) && typeof tilesOrCounts[0] === 'number'
    ? (tilesOrCounts as number[])
    : tilesToCountArray(tilesOrCounts as Tile[]);

  const totalTiles = counts.reduce((sum, c) => sum + c, 0);
  const isMenzenCount = totalTiles === 13 || totalTiles === 14;

  const mentsuShanten = calcMentsuShanten(counts);
  const chiitoiShanten = isMenzenCount ? calcChiitoitsuShanten(counts) : 99;
  const kokushiShanten = isMenzenCount ? calcKokushiShanten(counts) : 99;

  const minShanten = Math.min(mentsuShanten, chiitoiShanten, kokushiShanten);

  return {
    shanten: minShanten,
    isMentsuHand: minShanten === mentsuShanten,
    isChiitoitsu: isMenzenCount && minShanten === chiitoiShanten,
    isKokushi: isMenzenCount && minShanten === kokushiShanten,
    mentsuShanten,
    chiitoiShanten,
    kokushiShanten,
  };
}
