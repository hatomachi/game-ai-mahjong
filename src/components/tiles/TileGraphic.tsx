import { Tile } from '../../core/types/tile';

interface TileGraphicProps {
  tile: Tile;
  className?: string;
}

/**
 * 萬子（Manzu）の描画
 */
const ManzuGraphic: React.FC<{ value: number; isRedDora?: boolean }> = ({ value, isRedDora }) => {
  const kanjiNumbers = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const numberText = kanjiNumbers[value] || `${value}`;

  const numColor = isRedDora ? '#dc2626' : (value === 5 ? '#dc2626' : (value === 7 ? '#dc2626' : '#b91c1c'));
  const manColor = isRedDora ? '#dc2626' : '#1e3a8a';

  return (
    <div className="flex flex-col items-center justify-center w-full h-full select-none leading-none">
      <span
        style={{
          fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", "Kozuka Mincho Pro", serif',
          color: numColor,
          fontSize: '100%',
          fontWeight: 900,
        }}
        className="transform -translate-y-0.5 tracking-tight font-serif scale-y-110"
      >
        {numberText}
      </span>
      <span
        style={{
          fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", "Kozuka Mincho Pro", serif',
          color: manColor,
          fontSize: '85%',
          fontWeight: 900,
        }}
        className="transform translate-y-0.5 tracking-tight font-serif"
      >
        萬
      </span>
      {isRedDora && (
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-600 ring-1 ring-amber-300 shadow" />
      )}
    </div>
  );
};

/**
 * 筒子の車輪/円（Pinzu Circle）SVG
 */
const PinCircle: React.FC<{
  color?: 'red' | 'blue' | 'green';
  size?: number;
  isBig?: boolean;
}> = ({ color = 'blue', size = 10, isBig = false }) => {
  const colors = {
    red: { fill: '#dc2626', stroke: '#991b1b', center: '#fef08a' },
    blue: { fill: '#1d4ed8', stroke: '#1e3a8a', center: '#ffffff' },
    green: { fill: '#15803d', stroke: '#14532d', center: '#ffffff' },
  };
  const c = colors[color];

  if (isBig) {
    // 1筒用の大輪菊花紋様
    return (
      <svg width="26" height="26" viewBox="0 0 40 40" className="drop-shadow-sm">
        {/* 外周リング */}
        <circle cx="20" cy="20" r="18" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
        {/* 菊花花弁 */}
        {Array.from({ length: 16 }).map((_, i) => (
          <line
            key={i}
            x1="20"
            y1="20"
            x2={20 + 16 * Math.cos((i * Math.PI) / 8)}
            y2={20 + 16 * Math.sin((i * Math.PI) / 8)}
            stroke="#fef08a"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ))}
        {/* 内側リング */}
        <circle cx="20" cy="20" r="10" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
        <circle cx="20" cy="20" r="5" fill="#fef08a" />
        <circle cx="20" cy="20" r="2" fill="#dc2626" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className="drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.3)]">
      <circle cx="10" cy="10" r="9" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
      <circle cx="10" cy="10" r="4.5" fill="none" stroke={c.center} strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2" fill={c.center} />
    </svg>
  );
};

/**
 * 筒子（Pinzu）の描画
 */
const PinzuGraphic: React.FC<{ value: number; isRedDora?: boolean }> = ({ value, isRedDora }) => {
  const pinColor = (standardColor: 'red' | 'blue' | 'green'): 'red' | 'blue' | 'green' => {
    return isRedDora ? 'red' : standardColor;
  };

  switch (value) {
    case 1:
      return (
        <div className="flex items-center justify-center w-full h-full relative">
          <PinCircle color={isRedDora ? 'red' : 'green'} isBig={true} />
          {isRedDora && (
            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-600 ring-1 ring-amber-300 shadow" />
          )}
        </div>
      );
    case 2:
      return (
        <div className="flex flex-col justify-between items-center h-full py-1.5">
          <PinCircle color={pinColor('blue')} size={11} />
          <PinCircle color={pinColor('blue')} size={11} />
        </div>
      );
    case 3:
      return (
        <div className="flex justify-between items-center w-full h-full px-1.5 py-1">
          <div className="flex flex-col justify-start h-full"><PinCircle color={pinColor('blue')} size={9} /></div>
          <div className="flex flex-col justify-center h-full"><PinCircle color={pinColor('red')} size={9} /></div>
          <div className="flex flex-col justify-end h-full"><PinCircle color={pinColor('blue')} size={9} /></div>
        </div>
      );
    case 4:
      return (
        <div className="grid grid-cols-2 gap-x-2 gap-y-2 items-center justify-center p-1">
          <PinCircle color={pinColor('blue')} size={10} />
          <PinCircle color={pinColor('blue')} size={10} />
          <PinCircle color={pinColor('blue')} size={10} />
          <PinCircle color={pinColor('blue')} size={10} />
        </div>
      );
    case 5:
      return (
        <div className="relative w-full h-full flex items-center justify-center p-1">
          <div className="absolute top-1 left-1.5"><PinCircle color={pinColor('blue')} size={9} /></div>
          <div className="absolute top-1 right-1.5"><PinCircle color={pinColor('blue')} size={9} /></div>
          <div className="relative z-10"><PinCircle color="red" size={10} /></div>
          <div className="absolute bottom-1 left-1.5"><PinCircle color={pinColor('blue')} size={9} /></div>
          <div className="absolute bottom-1 right-1.5"><PinCircle color={pinColor('blue')} size={9} /></div>
          {isRedDora && (
            <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-600 ring-1 ring-amber-300 shadow" />
          )}
        </div>
      );
    case 6:
      return (
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-1 items-center justify-center p-1">
          <PinCircle color={pinColor('blue')} size={8.5} />
          <PinCircle color={pinColor('blue')} size={8.5} />
          <PinCircle color={pinColor('red')} size={8.5} />
          <PinCircle color={pinColor('red')} size={8.5} />
          <PinCircle color={pinColor('red')} size={8.5} />
          <PinCircle color={pinColor('red')} size={8.5} />
        </div>
      );
    case 7:
      return (
        <div className="relative w-full h-full flex flex-col justify-between p-1">
          {/* 上部斜め3つ */}
          <div className="flex justify-between items-center px-1">
            <PinCircle color={pinColor('blue')} size={7.5} />
            <div className="translate-y-1"><PinCircle color={pinColor('blue')} size={7.5} /></div>
            <div className="translate-y-2"><PinCircle color={pinColor('blue')} size={7.5} /></div>
          </div>
          {/* 下部4つ */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 justify-items-center mt-1">
            <PinCircle color={pinColor('red')} size={7.5} />
            <PinCircle color={pinColor('red')} size={7.5} />
            <PinCircle color={pinColor('red')} size={7.5} />
            <PinCircle color={pinColor('red')} size={7.5} />
          </div>
        </div>
      );
    case 8:
      return (
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-0.5 items-center justify-center p-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <PinCircle key={i} color={pinColor('blue')} size={7.5} />
          ))}
        </div>
      );
    case 9:
      return (
        <div className="grid grid-cols-3 gap-x-1 gap-y-1 items-center justify-center p-1">
          <PinCircle color={pinColor('blue')} size={7.5} />
          <PinCircle color={pinColor('blue')} size={7.5} />
          <PinCircle color={pinColor('blue')} size={7.5} />
          <PinCircle color={pinColor('red')} size={7.5} />
          <PinCircle color={pinColor('red')} size={7.5} />
          <PinCircle color={pinColor('red')} size={7.5} />
          <PinCircle color={pinColor('blue')} size={7.5} />
          <PinCircle color={pinColor('blue')} size={7.5} />
          <PinCircle color={pinColor('blue')} size={7.5} />
        </div>
      );
    default:
      return null;
  }
};

