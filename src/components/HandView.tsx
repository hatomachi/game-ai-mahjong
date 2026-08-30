import React, { useState } from 'react';
import { TileView } from './TileView';
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

  // 14枚時の何切る分析
  const discardsAnalysis = fullTiles.length === 14 ? calcUkeireForDiscards(fullTiles) : [];
  const bestDiscard = discardsAnalysis.length > 0 ? discardsAnalysis[0] : null;

  // 和了可能かどうか
  const winCheck = fullTiles.length === 14 ? checkWinningHand(fullTiles) : { isWin: false };

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
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col gap-3">
      {/* 上部ステータスバー: シャンテン数・有効牌・操作アクション */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-b border-slate-800 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-bold">
            <span
              className={`${
                shantenRes.shanten <= 0
                  ? 'text-amber-400'
                  : shantenRes.shanten === 1
                  ? 'text-emerald-400'
                  : 'text-slate-300'
              }`}
            >
              {getShantenLabel(shantenRes.shanten)}
            </span>
          </div>

          {/* 13枚テンパイ時の受け入れ枚数表示 */}
          {ukeire13 && ukeire13.currentShanten === 0 && (
            <div className="text-[11px] text-amber-300 flex items-center gap-1">
              <span>待ち牌:</span>
              <div className="flex gap-1">
                {ukeire13.ukeireTiles.map((t) => (
                  <span key={t.tileCode} className="font-bold bg-amber-950/60 px-1 rounded border border-amber-700/40">
                    {t.tileCode} ({t.remainingCount}枚)
                  </span>
                ))}
              </div>
              <span className="text-slate-400">計 {ukeire13.totalUkeireCount} 枚</span>
            </div>
          )}

          {/* 最適打牌ヒント（14枚時） */}
          {bestDiscard && isMyTurn && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-700/40">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>推奨打牌: 【{getTileNameJa(bestDiscard.discardTile)}】(受入{bestDiscard.totalUkeireCount}枚)</span>
            </div>
          )}
        </div>

        {/* 打牌・アガリ・リーチ操作ボタン */}
        <div className="flex items-center gap-2">
          {winCheck.isWin && isMyTurn && onDeclareTsumoWin && (
            <button
              type="button"
              onClick={onDeclareTsumoWin}
              className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-lg shadow-lg shadow-amber-500/20 text-xs animate-bounce"
            >
              <Trophy className="w-4 h-4" />
              ツモアガリ！
            </button>
          )}

          {canDeclareRiichi && (
            <button
              type="button"
              onClick={() => setIsRiichiSelected(!isRiichiSelected)}
              className={`flex items-center gap-1 px-3 py-1.5 font-bold rounded-lg text-xs transition shadow ${
                isRiichiSelected
                  ? 'bg-rose-600 text-white ring-2 ring-rose-400 animate-pulse'
                  : 'bg-rose-950/80 hover:bg-rose-900 border border-rose-600/60 text-rose-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {isRiichiSelected ? 'リーチ宣言中 (牌を選択)' : 'リーチ'}
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
              className={`px-3.5 py-1.5 font-bold rounded-lg shadow text-xs transition ${
                isRiichiSelected
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {isRiichiSelected ? 'リーチして切る' : '選択した牌を切る'}
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
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs transition"
            >
              ツモ切り
            </button>
          )}
        </div>
      </div>

      {/* 手牌タイル一覧 */}
      <div className="flex items-center justify-center gap-1.5 py-1 overflow-x-auto">
        <div className="flex items-center gap-1">
          {hand.map((tile) => (
            <TileView
              key={tile.id}
              tile={tile}
              isSelected={selectedTileId === tile.id}
              onClick={() => handleTileClick(tile.id)}
              size="lg"
            />
          ))}
        </div>

        {drawnTile && (
          <div className="flex items-center pl-2 ml-1 border-l border-slate-700">
            <span className="text-emerald-400 font-bold text-xs mr-1 select-none">
              ツモ
            </span>
            <TileView
              tile={drawnTile}
              isSelected={selectedTileId === drawnTile.id}
              isDrawn={true}
              size="lg"
              onClick={() => handleTileClick(drawnTile.id)}
            />
          </div>
        )}
      </div>

      {!isMyTurn && (
        <div className="text-center text-[11px] text-slate-500 italic">
          他家の手番です（CPUが思考中...）
        </div>
      )}
    </div>
  );
};
