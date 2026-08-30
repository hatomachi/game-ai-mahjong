# DATA_MODELS.md - データモデル & 型仕様書

本ドキュメントでは、麻雀ゲームエンジンおよびAI連携で使用するデータ構造と型定義を定めます。

---

## 1. 牌（Tile）の型定義

```typescript
// 牌の種類（萬子, 筒子, 索子, 字牌）
export type TileSuit = 'man' | 'pin' | 'sou' | 'honor';

// 字牌の種類 (東=1, 南=2, 西=3, 北=4, 白=5, 發=6, 中=7)
export type HonorValue = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Tile {
  id: string;          // ユニーク識別子 (例: "1m_0", "5p_red_0")
  suit: TileSuit;      // 種別
  value: number;       // 数字 (1-9 または 字牌 1-7)
  isRedDora?: boolean; // 赤ドラフラグ
}
```

---

## 2. 捨て牌（Discard）と副露（Meld）

```typescript
export interface DiscardTile {
  tile: Tile;
  isTsumogiri: boolean;   // ツモ切りかどうか
  isRiichiDeclaration?: boolean; // リーチ宣言牌かどうか
  isCalled?: boolean;     // 他家に鳴かれたかどうか
}

export type MeldType = 'chi' | 'pon' | 'daiminkan' | 'ankan' | 'kakan';

export interface Meld {
  type: MeldType;
  tiles: Tile[];
  fromPlayerIndex: number; // 誰から鳴いたか (0: 東, 1: 南, 2: 西, 3: 北)
  calledTile: Tile;        // 鳴いた牌
}
```

---

## 3. 完全ゲームステート（GameState）

```typescript
export type Wind = 'east' | 'south' | 'west' | 'north';

export interface PlayerState {
  id: string;
  name: string;
  isHuman: boolean;
  seatWind: Wind;
  score: number;
  hand: Tile[];              // 非公開手牌（13枚または14枚）
  drawnTile: Tile | null;    // 現在ツモった牌
  discards: DiscardTile[];   // 捨て牌履歴
  melds: Meld[];             // 副露一覧
  isRiichi: boolean;         // リーチ成立フラグ
  riichiTurn?: number;       // リーチ宣言巡目
  isTenpai?: boolean;
}

export interface GameState {
  roundWind: 'east' | 'south'; // 東場 / 南場
  roundNumber: number;         // 1局〜4局 (1: 東1局, ...)
  honba: number;               // 本場数 (0本場〜)
  riichiSticks: number;        // 供託リーチ棒
  doraMarkers: Tile[];         // 表ドラ表示牌
  uraDoraMarkers: Tile[];      // 裏ドラ表示牌 (非公開)
  wall: Tile[];                // 残り山牌 (非公開)
  deadWall: Tile[];            // 王牌 (非公開)
  players: [PlayerState, PlayerState, PlayerState, PlayerState];
  activePlayerIndex: number;   // 現在の手番プレイヤー (0..3)
  phase: GamePhase;
}
```

---

## 4. プレイヤー公開視点（SanitizedPlayerView - AIに渡す情報）

```typescript
export interface OpponentPublicView {
  playerIndex: number;
  name: string;
  seatWind: Wind;
  score: number;
  discards: DiscardTile[];     // 公開された捨て牌
  melds: Meld[];               // 公開された副露
  isRiichi: boolean;
  riichiTurn?: number;
  meldCount: number;
  handTileCount: number;       // 手牌の残り枚数（内容は非公開！）
}

export interface SanitizedPlayerView {
  roundWind: 'east' | 'south';
  roundNumber: number;
  honba: number;
  riichiSticks: number;
  doraMarkers: Tile[];
  wallRemainingCount: number;  // 残り山枚数 (何枚残っているかのみ)
  currentTurn: number;         // 現在の巡目
  
  // 自分の情報
  myPlayerIndex: number;
  mySeatWind: Wind;
  myScore: number;
  myHand: Tile[];              // 自分の手牌
  myDrawnTile: Tile | null;    // 自分のツモ牌
  myDiscards: DiscardTile[];
  myMelds: Meld[];
  myIsRiichi: boolean;
  
  // 他家3人の公開情報（手牌の中身は含まない）
  opponents: [OpponentPublicView, OpponentPublicView, OpponentPublicView];
}
```
