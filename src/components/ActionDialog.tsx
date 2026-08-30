import React, { useState } from 'react';
import { PendingAction } from '../core/types/game';
import { ChiOption } from '../core/meld/meldChecker';
import { TileView } from './TileView';
import { Hand, X } from 'lucide-react';

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
  const [selectedChi, setSelectedChi] = useState<ChiOption | null>(null);
  const { availableMelds, canRon, ronScoreResult } = pendingAction;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-5 shadow-2xl max-w-md w-full flex flex-col gap-4 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <Hand className="w-5 h-5" />
            <span>アクション選択</span>
          </div>
          <span className="text-xs text-slate-400">他家の打牌に対して宣言できます</span>
        </div>

        {/* ロン和了の案内 */}
        {canRon && ronScoreResult && (
          <div className="bg-rose-950/60 border border-rose-600/60 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-300">ロン和了可能！</div>
              <div className="text-sm font-black text-rose-400">
                {ronScoreResult.title} ({ronScoreResult.finalGain}点)
              </div>
            </div>
            <button
              type="button"
              onClick={() => onResolveAction('ron')}
              className="px-5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black rounded-lg shadow-lg shadow-rose-600/30 text-sm animate-pulse"
            >
              ロン！
            </button>
          </div>
        )}

        {/* チーの候補が複数ある場合 */}
        {availableMelds.canChi && availableMelds.chiOptions.length > 1 && (
          <div className="flex flex-col gap-2">
            <div className="text-xs text-slate-300 font-bold">チーする面子を選択:</div>
            <div className="flex flex-col gap-1.5">
              {availableMelds.chiOptions.map((opt, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedChi(opt)}
                  className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition ${
                    selectedChi === opt
                      ? 'bg-amber-950/60 border-amber-400 ring-1 ring-amber-400'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <TileView tile={opt.tiles[0]} size="sm" />
                    <TileView tile={opt.tiles[1]} size="sm" />
                    <span className="text-xs text-slate-400 mx-1">+</span>
                    <TileView tile={opt.targetTile} size="sm" />
                  </div>
                  <span className="text-xs font-bold text-amber-400">選択</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 各種操作ボタン */}
        <div className="flex items-center justify-end gap-2 flex-wrap pt-2 border-t border-slate-800">
          {availableMelds.canPon && (
            <button
              type="button"
              onClick={() => onResolveAction('pon')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-sm transition shadow"
            >
              ポン
            </button>
          )}

          {availableMelds.canDaiminkan && (
            <button
              type="button"
              onClick={() => onResolveAction('daiminkan')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-sm transition shadow"
            >
              カン (明槓)
            </button>
          )}

          {availableMelds.canChi && (
            <button
              type="button"
              onClick={() => {
                const opt = selectedChi || availableMelds.chiOptions[0];
                onResolveAction('chi', opt);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm transition shadow"
            >
              チー
            </button>
          )}

          <button
            type="button"
            onClick={() => onResolveAction('pass')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-lg text-sm transition flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            パス
          </button>
        </div>
      </div>
    </div>
  );
};
