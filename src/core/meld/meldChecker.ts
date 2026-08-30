import { Tile } from '../types/tile';
import { PlayerState } from '../types/game';
import { isSameTileType } from '../utils/tileUtils';

export interface ChiOption {
  type: 'chi';
  tiles: [Tile, Tile]; // 手牌から差し出す2枚
  targetTile: Tile;
}

export interface PonOption {
  type: 'pon';
  tiles: [Tile, Tile]; // 手牌から差し出す2枚
  targetTile: Tile;
}

export interface DaiminkanOption {
  type: 'daiminkan';
  tiles: [Tile, Tile, Tile]; // 手牌から差し出す3枚
  targetTile: Tile;
}

export interface AnkanOption {
  type: 'ankan';
  tiles: [Tile, Tile, Tile, Tile]; // 手牌中の4枚
}

export interface KakanOption {
  type: 'kakan';
  meldIndex: number;
  tile: Tile; // 追加する4枚目の牌
}

export interface AvailableMelds {
  canChi: boolean;
  chiOptions: ChiOption[];
  canPon: boolean;
  ponOption?: PonOption;
  canDaiminkan: boolean;
  daiminkanOption?: DaiminkanOption;
  canRon: boolean;
}

export interface AvailableTurnMelds {
  canAnkan: boolean;
  ankanOptions: AnkanOption[];
  canKakan: boolean;
  kakanOptions: KakanOption[];
  canRiichi: boolean;
  canTsumoWin: boolean;
}

/**
 * 他家の打牌に対して可能な副露（チー・ポン・明槓）を判定
 */
export function checkDiscardsMelds(
  player: PlayerState,
  targetTile: Tile,
  fromPlayerIndex: number,
  myIndex: number
): AvailableMelds {
  const result: AvailableMelds = {
    canChi: false,
    chiOptions: [],
    canPon: false,
    canDaiminkan: false,
    canRon: false,
  };

  // リーチ中は鳴けない
  if (player.isRiichi) {
    return result;
  }

  const hand = player.hand;

  // 1. ポン判定 (同種牌が手牌に2枚以上)
  const sameTiles = hand.filter((t) => isSameTileType(t, targetTile));
  if (sameTiles.length >= 2) {
    result.canPon = true;
    result.ponOption = {
      type: 'pon',
      tiles: [sameTiles[0], sameTiles[1]],
      targetTile,
    };
  }

  // 2. 明槓判定 (同種牌が手牌に3枚)
  if (sameTiles.length >= 3) {
    result.canDaiminkan = true;
    result.daiminkanOption = {
      type: 'daiminkan',
      tiles: [sameTiles[0], sameTiles[1], sameTiles[2]],
      targetTile,
    };
  }

  // 3. チー判定 (上家からの打牌かつ数牌)
  const isKamicha = (myIndex - 1 + 4) % 4 === fromPlayerIndex;
  if (isKamicha && targetTile.suit !== 'honor') {
    const v = targetTile.value;
    const s = targetTile.suit;

    // パターン1: (v-2, v-1) で v をチー (例: 1,2 で 3)
    if (v >= 3) {
      const t1 = hand.find((t) => t.suit === s && t.value === v - 2);
      const t2 = hand.find((t) => t.suit === s && t.value === v - 1);
      if (t1 && t2) {
        result.chiOptions.push({
          type: 'chi',
          tiles: [t1, t2],
          targetTile,
        });
      }
    }

    // パターン2: (v-1, v+1) で v をチー (例: 2,4 で 3)
    if (v >= 2 && v <= 8) {
      const t1 = hand.find((t) => t.suit === s && t.value === v - 1);
      const t2 = hand.find((t) => t.suit === s && t.value === v + 1);
      if (t1 && t2) {
        result.chiOptions.push({
          type: 'chi',
          tiles: [t1, t2],
          targetTile,
        });
      }
    }

    // パターン3: (v+1, v+2) で v をチー (例: 4,5 で 3)
    if (v <= 7) {
      const t1 = hand.find((t) => t.suit === s && t.value === v + 1);
      const t2 = hand.find((t) => t.suit === s && t.value === v + 2);
      if (t1 && t2) {
        result.chiOptions.push({
          type: 'chi',
          tiles: [t1, t2],
          targetTile,
        });
      }
    }

    if (result.chiOptions.length > 0) {
      result.canChi = true;
    }
  }

  return result;
}

/**
 * 自分のツモ番時の暗槓・加槓を判定
 */
export function checkTurnMelds(player: PlayerState): AvailableTurnMelds {
  const result: AvailableTurnMelds = {
    canAnkan: false,
    ankanOptions: [],
    canKakan: false,
    kakanOptions: [],
    canRiichi: false,
    canTsumoWin: false,
  };

  const allTiles = player.drawnTile ? [...player.hand, player.drawnTile] : [...player.hand];

  // 1. 暗槓判定 (同種牌が4枚)
  // リーチ中の暗槓は待ち牌が変わらない場合のみ可能だが、簡易的に非リーチ時のみ暗槓可能とする
  if (!player.isRiichi) {
    const tileGroups = new Map<string, Tile[]>();
    for (const t of allTiles) {
      const key = `${t.suit}_${t.value}`;
      if (!tileGroups.has(key)) tileGroups.set(key, []);
      tileGroups.get(key)!.push(t);
    }

    tileGroups.forEach((group) => {
      if (group.length === 4) {
        result.canAnkan = true;
        result.ankanOptions.push({
          type: 'ankan',
          tiles: [group[0], group[1], group[2], group[3]],
        });
      }
    });
  }

  // 2. 加槓判定 (ポンしている明刻に対して4枚目を手牌から追加)
  if (!player.isRiichi) {
    player.melds.forEach((meld, idx) => {
      if (meld.type === 'pon') {
        const ponTile = meld.tiles[0];
        const match = allTiles.find((t) => isSameTileType(t, ponTile));
        if (match) {
          result.canKakan = true;
          result.kakanOptions.push({
            type: 'kakan',
            meldIndex: idx,
            tile: match,
          });
        }
      }
    });
  }

  return result;
}
