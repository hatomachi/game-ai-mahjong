import { Tile, TileSuit } from '../types/tile';
import { Wind } from '../types/game';

export type YakuName =
  // 1翻
  | 'tsumo'              // 門前清自摸和
  | 'riichi'             // 立直
  | 'ippatsu'            // 一発
  | 'pinfu'              // 平和
  | 'tanyao'             // 断幺九
  | 'iipeiko'            // 一盃口
  | 'yakuhai_haku'       // 役牌 白
  | 'yakuhai_hatsu'      // 役牌 發
  | 'yakuhai_chun'       // 役牌 中
  | 'yakuhai_bakaze'     // 役牌 場風
  | 'yakuhai_jikaze'     // 役牌 自風
  | 'rinshan'            // 嶺上開花
  | 'chankan'            // 槍槓
  | 'haitei'             // 海底摸月
  | 'houtei'             // 河底撈魚
  // 2翻
  | 'double_riichi'      // ダブル立直
  | 'sanshoku'           // 三色同順
  | 'ittsu'              // 一気通貫
  | 'chanta'             // 混全帯幺九
  | 'chiitoitsu'         // 七対子
  | 'toitoi'             // 対々和
  | 'sanankou'           // 三暗刻
  | 'sankantsu'          // 三槓子
  | 'sanshoku_doukou'    // 三色同刻
  | 'honroutou'          // 混老頭
  | 'shousangen'         // 小三元
  // 3翻
  | 'honitsu'            // 混一色
  | 'junchan'            // 純全帯幺九
  | 'ryanpeiko'          // 二盃口
  // 6翻
  | 'chinitsu'           // 清一色
  // 役満
  | 'kokushi'            // 国士無双
  | 'kokushi_13'         // 国士無双十三面待ち (W役満)
  | 'suuankou'           // 四暗刻
  | 'suuankou_tanki'     // 四暗刻単騎 (W役満)
  | 'daisangen'          // 大三元
  | 'tsuuiisou'          // 字一色
  | 'ryuuiisou'          // 緑一色
  | 'chinroutou'         // 清老頭
  | 'chuuren'            // 九蓮宝燈
  | 'chuuren_9'          // 純正九蓮宝燈 (W役満)
  | 'suukantsu'          // 四槓子
  | 'tenhou'             // 天和
  | 'chiihou'            // 地和
  | 'shousuushii'        // 小四喜
  | 'daisuushii'         // 大四喜 (W役満 / 役満)
  // ドラ
  | 'dora'               // 表ドラ
  | 'uradora'            // 裏ドラ
  | 'red_dora';          // 赤ドラ

export interface YakuResult {
  name: YakuName;
  nameJa: string;
  han: number;
  isYakuman?: boolean;
  yakumanMultiplier?: number; // 1: 通常役満, 2: ダブル役満
}

export type MeldType = 'shuntsu' | 'koutsu' | 'kantsu';

export interface ParsedMeld {
  type: MeldType;
  suit: TileSuit;
  values: number[];      // 例: [1, 2, 3] または [5, 5, 5] または [7, 7, 7, 7]
  isOpen: boolean;       // 鳴き(明面子)か門前(暗面子)か
  tiles: Tile[];
}

export interface ParsedHead {
  suit: TileSuit;
  value: number;
  tiles: Tile[];
}

export interface HandStructure {
  type: 'standard' | 'chiitoitsu' | 'kokushi';
  head?: ParsedHead;
  melds: ParsedMeld[];
}

export interface WinContext {
  isTsumo: boolean;
  isRiichi: boolean;
  isDoubleRiichi?: boolean;
  isIppatsu?: boolean;
  isRinshan?: boolean;
  isChankan?: boolean;
  isHaitei?: boolean;
  isHoutei?: boolean;
  isTenhou?: boolean;
  isChiihou?: boolean;
  roundWind: Wind;
  playerWind: Wind;
  doraMarkers: Tile[];
  uraDoraMarkers?: Tile[];
  winningTile: Tile;
}

export interface FuDetails {
  base: number;
  menzenRon: number;
  tsumo: number;
  head: number;
  wait: number;
  melds: number;
  totalBeforeRound: number;
  total: number;
  explanation: string[];
}

export interface ScorePayment {
  dealerPay?: number;    // 子のツモ時の親の支払い
  nonDealerPay?: number; // 子のツモ時の子の支払い、または親のツモ時の各子の支払い
  ronPay?: number;       // ロン時の放銃者の支払い
  totalWinningScore: number; // 本場や供託を含まないアガリ点数
}

export interface ScoreCalculationResult {
  yakuList: YakuResult[];
  han: number;
  fu: number;
  fuDetails?: FuDetails;
  isYakuman: boolean;
  yakumanMultiplier: number;
  title: string;          // 例: "満貫", "跳満", "倍満", "役満", "3翻40符"
  payment: ScorePayment;
  honba: number;
  riichiSticks: number;
  finalGain: number;      // 本場・供託を含む和了者の総得点
  paymentsByPlayer: [number, number, number, number]; // 各プレイヤーの点数増減
}
