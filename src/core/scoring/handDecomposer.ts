import { Tile, Meld, TileSuit } from '../types/tile';
import { HandStructure, ParsedHead, ParsedMeld } from './types';
import { tilesToCountArray } from '../hand/hand';

function tileIndexToSuitAndValue(index: number): { suit: TileSuit; value: number } {
  if (index < 9) return { suit: 'man', value: index + 1 };
  if (index < 18) return { suit: 'pin', value: index - 9 + 1 };
  if (index < 27) return { suit: 'sou', value: index - 18 + 1 };
  return { suit: 'honor', value: index - 27 + 1 };
}

function findMatchingTiles(tiles: Tile[], suit: TileSuit, value: number, count: number): Tile[] {
  const matched: Tile[] = [];
  for (const t of tiles) {
    if (t.suit === suit && t.value === value) {
      matched.push(t);
      if (matched.length === count) break;
    }
  }
  return matched;
}

/**
 * 手牌の牌と副露面子から、手牌の全ての面子分解パターンを導出する
 */
export function decomposeHand(
  handTiles: Tile[],
  melds: Meld[] = []
): HandStructure[] {
  const results: HandStructure[] = [];

  // 副露面子を ParsedMeld に変換
  const parsedMelds: ParsedMeld[] = melds.map((m) => {
    let type: ParsedMeld['type'] = 'shuntsu';
    if (m.type === 'pon') type = 'koutsu';
    else if (m.type === 'daiminkan' || m.type === 'ankan' || m.type === 'kakan') type = 'kantsu';

    const values = m.tiles.map((t) => t.value).sort((a, b) => a - b);
    return {
      type,
      suit: m.tiles[0].suit,
      values,
      isOpen: m.type !== 'ankan',
      tiles: m.tiles,
    };
  });

  const totalTilesCount = handTiles.length + melds.reduce((sum, m) => sum + (m.tiles.length >= 4 ? 3 : m.tiles.length), 0);
  if (totalTilesCount !== 14) {
    return results;
  }

  const counts = tilesToCountArray(handTiles);

  // 1. 門前時の特殊役: 国士無双
  if (melds.length === 0 && handTiles.length === 14) {
    const yaokyuIndices = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
    let yaokyuKinds = 0;
    let headIndex = -1;
    for (const idx of yaokyuIndices) {
      if (counts[idx] >= 1) {
        yaokyuKinds++;
        if (counts[idx] === 2) {
          headIndex = idx;
        }
      }
    }
    if (yaokyuKinds === 13 && headIndex !== -1) {
      const { suit, value } = tileIndexToSuitAndValue(headIndex);
      results.push({
        type: 'kokushi',
        head: {
          suit,
          value,
          tiles: findMatchingTiles(handTiles, suit, value, 2),
        },
        melds: [],
      });
    }

    // 2. 門前時の特殊役: 七対子
    let pairCount = 0;
    const pairs: ParsedHead[] = [];
    for (let i = 0; i < 34; i++) {
      if (counts[i] === 2) {
        pairCount++;
        const { suit, value } = tileIndexToSuitAndValue(i);
        pairs.push({
          suit,
          value,
          tiles: findMatchingTiles(handTiles, suit, value, 2),
        });
      }
    }
    if (pairCount === 7) {
      results.push({
        type: 'chiitoitsu',
        head: pairs[0], // 最初の対子をheadに設定し、残りは役判定側で処理
        melds: [],
      });
    }
  }

  // 3. 一般形（4面子1雀頭）の探索
  const targetMeldsCount = 4 - melds.length;

  for (let headIdx = 0; headIdx < 34; headIdx++) {
    if (counts[headIdx] >= 2) {
      counts[headIdx] -= 2;
      const { suit: headSuit, value: headValue } = tileIndexToSuitAndValue(headIdx);
      const head: ParsedHead = {
        suit: headSuit,
        value: headValue,
        tiles: findMatchingTiles(handTiles, headSuit, headValue, 2),
      };

      const foundMeldsList: ParsedMeld[][] = [];
      findHandMelds(counts, 0, [], foundMeldsList, targetMeldsCount, handTiles);

      for (const mList of foundMeldsList) {
        results.push({
          type: 'standard',
          head,
          melds: [...parsedMelds, ...mList],
        });
      }

      counts[headIdx] += 2;
    }
  }

  return results;
}

/**
 * 手牌カウントから残りの面子（刻子・順子）を全探索で列挙
 */
function findHandMelds(
  counts: number[],
  startIdx: number,
  currentMelds: ParsedMeld[],
  allResults: ParsedMeld[][],
  targetCount: number,
  originalTiles: Tile[]
) {
  if (currentMelds.length === targetCount) {
    // 全てのカウントが0になっているか検証
    const remaining = counts.reduce((sum, c) => sum + c, 0);
    if (remaining === 0) {
      allResults.push([...currentMelds]);
    }
    return;
  }

  // 次の非ゼロ牌を探す
  let firstIdx = -1;
  for (let i = startIdx; i < 34; i++) {
    if (counts[i] > 0) {
      firstIdx = i;
      break;
    }
  }

  if (firstIdx === -1) {
    return;
  }

  const { suit, value } = tileIndexToSuitAndValue(firstIdx);

  // 1. 刻子として抽出
  if (counts[firstIdx] >= 3) {
    counts[firstIdx] -= 3;
    const koutsuTiles = findMatchingTiles(originalTiles, suit, value, 3);
    currentMelds.push({
      type: 'koutsu',
      suit,
      values: [value, value, value],
      isOpen: false,
      tiles: koutsuTiles,
    });
    findHandMelds(counts, firstIdx, currentMelds, allResults, targetCount, originalTiles);
    currentMelds.pop();
    counts[firstIdx] += 3;
  }

  // 2. 順子として抽出 (数牌かつ value <= 7)
  if (suit !== 'honor' && value <= 7) {
    if (counts[firstIdx] >= 1 && counts[firstIdx + 1] >= 1 && counts[firstIdx + 2] >= 1) {
      counts[firstIdx] -= 1;
      counts[firstIdx + 1] -= 1;
      counts[firstIdx + 2] -= 1;

      const t1 = findMatchingTiles(originalTiles, suit, value, 1)[0];
      const t2 = findMatchingTiles(originalTiles, suit, value + 1, 1)[0];
      const t3 = findMatchingTiles(originalTiles, suit, value + 2, 1)[0];

      currentMelds.push({
        type: 'shuntsu',
        suit,
        values: [value, value + 1, value + 2],
        isOpen: false,
        tiles: [t1, t2, t3],
      });
      findHandMelds(counts, firstIdx, currentMelds, allResults, targetCount, originalTiles);
      currentMelds.pop();

      counts[firstIdx] += 1;
      counts[firstIdx + 1] += 1;
      counts[firstIdx + 2] += 1;
    }
  }
}
