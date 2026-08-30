import { Tile, TileSuit } from '../types/tile';
import { HandStructure, WinContext, YakuResult, YakuName } from './types';
import { YAKU_DEFINITIONS } from './constants';
import { getDoraTileFromMarker } from '../utils/tileUtils';
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

function getAllTilesFromStructure(structure: HandStructure): Tile[] {
  const tiles: Tile[] = [];
  if (structure.head) {
    tiles.push(...structure.head.tiles);
  }
  for (const m of structure.melds) {
    tiles.push(...m.tiles);
  }
  return tiles;
}

/**
 * 1つの手牌分解構造と和了コンテキストに対して役とドラを判定する
 */
export function evaluateYaku(
  structure: HandStructure,
  context: WinContext,
  allHandTilesWithWin: Tile[]
): { yakuList: YakuResult[]; totalHan: number; isYakuman: boolean; yakumanMultiplier: number } {
  const yakuList: YakuResult[] = [];
  const isMenzen = structure.melds.every((m) => !m.isOpen);

  const addYaku = (name: YakuName, customMultiplier?: number) => {
    const def = YAKU_DEFINITIONS[name];
    if (!def) return;
    const han = isMenzen ? def.hanMenzen : def.hanOpen;
    if (han > 0) {
      yakuList.push({
        name,
        nameJa: def.nameJa,
        han: def.isYakuman ? 13 * (customMultiplier || def.yakumanMultiplier || 1) : han,
        isYakuman: def.isYakuman,
        yakumanMultiplier: customMultiplier || def.yakumanMultiplier,
      });
    }
  };

  // ----------------------------------------------------
  // 1. 役満判定
  // ----------------------------------------------------
  const yakumanList: YakuResult[] = [];

  // 天和 / 地和
  if (context.isTenhou) {
    yakumanList.push({ name: 'tenhou', nameJa: '天和', han: 13, isYakuman: true, yakumanMultiplier: 1 });
  }
  if (context.isChiihou) {
    yakumanList.push({ name: 'chiihou', nameJa: '地和', han: 13, isYakuman: true, yakumanMultiplier: 1 });
  }

  // 国士無双
  if (structure.type === 'kokushi') {
    // 和了牌が雀頭の場合は13面待ち
    if (structure.head && structure.head.suit === context.winningTile.suit && structure.head.value === context.winningTile.value) {
      yakumanList.push({ name: 'kokushi_13', nameJa: '国士無双十三面待ち', han: 26, isYakuman: true, yakumanMultiplier: 2 });
    } else {
      yakumanList.push({ name: 'kokushi', nameJa: '国士無双', han: 13, isYakuman: true, yakumanMultiplier: 1 });
    }
  }

  // 大三元 (白發中すべて刻子/槓子)
  if (structure.type === 'standard') {
    const sungenCount = structure.melds.filter(
      (m) => m.suit === 'honor' && m.values[0] >= 5 && m.values[0] <= 7 && (m.type === 'koutsu' || m.type === 'kantsu')
    ).length;
    if (sungenCount === 3) {
      yakumanList.push({ name: 'daisangen', nameJa: '大三元', han: 13, isYakuman: true, yakumanMultiplier: 1 });
    }
  }

  // 四喜和: 小四喜 / 大四喜
  if (structure.type === 'standard') {
    const windMelds = structure.melds.filter(
      (m) => m.suit === 'honor' && m.values[0] >= 1 && m.values[0] <= 4 && (m.type === 'koutsu' || m.type === 'kantsu')
    ).length;
    const isWindHead = structure.head?.suit === 'honor' && structure.head.value >= 1 && structure.head.value <= 4;

    if (windMelds === 4) {
      yakumanList.push({ name: 'daisuushii', nameJa: '大四喜', han: 26, isYakuman: true, yakumanMultiplier: 2 });
    } else if (windMelds === 3 && isWindHead) {
      yakumanList.push({ name: 'shousuushii', nameJa: '小四喜', han: 13, isYakuman: true, yakumanMultiplier: 1 });
    }
  }

  // 字一色 (全牌が字牌)
  const allTiles = structure.type === 'chiitoitsu' || structure.type === 'kokushi' ? allHandTilesWithWin : getAllTilesFromStructure(structure);
  const isAllHonors = allTiles.every((t) => t.suit === 'honor');
  if (isAllHonors && structure.type !== 'kokushi') {
    yakumanList.push({ name: 'tsuuiisou', nameJa: '字一色', han: 13, isYakuman: true, yakumanMultiplier: 1 });
  }

  // 清老頭 (全牌が数牌の1・9)
  const isAll19Number = allTiles.every((t) => t.suit !== 'honor' && (t.value === 1 || t.value === 9));
  if (isAll19Number && structure.type !== 'kokushi') {
    yakumanList.push({ name: 'chinroutou', nameJa: '清老頭', han: 13, isYakuman: true, yakumanMultiplier: 1 });
  }

  // 緑一色 (2s, 3s, 4s, 6s, 8s, 6z(發) のみ)
  const isRyuuiisou = allTiles.every((t) => {
    if (t.suit === 'sou' && [2, 3, 4, 6, 8].includes(t.value)) return true;
    if (t.suit === 'honor' && t.value === 6) return true;
    return false;
  });
  if (isRyuuiisou) {
    yakumanList.push({ name: 'ryuuiisou', nameJa: '緑一色', han: 13, isYakuman: true, yakumanMultiplier: 1 });
  }

  // 四暗刻 / 四暗刻単騎
  if (structure.type === 'standard' && isMenzen) {
    const ankouCount = structure.melds.filter((m) => {
      if (m.isOpen) return false;
      if (m.type !== 'koutsu' && m.type !== 'kantsu') return false;
      // ロン和了の場合、和了牌が含まれる刻子は明刻扱い
      const hasWinTile = m.suit === context.winningTile.suit && m.values[0] === context.winningTile.value;
      if (!context.isTsumo && hasWinTile) {
        return false;
      }
      return true;
    }).length;

    if (ankouCount === 4) {
      // 単騎待ちかどうか
      const isTanki = structure.head?.suit === context.winningTile.suit && structure.head.value === context.winningTile.value;
      if (isTanki) {
        yakumanList.push({ name: 'suuankou_tanki', nameJa: '四暗刻単騎', han: 26, isYakuman: true, yakumanMultiplier: 2 });
      } else {
        yakumanList.push({ name: 'suuankou', nameJa: '四暗刻', han: 13, isYakuman: true, yakumanMultiplier: 1 });
      }
    }
  }

  // 四槓子
  if (structure.type === 'standard') {
    const kantsuCount = structure.melds.filter((m) => m.type === 'kantsu').length;
    if (kantsuCount === 4) {
      yakumanList.push({ name: 'suukantsu', nameJa: '四槓子', han: 13, isYakuman: true, yakumanMultiplier: 1 });
    }
  }

  // 九蓮宝燈 / 純正九蓮宝燈
  if (structure.type === 'standard' && isMenzen) {
    const firstSuit = allTiles[0].suit;
    if (firstSuit !== 'honor' && allTiles.every((t) => t.suit === firstSuit)) {
      const counts = new Array(10).fill(0);
      for (const t of allTiles) counts[t.value]++;
      // 1が3枚以上、9が3枚以上、2〜8が各1枚以上
      const isChuurenBase = counts[1] >= 3 && counts[9] >= 3 && [2, 3, 4, 5, 6, 7, 8].every((v) => counts[v] >= 1);
      if (isChuurenBase) {
        // 純正判定: 手牌13枚がピッタリ 1112345678999 の状態
        const countsWithoutWin = [...counts];
        countsWithoutWin[context.winningTile.value]--;
        const isPure =
          countsWithoutWin[1] === 3 &&
          countsWithoutWin[9] === 3 &&
          [2, 3, 4, 5, 6, 7, 8].every((v) => countsWithoutWin[v] === 1);

        if (isPure) {
          yakumanList.push({ name: 'chuuren_9', nameJa: '純正九蓮宝燈', han: 26, isYakuman: true, yakumanMultiplier: 2 });
        } else {
          yakumanList.push({ name: 'chuuren', nameJa: '九蓮宝燈', han: 13, isYakuman: true, yakumanMultiplier: 1 });
        }
      }
    }
  }

  // 役満が成立した場合は役満のみを返す
  if (yakumanList.length > 0) {
    const totalMultiplier = yakumanList.reduce((sum, y) => sum + (y.yakumanMultiplier || 1), 0);
    return {
      yakuList: yakumanList,
      totalHan: 13 * totalMultiplier,
      isYakuman: true,
      yakumanMultiplier: totalMultiplier,
    };
  }

  // ----------------------------------------------------
  // 2. 通常役の判定
  // ----------------------------------------------------

  // 門前清自摸和
  if (isMenzen && context.isTsumo) {
    addYaku('tsumo');
  }

  // リーチ / ダブルリーチ / 一発
  if (context.isDoubleRiichi) {
    addYaku('double_riichi');
  } else if (context.isRiichi) {
    addYaku('riichi');
  }
  if (context.isIppatsu && (context.isRiichi || context.isDoubleRiichi)) {
    addYaku('ippatsu');
  }

  // 嶺上開花 / 槍槓 / 海底摸月 / 河底撈魚
  if (context.isRinshan && context.isTsumo) addYaku('rinshan');
  if (context.isChankan && !context.isTsumo) addYaku('chankan');
  if (context.isHaitei && context.isTsumo) addYaku('haitei');
  if (context.isHoutei && !context.isTsumo) addYaku('houtei');

  // 断幺九 (タンヤオ)
  const isTanyao = allTiles.every((t) => !isYaokyu(t.suit, t.value));
  if (isTanyao) {
    addYaku('tanyao');
  }

  // 七対子 (チートイツ)
  if (structure.type === 'chiitoitsu') {
    addYaku('chiitoitsu');
  }

  if (structure.type === 'standard') {
    // 役牌 (白・發・中・自風・場風)
    const roundWindVal = windToHonorValue(context.roundWind);
    const playerWindVal = windToHonorValue(context.playerWind);

    for (const meld of structure.melds) {
      if (meld.suit === 'honor' && (meld.type === 'koutsu' || meld.type === 'kantsu')) {
        const val = meld.values[0];
        if (val === 5) addYaku('yakuhai_haku');
        if (val === 6) addYaku('yakuhai_hatsu');
        if (val === 7) addYaku('yakuhai_chun');
        if (val === roundWindVal) addYaku('yakuhai_bakaze');
        if (val === playerWindVal) addYaku('yakuhai_jikaze');
      }
    }

    // 平和 (ピンフ: 門前, 全順子, 雀頭が非役牌, 両面待ち)
    if (isMenzen) {
      const allShuntsu = structure.melds.every((m) => m.type === 'shuntsu');
      if (allShuntsu && structure.head) {
        const headVal = structure.head.value;
        const isHeadYakuhai =
          structure.head.suit === 'honor' &&
          (headVal >= 5 || headVal === roundWindVal || headVal === playerWindVal);

        if (!isHeadYakuhai) {
          // 両面待ち判定 (和了牌が順子の端で、かつ順子の完成形が2〜8の間)
          let isRyammen = false;
          const winVal = context.winningTile.value;
          for (const m of structure.melds) {
            if (m.suit === context.winningTile.suit) {
              if (m.values[0] === winVal && m.values[2] < 9) {
                // 例: 234 で 2待ち (元の塔子が 34)
                isRyammen = true;
                break;
              }
              if (m.values[2] === winVal && m.values[0] > 1) {
                // 例: 234 で 4待ち (元の塔子が 23)
                isRyammen = true;
                break;
              }
            }
          }
          if (isRyammen) {
            addYaku('pinfu');
          }
        }
      }
    }

    // 一盃口 / 二盃口
    if (isMenzen) {
      const shuntsuList = structure.melds.filter((m) => m.type === 'shuntsu');
      let pairShuntsuCount = 0;
      const matched = new Set<number>();
      for (let i = 0; i < shuntsuList.length; i++) {
        if (matched.has(i)) continue;
        for (let j = i + 1; j < shuntsuList.length; j++) {
          if (matched.has(j)) continue;
          if (
            shuntsuList[i].suit === shuntsuList[j].suit &&
            shuntsuList[i].values[0] === shuntsuList[j].values[0]
          ) {
            pairShuntsuCount++;
            matched.add(i);
            matched.add(j);
            break;
          }
        }
      }
      if (pairShuntsuCount === 2) {
        addYaku('ryanpeiko');
      } else if (pairShuntsuCount === 1) {
        addYaku('iipeiko');
      }
    }

    // 対々和 (トイトイ)
    const koutsuCount = structure.melds.filter((m) => m.type === 'koutsu' || m.type === 'kantsu').length;
    if (koutsuCount === 4) {
      addYaku('toitoi');
    }

    // 三暗刻
    const ankouCount = structure.melds.filter((m) => {
      if (m.isOpen) return false;
      if (m.type !== 'koutsu' && m.type !== 'kantsu') return false;
      const hasWinTile = m.suit === context.winningTile.suit && m.values[0] === context.winningTile.value;
      if (!context.isTsumo && hasWinTile) return false;
      return true;
    }).length;
    if (ankouCount === 3) {
      addYaku('sanankou');
    }

    // 三槓子
    const kantsuCount = structure.melds.filter((m) => m.type === 'kantsu').length;
    if (kantsuCount === 3) {
      addYaku('sankantsu');
    }

    // 三色同刻 (萬筒索で同数字の刻子/槓子)
    const koutsuMelds = structure.melds.filter((m) => m.type === 'koutsu' || m.type === 'kantsu');
    for (let num = 1; num <= 9; num++) {
      const hasMan = koutsuMelds.some((m) => m.suit === 'man' && m.values[0] === num);
      const hasPin = koutsuMelds.some((m) => m.suit === 'pin' && m.values[0] === num);
      const hasSou = koutsuMelds.some((m) => m.suit === 'sou' && m.values[0] === num);
      if (hasMan && hasPin && hasSou) {
        addYaku('sanshoku_doukou');
        break;
      }
    }

    // 三色同順 (萬筒索で同数字の順子)
    const shuntsuMelds = structure.melds.filter((m) => m.type === 'shuntsu');
    for (let num = 1; num <= 7; num++) {
      const hasMan = shuntsuMelds.some((m) => m.suit === 'man' && m.values[0] === num);
      const hasPin = shuntsuMelds.some((m) => m.suit === 'pin' && m.values[0] === num);
      const hasSou = shuntsuMelds.some((m) => m.suit === 'sou' && m.values[0] === num);
      if (hasMan && hasPin && hasSou) {
        addYaku('sanshoku');
        break;
      }
    }

    // 一気通貫 (イッツー: 123, 456, 789)
    for (const suit of ['man', 'pin', 'sou'] as TileSuit[]) {
      const has123 = shuntsuMelds.some((m) => m.suit === suit && m.values[0] === 1);
      const has456 = shuntsuMelds.some((m) => m.suit === suit && m.values[0] === 4);
      const has789 = shuntsuMelds.some((m) => m.suit === suit && m.values[0] === 7);
      if (has123 && has456 && has789) {
        addYaku('ittsu');
        break;
      }
    }

    // 小三元
    const sungenKoutsu = structure.melds.filter(
      (m) => m.suit === 'honor' && m.values[0] >= 5 && m.values[0] <= 7 && (m.type === 'koutsu' || m.type === 'kantsu')
    ).length;
    const isSungenHead = structure.head?.suit === 'honor' && structure.head.value >= 5 && structure.head.value <= 7;
    if (sungenKoutsu === 2 && isSungenHead) {
      addYaku('shousangen');
    }

    // 混全帯幺九 (チャンタ) / 純全帯幺九 (ジュンチャン) / 混老頭
    const hasShuntsu = structure.melds.some((m) => m.type === 'shuntsu');
    const allMeldsHaveYaokyu = structure.melds.every((m) => {
      if (m.type === 'shuntsu') {
        return m.values[0] === 1 || m.values[2] === 9;
      }
      return isYaokyu(m.suit, m.values[0]);
    });
    const headIsYaokyu = structure.head ? isYaokyu(structure.head.suit, structure.head.value) : false;

    if (allMeldsHaveYaokyu && headIsYaokyu) {
      const hasHonor = allTiles.some((t) => t.suit === 'honor');
      if (hasShuntsu) {
        if (hasHonor) {
          addYaku('chanta');
        } else {
          addYaku('junchan');
        }
      } else {
        if (hasHonor) {
          addYaku('honroutou');
        }
      }
    }
  }

  // 混一色 (ホンイツ) / 清一色 (チンイツ)
  const numberSuits = new Set(allTiles.filter((t) => t.suit !== 'honor').map((t) => t.suit));
  const hasHonorTiles = allTiles.some((t) => t.suit === 'honor');

  if (numberSuits.size === 1) {
    if (hasHonorTiles) {
      addYaku('honitsu');
    } else {
      addYaku('chinitsu');
    }
  }

  // 役が1つもない場合はドラを加算しない（役なし）
  let totalHan = yakuList.reduce((sum, y) => sum + y.han, 0);
  if (totalHan === 0) {
    return {
      yakuList: [],
      totalHan: 0,
      isYakuman: false,
      yakumanMultiplier: 0,
    };
  }

  // ----------------------------------------------------
  // 3. ドラ加算
  // ----------------------------------------------------
  let doraCount = 0;
  let uradoraCount = 0;
  let redDoraCount = 0;

  // 表ドラ
  for (const marker of context.doraMarkers) {
    const target = getDoraTileFromMarker(marker);
    for (const t of allTiles) {
      if (t.suit === target.suit && t.value === target.value) {
        doraCount++;
      }
    }
  }

  // 裏ドラ (リーチ時のみ)
  if ((context.isRiichi || context.isDoubleRiichi) && context.uraDoraMarkers) {
    for (const marker of context.uraDoraMarkers) {
      const target = getDoraTileFromMarker(marker);
      for (const t of allTiles) {
        if (t.suit === target.suit && t.value === target.value) {
          uradoraCount++;
        }
      }
    }
  }

  // 赤ドラ
  for (const t of allTiles) {
    if (t.isRedDora) {
      redDoraCount++;
    }
  }

  if (doraCount > 0) {
    yakuList.push({ name: 'dora', nameJa: `ドラ ${doraCount}`, han: doraCount });
    totalHan += doraCount;
  }
  if (uradoraCount > 0) {
    yakuList.push({ name: 'uradora', nameJa: `裏ドラ ${uradoraCount}`, han: uradoraCount });
    totalHan += uradoraCount;
  }
  if (redDoraCount > 0) {
    yakuList.push({ name: 'red_dora', nameJa: `赤ドラ ${redDoraCount}`, han: redDoraCount });
    totalHan += redDoraCount;
  }

  return {
    yakuList,
    totalHan,
    isYakuman: false,
    yakumanMultiplier: 0,
  };
}
