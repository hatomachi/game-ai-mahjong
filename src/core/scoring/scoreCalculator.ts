import { Tile, Meld } from '../types/tile';
import { WinContext, ScoreCalculationResult, ScorePayment, YakuResult, FuDetails, HandStructure } from './types';
import { decomposeHand } from './handDecomposer';
import { evaluateYaku } from './yakuEvaluator';
import { calculateFu } from './fuCalculator';

function ceil100(val: number): number {
  return Math.ceil(val / 100) * 100;
}

interface EvaluatedPattern {
  structure: HandStructure;
  yakuList: YakuResult[];
  han: number;
  fu: number;
  fuDetails: FuDetails;
  isYakuman: boolean;
  yakumanMultiplier: number;
  basePoint: number;
  title: string;
}

/**
 * 1つの分解パターンの得点タイトルと基本点を算出
 */
function evaluatePatternScore(
  structure: HandStructure,
  context: WinContext,
  allTiles: Tile[]
): EvaluatedPattern | null {
  const yakuEval = evaluateYaku(structure, context, allTiles);
  if (yakuEval.totalHan === 0 && !yakuEval.isYakuman) {
    return null; // 役なし
  }

  const isPinfu = yakuEval.yakuList.some((y) => y.name === 'pinfu');
  const fuRes = calculateFu(structure, context, isPinfu);
  const fu = fuRes.total;
  const han = yakuEval.totalHan;

  let basePoint = 0;
  let title = `${han}翻${fu}符`;

  if (yakuEval.isYakuman) {
    const mult = yakuEval.yakumanMultiplier || 1;
    basePoint = 8000 * mult;
    title = mult > 1 ? `ダブル役満 (${mult}倍役満)` : '役満';
  } else if (han >= 13) {
    basePoint = 8000;
    title = '数え役満';
  } else if (han >= 11) {
    basePoint = 6000;
    title = '三倍満';
  } else if (han >= 8) {
    basePoint = 4000;
    title = '倍満';
  } else if (han >= 6) {
    basePoint = 3000;
    title = '跳満';
  } else if (han === 5 || (han === 4 && fu >= 40) || (han === 3 && fu >= 70)) {
    basePoint = 2000;
    title = '満貫';
  } else {
    // 通常計算: basePoint = fu * 2^(han + 2)
    const raw = fu * Math.pow(2, han + 2);
    if (raw >= 2000) {
      basePoint = 2000;
      title = '満貫';
    } else {
      basePoint = raw;
    }
  }

  return {
    structure,
    yakuList: yakuEval.yakuList,
    han,
    fu,
    fuDetails: fuRes,
    isYakuman: yakuEval.isYakuman,
    yakumanMultiplier: yakuEval.yakumanMultiplier,
    basePoint,
    title,
  };
}

/**
 * 和了手牌・副露・コンテキストから高点法に基づき点数を完全算出
 */
export function calculateWinningScore(
  handTiles: Tile[],
  melds: Meld[],
  context: WinContext,
  honba: number = 0,
  riichiSticks: number = 0,
  winnerIndex: number = 0,
  loserIndex: number = -1
): ScoreCalculationResult | null {
  const allTiles = [...handTiles];
  const structures = decomposeHand(allTiles, melds);

  if (structures.length === 0) {
    return null;
  }

  let bestPattern: EvaluatedPattern | null = null;
  let maxBasePoint = -1;
  let maxHan = -1;

  for (const s of structures) {
    const evaluated = evaluatePatternScore(s, context, allTiles);
    if (!evaluated) continue;

    // 高点法: 基本点が高い方、同点なら翻数が高い方を採用
    if (
      evaluated.basePoint > maxBasePoint ||
      (evaluated.basePoint === maxBasePoint && evaluated.han > maxHan)
    ) {
      bestPattern = evaluated;
      maxBasePoint = evaluated.basePoint;
      maxHan = evaluated.han;
    }
  }

  if (!bestPattern) {
    return null; // 役なしまたはアガリ不成立
  }

  const isDealer = context.playerWind === 'east';
  const base = bestPattern.basePoint;

  let payment: ScorePayment;
  const paymentsByPlayer: [number, number, number, number] = [0, 0, 0, 0];
  let finalGain = 0;

  if (context.isTsumo) {
    if (isDealer) {
      // 親のツモ: 子3人がそれぞれ ceil100(base * 2) + honba * 100 を支払う
      const childPay = ceil100(base * 2);
      const childPayWithHonba = childPay + honba * 100;
      payment = {
        nonDealerPay: childPay,
        totalWinningScore: childPay * 3,
      };

      for (let i = 0; i < 4; i++) {
        if (i === winnerIndex) {
          paymentsByPlayer[i] = childPayWithHonba * 3 + riichiSticks * 1000;
        } else {
          paymentsByPlayer[i] = -childPayWithHonba;
        }
      }
      finalGain = childPayWithHonba * 3 + riichiSticks * 1000;
    } else {
      // 子のツモ: 親が ceil100(base * 2) + honba*100, 他の子2人が ceil100(base * 1) + honba*100
      const dealerPay = ceil100(base * 2);
      const childPay = ceil100(base * 1);
      const dealerPayWithHonba = dealerPay + honba * 100;
      const childPayWithHonba = childPay + honba * 100;

      payment = {
        dealerPay,
        nonDealerPay: childPay,
        totalWinningScore: dealerPay + childPay * 2,
      };

      for (let i = 0; i < 4; i++) {
        if (i === winnerIndex) {
          paymentsByPlayer[i] = dealerPayWithHonba + childPayWithHonba * 2 + riichiSticks * 1000;
        } else {
          // 親のインデックス (playerWind === 'east' のプレイヤーを探すか、相対インデックスで算出)
          // 簡易に winnerIndex の席風から逆算、または外部指定。ここでは dealerPay / childPay を適用
          const windMap = { east: 0, south: 1, west: 2, north: 3 };
          const winnerWindVal = windMap[context.playerWind];
          const dealerIdx = (winnerIndex - winnerWindVal + 4) % 4;

          if (i === dealerIdx) {
            paymentsByPlayer[i] = -dealerPayWithHonba;
          } else {
            paymentsByPlayer[i] = -childPayWithHonba;
          }
        }
      }
      finalGain = dealerPayWithHonba + childPayWithHonba * 2 + riichiSticks * 1000;
    }
  } else {
    // ロン和了
    const rawRon = isDealer ? ceil100(base * 6) : ceil100(base * 4);
    const totalRonWithHonba = rawRon + honba * 300;

    payment = {
      ronPay: rawRon,
      totalWinningScore: rawRon,
    };

    const targetLoser = loserIndex >= 0 ? loserIndex : (winnerIndex + 1) % 4;
    for (let i = 0; i < 4; i++) {
      if (i === winnerIndex) {
        paymentsByPlayer[i] = totalRonWithHonba + riichiSticks * 1000;
      } else if (i === targetLoser) {
        paymentsByPlayer[i] = -totalRonWithHonba;
      } else {
        paymentsByPlayer[i] = 0;
      }
    }
    finalGain = totalRonWithHonba + riichiSticks * 1000;
  }

  return {
    yakuList: bestPattern.yakuList,
    han: bestPattern.han,
    fu: bestPattern.fu,
    fuDetails: bestPattern.fuDetails,
    isYakuman: bestPattern.isYakuman,
    yakumanMultiplier: bestPattern.yakumanMultiplier,
    title: bestPattern.title,
    payment,
    honba,
    riichiSticks,
    finalGain,
    paymentsByPlayer,
  };
}
