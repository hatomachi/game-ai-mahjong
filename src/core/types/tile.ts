export type TileSuit = 'man' | 'pin' | 'sou' | 'honor';

export type HonorValue = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Tile {
  id: string;          // 一意なID (例: "1m_0", "5p_red_0")
  suit: TileSuit;      // 牌種別
  value: number;       // 1-9, 字牌は 1:東 2:南 3:西 4:北 5:白 6:發 7:中
  isRedDora?: boolean; // 赤ドラ
}

export type MeldType = 'chi' | 'pon' | 'daiminkan' | 'ankan' | 'kakan';

export interface Meld {
  type: MeldType;
  tiles: Tile[];
  fromPlayerIndex: number; // 0: 自家/東, 1: 下家/南, 2: 対面/西, 3: 上家/北 (相対または絶対)
  calledTile: Tile;        // 鳴いた牌
}

export interface DiscardTile {
  tile: Tile;
  isTsumogiri: boolean;         // ツモ切り
  isRiichiDeclaration?: boolean;// リーチ宣言牌
  isCalled?: boolean;           // 鳴かれて河から消えた牌フラグ
}
