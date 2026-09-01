import React, { useState } from 'react';
import { MahjongTile } from './tiles/MahjongTile';
import { getTileNameJa } from '../core/utils/tileUtils';
import { calcShanten } from '../core/shanten/shanten';
import { calcUkeireFor13Tiles, calcUkeireForDiscards } from '../core/shanten/ukeire';
import { checkWinningHand } from '../core/winning/winningHand';
import { Sparkles, Trophy, Zap } from 'lucide-react';
import { PlayerState } from '../core/types/game';

interface HandViewProps {
  player: PlayerState;
  isMyTurn: boolean;
  onDiscard: (tileId: string, isTsumo: boolean, declareRiichi?: boolean) => void;
  onDeclareTsumoWin?: () => void;
}

export const HandView: React.FC<HandViewProps> = ({
  player,
  isMyTurn,
  onDiscard,
  onDeclareTsumoWin,
}) => {
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [isRiichiSelected, setIsRiichiSelected] = useState<boolean>(false);

  const { hand, drawnTile, isRiichi, score, melds } = player;

  // 14枚状態（ツモ牌あり）または 13枚状態でのシャンテン数・受け入れ計算
  const fullTiles = drawnTile ? [...hand, drawnTile] : hand;
  const shantenRes = calcShanten(fullTiles);

  // 13枚時の受け入れ（ツモ前または打牌後）
  const ukeire13 = hand.length === 13 ? calcUkeireFor13Tiles(hand) : null;

  // 打牌番（14枚、または副露時の11枚、8枚、5枚など）での何切る分析
  const canDiscardNow = fullTiles.length % 3 === 2;
  const discardsAnalysis = canDiscardNow ? calcUkeireForDiscards(fullTiles) : [];
  const bestDiscard = discardsAnalysis.length > 0 ? discardsAnalysis[0] : null;

  // 和了可能かどうか
  const winCheck = canDiscardNow ? checkWinningHand(fullTiles) : { isWin: false };

  // リーチ可能判定: 門前かつシャンテン数0（テンパイ）かつ未リーチかつ持ち点1000以上
  const isMenzen = melds.every((m) => m.type === 'ankan');
  const canDeclareRiichi =
    isMyTurn &&
    isMenzen &&
    !isRiichi &&
    shantenRes.shanten === 0 &&
    score >= 1000;

  const handleTileClick = (tileId: string) => {
    if (!isMyTurn) return;
    if (selectedTileId === tileId) {
      // 2回クリックで打牌
      onDiscard(tileId, drawnTile?.id === tileId, isRiichiSelected);
      setSelectedTileId(null);
      setIsRiichiSelected(false);
    } else {
      setSelectedTileId(tileId);
    }
  };

  const getShantenLabel = (shanten: number) => {
    if (shanten === -1) return '🎉 アガリ形 (和了可能)';
    if (shanten === 0) return '🎯 テンパイ (聴牌)';
    if (shanten === 1) return '⚡ 1向聴 (イーシャンテン)';
    if (shanten === 2) return '🎲 2向聴 (リャンシャンテン)';
    return `📦 ${shanten}向聴`;
  };

  return (
    <div className="bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-[#1a0f07]/95 rounded-xl sm:rounded-2xl border-2 border-amber-950/80 p-2 sm:p-3.5 shadow-2xl flex flex-col gap-1.5 sm:gap-2.5 select-none">
      {/* 上部ステータスバー: シャンテン数・有効牌・操作アクション */}
      <div className="flex items-center justify-between flex-wrap gap-1.5 text-xs border-b border-slate-800/80 pb-1.5 sm:pb-2">
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border border-slate-800 font-bold shadow-inner">
            <span
              className={`text-[11px] sm:text-xs ${
                shantenRes.shanten <= 0
                  ? 'text-amber-400 font-black'
                  : shantenRes.shanten === 1
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-300'
              }`}
            >
              {getShantenLabel(shantenRes.shanten)}
            </span>
          </div>

          {/* 13枚テンパイ時の待ち牌表示 */}
          {ukeire13 && ukeire13.currentShanten === 0 && (
            <div className="text-[10px] sm:text-[11px] text-amber-300 flex items-center gap-1 bg-amber-950/40 px-1.5 sm:px-2 py-0.5 rounded border border-amber-600/40">
              <span className="font-bold">待ち:</span>
              <div className="flex gap-0.5 sm:gap-1">
                {ukeire13.ukeireTiles.map((t) => (
                  <span key={t.tileCode} className="font-bold bg-amber-900/60 text-amber-200 px-1 rounded">
                    {t.tileCode} ({t.remainingCount})
                  </span>
                ))}
              </div>
              <span className="text-slate-400">計{ukeire13.totalUkeireCount}枚</span>
            </div>
          )}

          {/* 最適打牌ヒント（14枚時） */}
          {bestDiscard && isMyTurn && (
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-300 bg-emerald-950/60 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-700/50">
              <Sparkles className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span>推奨: 【{getTileNameJa(bestDiscard.discardTile)}】({bestDiscard.totalUkeireCount}枚)</span>
            </div>
          )}
        </div>

        {/* 打牌・アガリ・リーチ操作ボタン */}
        <div className="flex items-center gap-1.5 ml-auto">
          {winCheck.isWin && isMyTurn && onDeclareTsumoWin && (
            <button
              type="button"
              onClick={onDeclareTsumoWin}
              className="flex items-center gap-1 px-3 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black rounded-lg sm:rounded-xl shadow-lg shadow-amber-500/30 text-[11px] sm:text-xs animate-bounce"
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ツモアガリ！
            </button>
          )}

          {canDeclareRiichi && (
            <button
              type="button"
              onClick={() => setIsRiichiSelected(!isRiichiSelected)}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 font-black rounded-lg sm:rounded-xl text-[11px] sm:text-xs transition shadow-md ${
                isRiichiSelected
                  ? 'bg-rose-600 text-white ring-2 ring-rose-400 animate-pulse'
                  : 'bg-gradient-to-r from-rose-900 to-rose-950 hover:from-rose-800 hover:to-rose-900 border border-rose-600/60 text-rose-200'
              }`}
            >
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
              {isRiichiSelected ? 'リーチ中' : 'リーチ'}
            </button>
          )}

          {selectedTileId && isMyTurn && (
            <button
              type="button"
              onClick={() => {
                const isTsumo = drawnTile?.id === selectedTileId;
                onDiscard(selectedTileId, isTsumo, isRiichiSelected);
                setSelectedTileId(null);
                setIsRiichiSelected(false);
              }}
              className={`px-3 sm:px-3.5 py-1 sm:py-1.5 font-bold rounded-lg sm:rounded-xl shadow-lg text-[11px] sm:text-xs transition ${
                isRiichiSelected
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isRiichiSelected ? 'リーチ切る' : '打牌'}
            </button>
          )}

          {drawnTile && isMyTurn && (
            <button
              type="button"
              onClick={() => {
                onDiscard(drawnTile.id, true, isRiichiSelected);
                setSelectedTileId(null);
                setIsRiichiSelected(false);
              }}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-sky-700/80 hover:bg-sky-600 border border-sky-500/50 text-white font-medium rounded-lg sm:rounded-xl text-[11px] sm:text-xs transition shadow"
            >
              ツモ切
            </button>
          )}
        </div>
      </div>

      {/* 手牌タイル一覧（高級木製牌スタンド風） */}
      <div className="relative pt-1.5 pb-1 px-1 sm:px-2 bg-gradient-to-b from-[#2d1b10] to-[#1a0e08] rounded-lg sm:rounded-xl border border-amber-900/60 shadow-inner flex items-center justify-center overflow-x-hidden">
        {/* 13枚の手牌 */}
        <div className="flex items-end gap-0.5 sm:gap-1">
          {hand.map((tile) => (
            <MahjongTile
              key={tile.id}
              tile={tile}
              isSelected={selectedTileId === tile.id}
              onClick={() => handleTileClick(tile.id)}
              size="responsive"
            />
          ))}
        </div>

        {/* ツモ牌（右側にスペースを空けて配置） */}
        {drawnTile && (
          <div className="flex items-end pl-1 sm:pl-3 ml-1 sm:ml-2 border-l border-amber-700/40 relative">
            <span className="absolute -top-3 left-1 sm:left-3 text-[8px] sm:text-[10px] text-amber-400 font-bold tracking-wider uppercase">
              ツモ
            </span>
            <MahjongTile
              tile={drawnTile}
              isSelected={selectedTileId === drawnTile.id}
              isDrawn={true}
              size="responsive"
              onClick={() => handleTileClick(drawnTile.id)}
            />
          </div>
        )}
      </div>

      {!isMyTurn && (
        <div className="text-center text-[10px] sm:text-[11px] text-slate-400 italic">
          他家の手番です（思考中...）
        </div>
      )}
    </div>
  );
};
