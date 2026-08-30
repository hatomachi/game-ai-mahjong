import { YakuName } from './types';

export interface YakuDefinition {
  name: YakuName;
  nameJa: string;
  hanMenzen: number;
  hanOpen: number; // 0なら門前限定
  isYakuman?: boolean;
  yakumanMultiplier?: number;
}

export const YAKU_DEFINITIONS: Record<YakuName, YakuDefinition> = {
  // 1翻
  tsumo: { name: 'tsumo', nameJa: '門前清自摸和', hanMenzen: 1, hanOpen: 0 },
  riichi: { name: 'riichi', nameJa: '立直', hanMenzen: 1, hanOpen: 0 },
  ippatsu: { name: 'ippatsu', nameJa: '一発', hanMenzen: 1, hanOpen: 0 },
  pinfu: { name: 'pinfu', nameJa: '平和', hanMenzen: 1, hanOpen: 0 },
  tanyao: { name: 'tanyao', nameJa: '断幺九', hanMenzen: 1, hanOpen: 1 },
  iipeiko: { name: 'iipeiko', nameJa: '一盃口', hanMenzen: 1, hanOpen: 0 },
  yakuhai_haku: { name: 'yakuhai_haku', nameJa: '役牌 白', hanMenzen: 1, hanOpen: 1 },
  yakuhai_hatsu: { name: 'yakuhai_hatsu', nameJa: '役牌 發', hanMenzen: 1, hanOpen: 1 },
  yakuhai_chun: { name: 'yakuhai_chun', nameJa: '役牌 中', hanMenzen: 1, hanOpen: 1 },
  yakuhai_bakaze: { name: 'yakuhai_bakaze', nameJa: '役牌 場風', hanMenzen: 1, hanOpen: 1 },
  yakuhai_jikaze: { name: 'yakuhai_jikaze', nameJa: '役牌 自風', hanMenzen: 1, hanOpen: 1 },
  rinshan: { name: 'rinshan', nameJa: '嶺上開花', hanMenzen: 1, hanOpen: 1 },
  chankan: { name: 'chankan', nameJa: '槍槓', hanMenzen: 1, hanOpen: 1 },
  haitei: { name: 'haitei', nameJa: '海底摸月', hanMenzen: 1, hanOpen: 1 },
  houtei: { name: 'houtei', nameJa: '河底撈魚', hanMenzen: 1, hanOpen: 1 },

  // 2翻
  double_riichi: { name: 'double_riichi', nameJa: 'ダブル立直', hanMenzen: 2, hanOpen: 0 },
  sanshoku: { name: 'sanshoku', nameJa: '三色同順', hanMenzen: 2, hanOpen: 1 },
  ittsu: { name: 'ittsu', nameJa: '一気通貫', hanMenzen: 2, hanOpen: 1 },
  chanta: { name: 'chanta', nameJa: '混全帯幺九', hanMenzen: 2, hanOpen: 1 },
  chiitoitsu: { name: 'chiitoitsu', nameJa: '七対子', hanMenzen: 2, hanOpen: 0 },
  toitoi: { name: 'toitoi', nameJa: '対々和', hanMenzen: 2, hanOpen: 2 },
  sanankou: { name: 'sanankou', nameJa: '三暗刻', hanMenzen: 2, hanOpen: 2 },
  sankantsu: { name: 'sankantsu', nameJa: '三槓子', hanMenzen: 2, hanOpen: 2 },
  sanshoku_doukou: { name: 'sanshoku_doukou', nameJa: '三色同刻', hanMenzen: 2, hanOpen: 2 },
  honroutou: { name: 'honroutou', nameJa: '混老頭', hanMenzen: 2, hanOpen: 2 },
  shousangen: { name: 'shousangen', nameJa: '小三元', hanMenzen: 2, hanOpen: 2 },

  // 3翻
  honitsu: { name: 'honitsu', nameJa: '混一色', hanMenzen: 3, hanOpen: 2 },
  junchan: { name: 'junchan', nameJa: '純全帯幺九', hanMenzen: 3, hanOpen: 2 },
  ryanpeiko: { name: 'ryanpeiko', nameJa: '二盃口', hanMenzen: 3, hanOpen: 0 },

  // 6翻
  chinitsu: { name: 'chinitsu', nameJa: '清一色', hanMenzen: 6, hanOpen: 5 },

  // 役満
  kokushi: { name: 'kokushi', nameJa: '国士無双', hanMenzen: 13, hanOpen: 0, isYakuman: true, yakumanMultiplier: 1 },
  kokushi_13: { name: 'kokushi_13', nameJa: '国士無双十三面待ち', hanMenzen: 26, hanOpen: 0, isYakuman: true, yakumanMultiplier: 2 },
  suuankou: { name: 'suuankou', nameJa: '四暗刻', hanMenzen: 13, hanOpen: 0, isYakuman: true, yakumanMultiplier: 1 },
  suuankou_tanki: { name: 'suuankou_tanki', nameJa: '四暗刻単騎', hanMenzen: 26, hanOpen: 0, isYakuman: true, yakumanMultiplier: 2 },
  daisangen: { name: 'daisangen', nameJa: '大三元', hanMenzen: 13, hanOpen: 13, isYakuman: true, yakumanMultiplier: 1 },
  tsuuiisou: { name: 'tsuuiisou', nameJa: '字一色', hanMenzen: 13, hanOpen: 13, isYakuman: true, yakumanMultiplier: 1 },
  ryuuiisou: { name: 'ryuuiisou', nameJa: '緑一色', hanMenzen: 13, hanOpen: 13, isYakuman: true, yakumanMultiplier: 1 },
  chinroutou: { name: 'chinroutou', nameJa: '清老頭', hanMenzen: 13, hanOpen: 13, isYakuman: true, yakumanMultiplier: 1 },
  chuuren: { name: 'chuuren', nameJa: '九蓮宝燈', hanMenzen: 13, hanOpen: 0, isYakuman: true, yakumanMultiplier: 1 },
  chuuren_9: { name: 'chuuren_9', nameJa: '純正九蓮宝燈', hanMenzen: 26, hanOpen: 0, isYakuman: true, yakumanMultiplier: 2 },
  suukantsu: { name: 'suukantsu', nameJa: '四槓子', hanMenzen: 13, hanOpen: 13, isYakuman: true, yakumanMultiplier: 1 },
  tenhou: { name: 'tenhou', nameJa: '天和', hanMenzen: 13, hanOpen: 0, isYakuman: true, yakumanMultiplier: 1 },
  chiihou: { name: 'chiihou', nameJa: '地和', hanMenzen: 13, hanOpen: 0, isYakuman: true, yakumanMultiplier: 1 },
  shousuushii: { name: 'shousuushii', nameJa: '小四喜', hanMenzen: 13, hanOpen: 13, isYakuman: true, yakumanMultiplier: 1 },
  daisuushii: { name: 'daisuushii', nameJa: '大四喜', hanMenzen: 26, hanOpen: 26, isYakuman: true, yakumanMultiplier: 2 },

  // ドラ
  dora: { name: 'dora', nameJa: 'ドラ', hanMenzen: 1, hanOpen: 1 },
  uradora: { name: 'uradora', nameJa: '裏ドラ', hanMenzen: 1, hanOpen: 1 },
  red_dora: { name: 'red_dora', nameJa: '赤ドラ', hanMenzen: 1, hanOpen: 1 },
};