/**
 * 索子の竹節（Souzu Bamboo Stick）SVG
 */
const BambooStick: React.FC<{
  color?: 'green' | 'red';
  length?: 'sm' | 'md' | 'lg';
  slant?: number;
}> = ({ color = 'green', length = 'md', slant = 0 }) => {
  const isRed = color === 'red';
  const strokeColor = isRed ? '#b91c1c' : '#15803d';
  const fillColor = isRed ? '#ef4444' : '#22c55e';
  const nodeColor = isRed ? '#991b1b' : '#14532d';

  const heights = { sm: 10, md: 14, lg: 18 };
  const h = heights[length];

  return (
    <div style={{ transform: `rotate(${slant}deg)` }} className="inline-block">
      <svg width="5" height={h} viewBox={`0 0 10 ${h * 2}`} className="drop-shadow-sm">
        {/* 竹の幹 */}
        <rect x="2" y="2" width="6" height={h * 2 - 4} rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="1" />
        {/* 上の節 */}
        <line x1="1" y1="5" x2="9" y2="5" stroke={nodeColor} strokeWidth="2" strokeLinecap="round" />
        {/* 中央の節 */}
        <line x1="1" y1={h} x2="9" y2={h} stroke={nodeColor} strokeWidth="2" strokeLinecap="round" />
        {/* 下の節 */}
        <line x1="1" y1={h * 2 - 5} x2="9" y2={h * 2 - 5} stroke={nodeColor} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
};

/**
 * 1索の孔雀（1 Souzu Bird / Peacock）SVG
 */
const SouzuBirdGraphic: React.FC<{ isRedDora?: boolean }> = ({ isRedDora }) => {
  return (
    <div className="relative flex items-center justify-center w-full h-full p-0.5">
      <svg viewBox="0 0 32 36" className="w-full h-full drop-shadow-sm">
        {/* 孔雀の尾羽（放射状） */}
        <path d="M 16 18 Q 8 8 6 4 Q 10 7 16 16" fill="#15803d" />
        <path d="M 16 18 Q 11 5 12 2 Q 14 6 16 16" fill="#22c55e" />
        <path d="M 16 18 Q 16 3 16 1 Q 17 4 16 16" fill="#15803d" />
        <path d="M 16 18 Q 21 5 20 2 Q 18 6 16 16" fill="#22c55e" />
        <path d="M 16 18 Q 24 8 26 4 Q 22 7 16 16" fill="#15803d" />
        {/* 尾羽の目玉模様 */}
        <circle cx="6" cy="4" r="1.5" fill="#dc2626" />
        <circle cx="12" cy="2" r="1.5" fill="#facc15" />
        <circle cx="16" cy="1" r="1.5" fill="#dc2626" />
        <circle cx="20" cy="2" r="1.5" fill="#facc15" />
        <circle cx="26" cy="4" r="1.5" fill="#dc2626" />
        {/* 胴体・翼 */}
        <ellipse cx="16" cy="22" rx="6" ry="8" fill="#166534" stroke="#14532d" strokeWidth="0.8" />
        <path d="M 14 18 Q 16 14 18 18 Q 16 26 14 18 Z" fill="#22c55e" />
        {/* 胸と腹 */}
        <circle cx="16" cy="23" r="3.5" fill={isRedDora ? '#dc2626' : '#dc2626'} />
        {/* 首と頭 */}
        <path d="M 15 16 Q 14 11 16 9 Q 18 11 17 16 Z" fill="#15803d" />
        <circle cx="16" cy="9" r="2.5" fill="#166534" />
        {/* クチバシと目 */}
        <polygon points="16,8 19,9 16,10" fill="#f59e0b" />
        <circle cx="15.5" cy="8.5" r="0.6" fill="#ffffff" />
        <circle cx="15.5" cy="8.5" r="0.3" fill="#000000" />
        {/* 止まり木 */}
        <rect x="8" y="30" width="16" height="2" rx="1" fill="#78350f" />
        {/* 足 */}
        <line x1="14" y1="28" x2="14" y2="30" stroke="#f59e0b" strokeWidth="1" />
        <line x1="18" y1="28" x2="18" y2="30" stroke="#f59e0b" strokeWidth="1" />
      </svg>
      {isRedDora && (
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-600 ring-1 ring-amber-300 shadow" />
      )}
    </div>
  );
};

/**
 * 索子（Souzu）の描画
 */
const SouzuGraphic: React.FC<{ value: number; isRedDora?: boolean }> = ({ value, isRedDora }) => {
  const souColor = (std: 'green' | 'red'): 'green' | 'red' => (isRedDora ? 'red' : std);

  switch (value) {
    case 1:
      return <SouzuBirdGraphic isRedDora={isRedDora} />;
    case 2:
      return (
        <div className="flex flex-col justify-between items-center h-full py-1">
          <BambooStick color={souColor('green')} length="md" />
          <BambooStick color={souColor('green')} length="md" />
        </div>
      );
    case 3:
      return (
        <div className="flex flex-col justify-between items-center h-full py-1">
          <BambooStick color={souColor('green')} length="sm" />
          <div className="flex gap-2">
            <BambooStick color={souColor('green')} length="sm" />
            <BambooStick color={souColor('green')} length="sm" />
          </div>
        </div>
      );
    case 4:
      return (
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 items-center justify-center p-1">
          <BambooStick color={souColor('green')} length="sm" />
          <BambooStick color={souColor('green')} length="sm" />
          <BambooStick color={souColor('green')} length="sm" />
          <BambooStick color={souColor('green')} length="sm" />
        </div>
      );
    case 5:
      return (
        <div className="relative w-full h-full flex items-center justify-center p-1">
          <div className="absolute top-1 left-1.5"><BambooStick color={souColor('green')} length="sm" /></div>
          <div className="absolute top-1 right-1.5"><BambooStick color={souColor('green')} length="sm" /></div>
          <div className="relative z-10"><BambooStick color="red" length="sm" /></div>
          <div className="absolute bottom-1 left-1.5"><BambooStick color={souColor('green')} length="sm" /></div>
          <div className="absolute bottom-1 right-1.5"><BambooStick color={souColor('green')} length="sm" /></div>
          {isRedDora && (
            <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-600 ring-1 ring-amber-300 shadow" />
          )}
        </div>
      );
    case 6:
      return (
        <div className="grid grid-cols-3 gap-x-1 gap-y-1 items-center justify-center p-1">
          <BambooStick color={souColor('green')} length="sm" />
          <BambooStick color={souColor('green')} length="sm" />
          <BambooStick color={souColor('green')} length="sm" />
          <BambooStick color={souColor('green')} length="sm" />
          <BambooStick color={souColor('green')} length="sm" />
          <BambooStick color={souColor('green')} length="sm" />
        </div>
      );
    case 7:
      return (
        <div className="flex flex-col justify-between items-center h-full py-0.5">
          {/* 上に2本（ハの字風） */}
          <div className="flex gap-1.5 items-center">
            <BambooStick color="red" length="sm" slant={-15} />
            <BambooStick color="red" length="sm" />
            <BambooStick color="red" length="sm" slant={15} />
          </div>
          {/* 下に4本 */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <BambooStick color={souColor('green')} length="sm" />
            <BambooStick color={souColor('green')} length="sm" />
            <BambooStick color={souColor('green')} length="sm" />
            <BambooStick color={souColor('green')} length="sm" />
          </div>
        </div>
      );
    case 8:
      return (
        <div className="flex flex-col justify-between items-center h-full py-0.5">
          <div className="flex gap-1">
            <BambooStick color={souColor('green')} length="sm" slant={-15} />
            <BambooStick color={souColor('green')} length="sm" slant={-15} />
            <BambooStick color={souColor('green')} length="sm" slant={15} />
            <BambooStick color={souColor('green')} length="sm" slant={15} />
          </div>
          <div className="flex gap-1">
            <BambooStick color={souColor('green')} length="sm" slant={15} />
            <BambooStick color={souColor('green')} length="sm" slant={15} />
            <BambooStick color={souColor('green')} length="sm" slant={-15} />
            <BambooStick color={souColor('green')} length="sm" slant={-15} />
          </div>
        </div>
      );
    case 9:
      return (
        <div className="grid grid-cols-3 gap-x-1 gap-y-1 items-center justify-center p-0.5">
          <BambooStick color={souColor('green')} length="sm" />
          <BambooStick color="red" length="sm" />
          <BambooStick color={souColor('green')} length="sm" />
          <BambooStick color={souColor('green')} length="sm" />
          <BambooStick color="red" length="sm" />
          <BambooStick color={souColor('green')} length="sm" />
          <BambooStick color={souColor('green')} length="sm" />
          <BambooStick color="red" length="sm" />
          <BambooStick color={souColor('green')} length="sm" />
        </div>
      );
    default:
      return null;
  }
};

/**
 * 字牌（Honor Tiles）の描画
 */
const HonorGraphic: React.FC<{ value: number }> = ({ value }) => {
  // 1: 東, 2: 南, 3: 西, 4: 北, 5: 白, 6: 發, 7: 中
  const names = ['', '東', '南', '西', '北', '白', '發', '中'];
  const text = names[value] || '';

  if (value === 5) {
    // 白（無地、または伝統的な美しい長方形枠）
    return (
      <div className="flex items-center justify-center w-full h-full p-2">
        <div className="w-full h-full border-2 border-slate-300 rounded-sm bg-white/40 shadow-inner" />
      </div>
    );
  }

  const getColor = () => {
    if (value === 6) return '#15803d'; // 發（深緑草書）
    if (value === 7) return '#dc2626'; // 中（深紅楷書）
    return '#1e293b';                  // 東南西北（漆黒/濃紺）
  };

  const getFontFamily = () => {
    return '"Hiragino Mincho ProN", "Yu Mincho", "Kozuka Mincho Pro", "Noto Serif JP", serif';
  };

  return (
    <div className="flex items-center justify-center w-full h-full select-none">
      <span
        style={{
          fontFamily: getFontFamily(),
          color: getColor(),
          fontSize: value === 6 ? '125%' : '135%',
          fontWeight: 900,
        }}
        className="font-serif tracking-tighter"
      >
        {text}
      </span>
    </div>
  );
};

/**
 * 麻雀牌の絵柄SVGグラフィック（共通）
 */
export const TileGraphic: React.FC<TileGraphicProps> = ({ tile, className = '' }) => {
  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}>
      {tile.suit === 'man' && (
        <ManzuGraphic value={tile.value} isRedDora={tile.isRedDora} />
      )}
      {tile.suit === 'pin' && (
        <PinzuGraphic value={tile.value} isRedDora={tile.isRedDora} />
      )}
      {tile.suit === 'sou' && (
        <SouzuGraphic value={tile.value} isRedDora={tile.isRedDora} />
      )}
      {tile.suit === 'honor' && (
        <HonorGraphic value={tile.value} />
      )}
    </div>
  );
};
