import React from 'react';
import { GameState } from '../core/types/game';
import { Trophy, Award, ArrowRight, RefreshCw } from 'lucide-react';

interface RoundResultModalProps {
  gameState: GameState;
  onNextRound: () => void;
  onResetGame: () => void;
}

export const RoundResultModal: React.FC<RoundResultModalProps> = ({
  gameState,
  onNextRound,
  onResetGame,
}) => {
  const result = gameState.roundResult;
  if (!result) return null;

  const isGameOver = gameState.phase === 'game_over';
  const scoreResult = result.scoreResult;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-6 shadow-2xl max-w-lg w-full flex flex-col gap-4 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-black text-lg text-amber-400">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>{isGameOver ? '対局終了 (GAME OVER)' : '局終了リザルト'}</span>
          </div>
          <span className="text-xs bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-slate-400 font-bold">
            {gameState.roundWind === 'east' ? '東' : '南'}
            {gameState.roundNumber}局 ({gameState.honba}本場)
          </span>
        </div>

        {/* 和了サマリー */}
        <div className="text-center py-2 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800 shadow-inner">
          <div className="text-base font-bold text-slate-200">{result.message}</div>
          {scoreResult && (
            <div className="text-2xl font-black text-amber-400 mt-1 flex items-center justify-center gap-2">
              <span>{scoreResult.title}</span>
              <span className="text-base font-bold text-slate-300">({scoreResult.finalGain}点)</span>
            </div>
          )}
        </div>

        {/* 役一覧 & 符内訳 */}
        {scoreResult && (
          <div className="flex flex-col gap-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4 text-amber-500" />
                成立した役一覧
              </span>
              <span className="font-mono text-amber-400 font-bold">
                計 {scoreResult.han}翻 / {scoreResult.fu}符
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {scoreResult.yakuList.map((yaku, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-bold"
                >
                  <span className="text-slate-200">{yaku.nameJa}</span>
                  <span className="text-amber-400 font-mono">
                    {yaku.isYakuman ? '役満' : `${yaku.han}翻`}
                  </span>
                </div>
              ))}
            </div>

            {/* 符計算の根拠・詳細 */}
            {scoreResult.fuDetails && scoreResult.fuDetails.explanation.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="font-bold text-slate-300">符計算の内訳:</div>
                <div className="flex flex-wrap gap-1.5">
                  {scoreResult.fuDetails.explanation.map((exp, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[10px]"
                    >
                      {exp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 点数移動テーブル */}
        <div className="flex flex-col gap-2 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-bold text-slate-400 border-b border-slate-800 pb-1">
            各プレイヤーの点数移動
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {gameState.players.map((p, idx) => {
              const change = result.scoreChanges ? result.scoreChanges[idx] : 0;
              return (
                <div key={idx} className="flex flex-col p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-bold text-slate-300 truncate">{p.name}</span>
                  <span className="text-sm font-black text-slate-100 font-mono my-0.5">
                    {p.score}点
                  </span>
                  {change !== 0 && (
                    <span
                      className={`text-[11px] font-bold font-mono ${
                        change > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {change > 0 ? `+${change}` : `${change}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ボタン操作 */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isGameOver ? (
            <button
              type="button"
              onClick={onResetGame}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
              最初から対局を始める
            </button>
          ) : (
            <button
              type="button"
              onClick={onNextRound}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl shadow-lg transition text-sm"
            >
              <span>次の局へ進む</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
