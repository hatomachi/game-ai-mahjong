import React, { useState } from 'react';
import { PendingAction } from '../core/types/game';
import { ChiOption } from '../core/meld/meldChecker';
import { MahjongTile } from './tiles/MahjongTile';
import { getTileNameJa } from '../core/utils/tileUtils';
import { Hand, X, Sparkles, Check } from 'lucide-react';

interface ActionDialogProps {
  pendingAction: PendingAction;
  onResolveAction: (
    actionType: 'ron' | 'pon' | 'chi' | 'daiminkan' | 'pass',
    selectedChiOption?: ChiOption
  ) => void;
}

export const ActionDialog: React.FC<ActionDialogProps> = ({
  pendingAction,
  onResolveAction,
}) => {
  const [selectedChiIndex, setSelectedChiIndex] = useState<number>(0);
  const { availableMelds, canRon, ronScoreResult, targetTile, fromPlayerIndex } = pendingAction;

  const targetPlayerName =
    fromPlayerIndex === 1
      ? '下家 (CPU-1)'
      : fromPlayerIndex === 2
      ? '対面 (CPU-2)'
      : fromPlayerIndex === 3
      ? '上家 (CPU-3)'
      : '他家';

  const chiOptions = availableMelds.chiOptions || [];
  const activeChi = chiOptions[selectedChiIndex] || chiOptions[0];

  return (
    <div className="absolute bottom-[95px] sm:bottom-[150px] left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-2 sm:px-3 pointer-events-auto animate-in slide-in-from-bottom-3 duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md border-2 border-amber-400 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.85)] text-slate-100 flex flex-col gap-2 sm:gap-3">
        {/* ヘッダー: 誰の打牌に対するアクションかを明示 */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 sm:pb-2.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1 sm:p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/40">
              <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <span className="font-black text-xs sm:text-sm text-amber-300">アクション確認</span>
              <span className="text-[11px] sm:text-xs text-slate-300 ml-1.5 sm:ml-2">
                {targetPlayerName} の打牌
              </span>
            </div>
          </div>

          {/* 打牌された対象牌を大きくアイキャッチ表示 */}
          {targetTile && (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-950 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border border-amber-500/40 shadow-inner">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold">打牌:</span>
              <MahjongTile tile={targetTile} size="xs" />
              <span className="text-[11px] sm:text-xs font-black text-amber-300">
                【{getTileNameJa(targetTile)}】
              </span>
            </div>
          )}
        </div>

        {/* ロン和了可能な場合 */}
        {canRon && ronScoreResult && (
          <div className="bg-gradient-to-r from-rose-950/90 via-red-950/80 to-rose-950/90 border-2 border-rose-500 rounded-xl p-2.5 sm:p-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-spin" />
              <div>
                <div className="text-[10px] sm:text-[11px] font-bold text-rose-300 uppercase tracking-wider">
                  ロン和了可能！
                </div>
                <div className="text-sm sm:text-base font-black text-rose-200">
                  {ronScoreResult.title} ({ronScoreResult.finalGain.toLocaleString()}点)
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onResolveAction('ron')}
              className="px-4 sm:px-6 py-1.5 sm:py-2.5 bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 hover:from-rose-500 hover:to-red-400 text-white font-black rounded-xl shadow-lg shadow-rose-600/40 text-xs sm:text-sm animate-bounce"
            >
              ロン！
            </button>
          </div>
        )}

        {/* チー可能な場合：手牌のどの牌と組み合わせて順子を作るかを明確に表示 */}
        {availableMelds.canChi && chiOptions.length > 0 && (
          <div className="flex flex-col gap-1.5 sm:gap-2 bg-slate-950/70 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-800">
            <div className="text-[11px] sm:text-xs text-emerald-300 font-bold flex items-center justify-between">
              <span>チーする順子の組み合わせ:</span>
              {chiOptions.length > 1 && (
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-normal">
                  （牌を選択してください）
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
              {chiOptions.map((opt, idx) => {
                const isSelected = selectedChiIndex === idx;
                const t1Name = getTileNameJa(opt.tiles[0]);
                const t2Name = getTileNameJa(opt.tiles[1]);
                const targetName = getTileNameJa(opt.targetTile);

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedChiIndex(idx)}
                    className={`flex items-center justify-between p-1.5 sm:p-2 rounded-lg sm:rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-400 shadow-md'
                        : 'bg-slate-900/80 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-0.5">
                        <MahjongTile tile={opt.tiles[0]} size="xs" />
                        <MahjongTile tile={opt.tiles[1]} size="xs" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold mx-0.5">+</span>
                      <MahjongTile tile={opt.targetTile} size="xs" />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-200">
                        【{t1Name} {t2Name} + {targetName}】
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ボタン一覧: チー・ポン・カン・パス */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-wrap pt-0.5">
          <div className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
            ※AIチャットで「鳴くべき？」等のアドバイスも確認可能
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto w-full sm:w-auto justify-end">
            {availableMelds.canChi && (
              <button
                type="button"
                onClick={() => onResolveAction('chi', activeChi)}
                className="px-3 sm:px-5 py-1.5 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-lg sm:rounded-xl text-[11px] sm:text-xs transition shadow-lg shadow-emerald-900/40 flex items-center gap-1"
              >
                <span>チー</span>
                {activeChi && (
                  <span className="text-[9px] sm:text-[10px] bg-emerald-950/90 px-1 sm:px-1.5 py-0.5 rounded font-normal text-emerald-200">
                    [{getTileNameJa(activeChi.tiles[0])}{getTileNameJa(activeChi.tiles[1])}]
                  </span>
                )}
              </button>
            )}

            {availableMelds.canPon && (
              <button
                type="button"
                onClick={() => onResolveAction('pon')}
                className="px-3.5 sm:px-5 py-1.5 sm:py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-black rounded-lg sm:rounded-xl text-[11px] sm:text-xs transition shadow-lg shadow-amber-900/40"
              >
                ポン
              </button>
            )}

            {availableMelds.canDaiminkan && (
              <button
                type="button"
                onClick={() => onResolveAction('daiminkan')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg sm:rounded-xl text-[11px] sm:text-xs transition shadow-md"
              >
                カン
              </button>
            )}

            <button
              type="button"
              onClick={() => onResolveAction('pass')}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-lg sm:rounded-xl text-[11px] sm:text-xs transition flex items-center gap-1 border border-slate-700"
            >
              <X className="w-3.5 h-3.5" />
              パス
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
