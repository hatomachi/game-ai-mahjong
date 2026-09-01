import React from 'react';
import { GameState } from '../core/types/game';
import { MahjongTile } from './tiles/MahjongTile';
import { HandView } from './HandView';
import { PlayerRiver } from './table/PlayerRiver';
import { CenterSquare } from './table/CenterSquare';
import { GameControls } from './GameControls';
import { MeldsView } from './MeldsView';
import { ActionDialog } from './ActionDialog';
import { RoundResultModal } from './RoundResultModal';
import { User, Cpu, Zap } from 'lucide-react';
import { ChiOption } from '../core/meld/meldChecker';

interface MahjongTableProps {
  gameState: GameState;
  isAutoPlay: boolean;
  onStartRound: () => void;
  onToggleAutoPlay: () => void;
  onStepForward: () => void;
  onResetGame: () => void;
  onNextRound: () => void;
  onPlayerDiscard: (tileId: string, isTsumo: boolean, declareRiichi?: boolean) => void;
  onDeclareTsumoWin: () => void;
  onResolveAction: (
    actionType: 'ron' | 'pon' | 'chi' | 'daiminkan' | 'pass',
    selectedChiOption?: ChiOption
  ) => void;
  onLoadScenario?: (scenario: 'riichi_defense' | 'tenpai_choice') => void;
  onOpenCoach?: (prompt?: string) => void;
}

