import { TileSuit } from '../types/tile';
import { HandStructure, WinContext, FuDetails } from './types';
import { Wind } from '../types/game';

function isYaokyu(suit: TileSuit, value: number): boolean {
  if (suit === 'honor') return true;
  return value === 1 || value === 9;
}

function windToHonorValue(wind: Wind): number {
  switch (wind) {
    case 'east': return 1;
    case 'south': return 2;
    case 'west': return 3;
    case 'north': return 4;
  }
}

/**
 * 手牌構造・和了コンテキストから符を詳細計算する
 */
export function calculateFu(
  structure: HandStructure,
  context: WinContext,
  isPinfu: boolean = false
): FuDetails {
  const explanation: string[] = [];

  // 1. 七対子: 25符固定
  if (structure.type === 'chiitoitsu') {
    return {
      base: 25,
      menzenRon: 0,
      tsumo: 0,
      head: 0,
      wait: 0,
      melds: 0,
      totalBeforeRound: 25,
      total: 25,
      explanation: ['七対子: 25符固定'],
    };
  }

  // 2. 国士無双: 役満
  if (structure.type === 'kokushi') {
    return {
      base: 20,
      menzenRon: 0,
      tsumo: 0,
      head: 0,
      wait: 0,
      melds: 0,
      totalBeforeRound: 20,
      total: 20,
      explanation: ['国士無双'],
    };
  }

  // 3. 平和ツモ: 20符固定
  const isMenzen = structure.melds.every((m) => !m.isOpen);
  if (isPinfu && context.isTsumo && isMenzen) {
    return {
      base: 20,
      menzenRon: 0,
      tsumo: 0,
      head: 0,
      wait: 0,
      melds: 0,
      totalBeforeRound: 20,
      total: 20,
      explanation: ['平和ツモ: 20符固定'],
    };
  }

  // 4. 一般形（4面子1雀頭）の符計算
  let base = 20;
  explanation.push('底符: 20符');

  // 門前ロン加符 (+10符)
  let menzenRon = 0;
  if (!context.isTsumo && isMenzen) {
    menzenRon = 10;
    explanation.push('門前ロン加符: +10符');
  }

  // ツモ符 (+2符)
  let tsumo = 0;
  if (context.isTsumo) {
    tsumo = 2;
    explanation.push('ツモ符: +2符');
  }

  // 雀頭符
  let headFu = 0;
  if (structure.head) {
    const { suit, value } = structure.head;
    if (suit === 'honor') {
      const roundWindVal = windToHonorValue(context.roundWind);
      const playerWindVal = windToHonorValue(context.playerWind);

      // 三元牌 (5:白, 6:發, 7:中)
      if (value >= 5 && value <= 7) {
        headFu += 2;
        explanation.push(`役牌雀頭(${value === 5 ? '白' : value === 6 ? '發' : '中'}): +2符`);
      }
      // 場風
      if (value === roundWindVal) {
        headFu += 2;
        explanation.push('場風雀頭: +2符');
      }
      // 自風
      if (value === playerWindVal) {
        headFu += 2;
        explanation.push('自風雀頭: +2符');
      }
    }
  }

  // 待ち牌符
  let waitFu = 0;
  const winTile = context.winningTile;

  // 単騎待ち判定 (雀頭が和了牌)
  if (
    structure.head &&
    structure.head.suit === winTile.suit &&
    structure.head.value === winTile.value
  ) {
    waitFu = 2;
    explanation.push('単騎待ち: +2符');
  } else {
    // 順子内のカンチャン・ペンチャン待ち判定
    for (const meld of structure.melds) {
      if (meld.type === 'shuntsu' && meld.suit === winTile.suit) {
        // カンチャン待ち (例: 13で2待ち)
        if (meld.values[1] === winTile.value) {
          waitFu = 2;
          explanation.push('嵌張(カンチャン)待ち: +2符');
          break;
        }
        // ペンチャン待ち (12で3待ち、または 89で7待ち)
        if (meld.values[0] === 1 && meld.values[2] === 3 && winTile.value === 3) {
          waitFu = 2;
          explanation.push('辺張(ペンチャン)待ち: +2符');
          break;
        }
        if (meld.values[0] === 7 && meld.values[2] === 9 && winTile.value === 7) {
          waitFu = 2;
          explanation.push('辺張(ペンチャン)待ち: +2符');
          break;
        }
      }
    }
  }

  // 面子符
  let meldsFu = 0;
  for (const meld of structure.melds) {
    if (meld.type === 'shuntsu') {
      continue;
    }

    const isYao = isYaokyu(meld.suit, meld.values[0]);

    if (meld.type === 'koutsu') {
      // 和了牌が含まれる刻子でロンの場合は明刻扱い、それ以外はisOpenに従う
      const isWinTileInMeld =
        meld.suit === winTile.suit && meld.values[0] === winTile.value;
      const effectiveOpen = meld.isOpen || (!context.isTsumo && isWinTileInMeld);

      let fuVal = 0;
      if (effectiveOpen) {
        fuVal = isYao ? 4 : 2;
        explanation.push(`${isYao ? '幺九牌' : '中張牌'}明刻: +${fuVal}符`);
      } else {
        fuVal = isYao ? 8 : 4;
        explanation.push(`${isYao ? '幺九牌' : '中張牌'}暗刻: +${fuVal}符`);
      }
      meldsFu += fuVal;
    } else if (meld.type === 'kantsu') {
      let fuVal = 0;
      if (meld.isOpen) {
        fuVal = isYao ? 16 : 8;
        explanation.push(`${isYao ? '幺九牌' : '中張牌'}明槓: +${fuVal}符`);
      } else {
        fuVal = isYao ? 32 : 16;
        explanation.push(`${isYao ? '幺九牌' : '中張牌'}暗槓: +${fuVal}符`);
      }
      meldsFu += fuVal;
    }
  }

  const totalBeforeRound = base + menzenRon + tsumo + headFu + waitFu + meldsFu;
  // 1の位切り上げ (ただし 20符ロンなどの喰い平和形は30符)
  let total = Math.ceil(totalBeforeRound / 10) * 10;
  if (total === 20 && !context.isTsumo) {
    total = 30; // 喰い平和形ロンは30符
  }

  return {
    base,
    menzenRon,
    tsumo,
    head: headFu,
    wait: waitFu,
    melds: meldsFu,
    totalBeforeRound,
    total,
    explanation,
  };
}
