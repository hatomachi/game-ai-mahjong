import React from 'react';

export type StickType = '1000' | '100' | '5000' | '10000';

interface StickViewProps {
  type: StickType;
  count?: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * 麻雀の点棒（リーチ棒/本場棒など）をリアルに描画するコンポーネント
 */
export const StickView: React.FC<StickViewProps> = ({
  type,
  count = 1,
  orientation = 'horizontal',
  className = '',
}) => {
  const isHorizontal = orientation === 'horizontal';

  // 1本の点棒を描画
  const renderSingleStick = (index: number) => {
    switch (type) {
      case '1000': // リーチ棒（白地に中央赤丸）
        return (
          <div
            key={index}
            className={`relative bg-gradient-to-r from-amber-50 via-white to-amber-50 rounded-sm shadow-md border border-amber-200/80 flex items-center justify-center select-none overflow-hidden ${
              isHorizontal ? 'w-20 h-3' : 'w-3 h-20'
            }`}
            title="1,000点棒 (立直棒)"
          >
            {/* 中央の赤丸 */}
            <div className="w-2 h-2 rounded-full bg-rose-600 shadow-inner flex items-center justify-center">
              <div className="w-0.5 h-0.5 rounded-full bg-rose-300" />
            </div>
            {/* 両端の飾り刻印ライン */}
            {isHorizontal ? (
              <>
                <div className="absolute left-2 top-0.5 bottom-0.5 w-[1px] bg-slate-300" />
                <div className="absolute right-2 top-0.5 bottom-0.5 w-[1px] bg-slate-300" />
              </>
            ) : (
              <>
                <div className="absolute top-2 left-0.5 right-0.5 h-[1px] bg-slate-300" />
                <div className="absolute bottom-2 left-0.5 right-0.5 h-[1px] bg-slate-300" />
              </>
            )}
          </div>
        );

      case '100': // 本場棒/積み棒（白地に黒丸が左右に並ぶ）
        return (
          <div
            key={index}
            className={`relative bg-gradient-to-r from-amber-50 via-white to-amber-50 rounded-sm shadow-md border border-amber-200/80 flex items-center justify-center select-none overflow-hidden ${
              isHorizontal ? 'w-20 h-3 px-1' : 'w-3 h-20 py-1'
            }`}
            title="100点棒 (積み棒/本場棒)"
          >
            {/* 8つの黒点 */}
            {isHorizontal ? (
              <div className="flex items-center justify-between w-full px-1">
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                </div>
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-between h-full py-1">
                <div className="flex flex-col gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                </div>
              </div>
            )}
          </div>
        );

      case '5000': // 5000点棒（中央赤丸＋左右に2つずつ赤丸）
        return (
          <div
            key={index}
            className={`relative bg-gradient-to-r from-amber-50 via-white to-amber-50 rounded-sm shadow-md border border-amber-200/80 flex items-center justify-around select-none overflow-hidden ${
              isHorizontal ? 'w-20 h-3 px-2' : 'w-3 h-20 py-2'
            }`}
            title="5,000点棒"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <div className="w-2 h-2 rounded-full bg-rose-600" />
            <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          </div>
        );

      case '10000': // 10000点棒（中央赤丸＋左右に緑丸）
        return (
          <div
            key={index}
            className={`relative bg-gradient-to-r from-amber-50 via-white to-amber-50 rounded-sm shadow-md border border-amber-200/80 flex items-center justify-around select-none overflow-hidden ${
              isHorizontal ? 'w-20 h-3 px-2' : 'w-3 h-20 py-2'
            }`}
            title="10,000点棒"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <div className="w-2 h-2 rounded-full bg-rose-600" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          </div>
        );
    }
  };

  if (count <= 0) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* 重なり表現または本数ラベル付き */}
      <div className="relative flex items-center">
        {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
          <div
            key={i}
            className={i > 0 ? (isHorizontal ? '-mt-1 -ml-16' : '-ml-1 -mt-16') : ''}
            style={{ transform: i > 0 ? `translate(${i * 2}px, ${i * -2}px)` : undefined }}
          >
            {renderSingleStick(i)}
          </div>
        ))}
      </div>
      {count > 1 && (
        <span className="text-[10px] font-bold text-amber-300 ml-1 font-mono">
          ×{count}
        </span>
      )}
    </div>
  );
};