export const MahjongTable: React.FC<MahjongTableProps> = ({
  gameState,
  isAutoPlay,
  onStartRound,
  onToggleAutoPlay,
  onStepForward,
  onResetGame,
  onNextRound,
  onPlayerDiscard,
  onDeclareTsumoWin,
  onResolveAction,
  onLoadScenario,
  onOpenCoach,
}) => {
  const me = gameState.players[0];
  const shimocha = gameState.players[1]; // 下家 (右)
  const toimen = gameState.players[2];   // 対面 (上)
  const kamicha = gameState.players[3];  // 上家 (左)

  const isMyTurn = gameState.activePlayerIndex === 0 && gameState.phase === 'player_turn';

  const getWindJa = (wind: string) => {
    switch (wind) {
      case 'east': return '東';
      case 'south': return '南';
      case 'west': return '西';
      case 'north': return '北';
      default: return wind;
    }
  };

  const humanPendingAction = gameState.pendingActions?.find((a) => a.playerIndex === 0);

  // 横向き・直立の他家手牌（伏せ牌）レンダリング
  const renderOpponentStandingHand = (count: number, hasDrawn: boolean = false, isVertical: boolean = false) => {
    if (isVertical) {
      return (
        <div className="flex flex-col gap-0.5 items-center">
          {Array.from({ length: count }).map((_, i) => (
            <MahjongTile key={i} size="xs" hidden={true} isStanding={true} orientation="left" />
          ))}
          {hasDrawn && (
            <div className="mt-1.5 ring-1 ring-amber-400 rounded-sm">
              <MahjongTile size="xs" hidden={true} isStanding={true} orientation="left" />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: count }).map((_, i) => (
          <MahjongTile key={i} size="xs" hidden={true} isStanding={true} />
        ))}
        {hasDrawn && (
          <div className="ml-1.5 ring-1 ring-amber-400 rounded-sm">
            <MahjongTile size="xs" hidden={true} isStanding={true} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#070d09] text-slate-100 p-1.5 sm:p-3 space-y-1.5 sm:space-y-2.5 overflow-y-auto pb-16 lg:pb-2 relative select-none">
      {/* 1. 上部コントロールバー */}
      <div className="flex items-center justify-between flex-wrap gap-1.5 sm:gap-2 bg-slate-900/90 p-2 sm:p-2.5 rounded-xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-1.5 sm:gap-3 text-xs flex-wrap">
          <div className="font-black text-sm sm:text-base text-amber-400 flex items-center gap-1 bg-amber-950/40 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border border-amber-600/40">
            <span>
              {gameState.roundWind === 'east' ? '東' : '南'}
              {gameState.roundNumber}局
            </span>
            <span className="text-[10px] sm:text-xs font-normal text-slate-300">
              ({gameState.honba}本場)
            </span>
          </div>

          {/* 供託表示 */}
          {gameState.riichiSticks > 0 && (
            <div className="flex items-center gap-1 bg-rose-950/80 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-rose-600/50 text-rose-300 text-[10px] sm:text-xs font-bold shadow animate-pulse">
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400" />
              <span>供託: {gameState.riichiSticks * 1000}点</span>
            </div>
          )}

          <div className="text-[10px] sm:text-[11px] text-slate-300 flex items-center gap-1.5 sm:gap-2">
            <span>
              残: <span className="font-mono text-emerald-400 font-bold">{gameState.wall.length}</span>
            </span>
            <span>/</span>
            <span>
              巡: <span className="font-mono text-slate-100 font-bold">{gameState.turnCount}</span>
            </span>
          </div>
        </div>

        {/* コントロールボタン群 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <GameControls
            phase={gameState.phase}
            isAutoPlay={isAutoPlay}
            onStartRound={onStartRound}
            onToggleAutoPlay={onToggleAutoPlay}
            onStepForward={onStepForward}
            onResetGame={onResetGame}
            onNextRound={onNextRound}
          />

          {onLoadScenario && (
            <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5">
              <button
                type="button"
                onClick={() => {
                  onLoadScenario('riichi_defense');
                  onOpenCoach?.();
                }}
                className="px-1.5 sm:px-2 py-1 bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded text-[10px] sm:text-[11px] transition shadow"
                title="リーチ相手への牌読み相談シナリオをロード"
              >
                牌読み
              </button>
              <button
                type="button"
                onClick={() => {
                  onLoadScenario('tenpai_choice');
                  onOpenCoach?.();
                }}
                className="px-1.5 sm:px-2 py-1 bg-amber-950/70 hover:bg-amber-900 border border-amber-800 text-amber-300 rounded text-[10px] sm:text-[11px] transition shadow"
                title="多面張何切る相談シナリオをロード"
              >
                何切る
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. 四方リアル麻雀卓グラフィック（木製フレーム ＋ 深緑フェルト） */}
      <div className="relative flex-1 min-h-[440px] sm:min-h-[520px] rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#0b3318] via-[#092b14] to-[#061d0d] border-4 sm:border-[6px] border-[#2e180d] shadow-[inset_0_0_40px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.6)] p-1.5 sm:p-3 flex flex-col justify-between overflow-hidden">
        {/* フェルト布地のマット感グラデーション */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(18,84,40,0.3)_0%,rgba(0,0,0,0.5)_100%)]" />

        {/* (A) 対面 (CPU-2) - 奥・上側 */}
        <div className="relative z-10 flex items-start justify-between border-b border-emerald-800/30 pb-1.5 sm:pb-2 px-1.5 sm:px-3">
          {/* 対面プレイヤー情報 */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-950/70 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-emerald-800/40 shadow-md">
            <div
              className={`p-1 rounded-md sm:rounded-lg border transition-all ${
                gameState.activePlayerIndex === 2
                  ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400 animate-pulse'
                  : 'bg-emerald-950 border-emerald-700/50 text-emerald-400'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs font-bold text-emerald-100 flex items-center gap-1">
                <span>{toimen.name} ({getWindJa(toimen.seatWind)})</span>
                {toimen.isRiichi && (
                  <span className="bg-rose-600 text-white text-[7px] sm:text-[8px] px-1 py-0.2 rounded font-black shadow animate-pulse">
                    立直
                  </span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] text-amber-300 font-mono font-bold">
                {toimen.score.toLocaleString()}点
              </div>
            </div>
          </div>

          {/* 対面の手牌 & 副露牌 */}
          <div className="flex flex-col gap-1 items-end">
            <div className="flex items-center gap-1.5 sm:gap-3">
              {toimen.melds.length > 0 && <MeldsView melds={toimen.melds} size="xs" />}
              {renderOpponentStandingHand(toimen.hand.length, !!toimen.drawnTile)}
            </div>
          </div>
        </div>

        {/* (B) 卓中央エリア: 上家(左) - 河・中央センターボックス・河 - 下家(右) */}
        <div className="relative z-10 grid grid-cols-12 gap-1 sm:gap-2 my-auto items-center">
          {/* 上家エリア (CPU-3 / 左) */}
          <div className="col-span-3 flex items-center gap-1 sm:gap-2">
            {/* 上家手牌（縦並び） */}
            <div className="hidden md:block">
              {renderOpponentStandingHand(kamicha.hand.length, !!kamicha.drawnTile, true)}
            </div>

            {/* 上家情報 & 河 */}
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center justify-between bg-slate-950/70 p-1 sm:p-1.5 rounded-md sm:rounded-lg border border-emerald-800/40">
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-100 flex items-center gap-0.5 truncate">
                  <Cpu className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{kamicha.name}</span>
                </span>
                <span className="text-[8px] sm:text-[10px] font-mono text-amber-300 font-bold ml-1">
                  {kamicha.score.toLocaleString()}
                </span>
              </div>
              {kamicha.melds.length > 0 && <MeldsView melds={kamicha.melds} size="xs" />}
              <PlayerRiver
                discards={kamicha.discards}
                playerName={kamicha.name}
                position="left"
                isCurrentPlayer={gameState.activePlayerIndex === 3}
                size="xs"
              />
            </div>
          </div>

          {/* 卓中央（対面の河 + センターボックス + 自家の河） */}
          <div className="col-span-6 flex flex-col items-center justify-center gap-1 sm:gap-2">
            {/* 対面の河 (画面奥・上) */}
            <div className="w-full max-w-[220px] min-[390px]:max-w-[240px] sm:max-w-[280px]">
              <PlayerRiver
                discards={toimen.discards}
                playerName={toimen.name}
                position="top"
                isCurrentPlayer={gameState.activePlayerIndex === 2}
                size="xs"
              />
            </div>

            {/* 中央センターボックス（局数・LED・王牌/カン山・リーチ棒・本場棒） */}
            <CenterSquare gameState={gameState} />

            {/* 自家の河 (画面手前・下) */}
            <div className="w-full max-w-[220px] min-[390px]:max-w-[240px] sm:max-w-[280px]">
              <PlayerRiver
                discards={me.discards}
                playerName="自家 (あなた)"
                position="bottom"
                isCurrentPlayer={gameState.activePlayerIndex === 0}
                size="xs"
              />
            </div>
          </div>

          {/* 下家エリア (CPU-1 / 右) */}
          <div className="col-span-3 flex items-center gap-1 sm:gap-2 justify-end">
            {/* 下家情報 & 河 */}
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center justify-between bg-slate-950/70 p-1 sm:p-1.5 rounded-md sm:rounded-lg border border-emerald-800/40">
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-100 flex items-center gap-0.5 truncate">
                  <Cpu className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{shimocha.name}</span>
                </span>
                <span className="text-[8px] sm:text-[10px] font-mono text-amber-300 font-bold ml-1">
                  {shimocha.score.toLocaleString()}
                </span>
              </div>
              {shimocha.melds.length > 0 && <MeldsView melds={shimocha.melds} size="xs" />}
              <PlayerRiver
                discards={shimocha.discards}
                playerName={shimocha.name}
                position="right"
                isCurrentPlayer={gameState.activePlayerIndex === 1}
                size="xs"
              />
            </div>

            {/* 下家手牌（縦並び） */}
            <div className="hidden md:block">
              {renderOpponentStandingHand(shimocha.hand.length, !!shimocha.drawnTile, true)}
            </div>
          </div>
        </div>

        {/* (C) 自家 (プレイヤー) - 手前・下側 */}
        <div className="relative z-10 w-full mt-1 sm:mt-2">
          {/* 自家ステータスバー & 副露 */}
          <div className="flex items-center justify-between mb-1 px-1 sm:px-2">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-950/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border border-blue-600/40 shadow">
              <div className="p-0.5 sm:p-1 bg-blue-600 text-white rounded-md">
                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-100">
                自家 ({getWindJa(me.seatWind)})
              </span>
              {me.isRiichi && (
                <span className="bg-rose-600 text-white text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.2 rounded font-black shadow animate-pulse">
                  立直中
                </span>
              )}
              <span className="text-[11px] sm:text-xs font-mono text-amber-400 font-black">
                {me.score.toLocaleString()}点
              </span>
            </div>

            {/* 自家の副露牌 */}
            {me.melds.length > 0 && <MeldsView melds={me.melds} size="xs" />}
          </div>

          {/* 自家手牌コンポーネント（高級木製スタンド・立体牌・操作ボタン） */}
          <HandView
            player={me}
            isMyTurn={isMyTurn}
            onDiscard={onPlayerDiscard}
            onDeclareTsumoWin={onDeclareTsumoWin}
          />
        </div>

        {/* 他家の打牌に対するアクション選択ダイアログ (ポン/チー/ロン/カン) */}
        {humanPendingAction && gameState.phase === 'waiting_action' && (
          <ActionDialog
            pendingAction={humanPendingAction}
            onResolveAction={onResolveAction}
          />
        )}
      </div>

      {/* 局終了・ゲーム終了リザルトモーダル */}
      {(gameState.phase === 'round_end' || gameState.phase === 'game_over') && (
        <RoundResultModal
          gameState={gameState}
          onNextRound={onNextRound}
          onResetGame={onResetGame}
        />
      )}
    </div>
  );
};
