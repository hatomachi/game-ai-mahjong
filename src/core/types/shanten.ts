import { Tile } from './tile';

export interface UkeireItem {
  tileCode: string;          // 牌コード (例: "1m", "5p", "1z")
  suit: Tile['suit'];
  value: number;
  remainingCount: number;    // 見えていない残り枚数 (0..4)
}

export interface DiscardAnalysis {
  discardTile: Tile;
  shantenAfterDiscard: number;
  totalUkeireCount: number;  // 受け入れ合計枚数
  ukeireTiles: UkeireItem[]; // 受け入れ牌一覧
}

export interface ShantenResult {
  shanten: number;           // -1: 和了, 0: テンパイ, 1: 一向聴, ...
  isMentsuHand: boolean;     // 面子手
  isChiitoitsu: boolean;     // 七対子
  isKokushi: boolean;        // 国士無双
  mentsuShanten: number;
  chiitoiShanten: number;
  kokushiShanten: number;
}
