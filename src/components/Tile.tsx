import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Home } from 'lucide-react';
import type { GamePhase, MoneyPopup, Player, PropertyGroup, PropertyState, TileConfig } from '../types';
import { COLOR_META } from '../gameRules';

interface TileProps {
  tile: TileConfig;
  propState?: PropertyState;
  owner?: Player;
  playersHere: Player[];
  activePlayerId?: string;
  phase?: GamePhase;
  gameSpeed?: 1 | 2;
  moneyPopups?: MoneyPopup[];
  isWarpTarget: boolean;
  isCurrentTurnTile: boolean;
  onSelectWarp?: (tileId: number) => void;
  gridAreaClass: string;
}

const GROUP_BAND_HEX: Record<Exclude<PropertyGroup, 'utility'>, string> = {
  green: '#65C438',
  sky: '#38BDF8',
  orange: '#FB923C',
  red: '#F43F5E',
};

function renderTileVectorIcon(tile: TileConfig) {
  const propIconCls = 'h-4 w-4 @[380px]:h-5 @[380px]:w-5 @[460px]:h-7 @[460px]:w-7';
  const specialIconCls = 'h-5 w-5 @[380px]:h-6 @[380px]:w-6 @[460px]:h-8 @[460px]:w-8';

  switch (tile.id) {
    case 1: // START
      return (
        <svg viewBox="0 0 40 40" className={specialIconCls} aria-hidden="true">
          <circle cx="20" cy="20" r="16" fill="#DCFCE7" stroke="#22C55E" strokeWidth="2" />
          <path d="M12 20 H25 M20 13 L27 20 L20 27" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case 2: // Census / Population (People)
      return (
        <svg viewBox="0 0 40 40" className={propIconCls} aria-hidden="true">
          <circle cx="15" cy="14" r="4.5" fill="#65C438" />
          <path d="M7 29 C7 23, 23 23, 23 29 Z" fill="#86EFAC" stroke="#22C55E" strokeWidth="1.5" />
          <circle cx="26" cy="16" r="4" fill="#3B82F6" />
          <path d="M19 30 C19 25, 33 25, 33 30 Z" fill="#93C5FD" stroke="#2563EB" strokeWidth="1.5" />
        </svg>
      );
    case 3: // Quiz Basic (?)
      return (
        <svg viewBox="0 0 40 40" className={specialIconCls} aria-hidden="true">
          <rect x="9" y="5" width="22" height="30" rx="5" fill="#38BDF8" stroke="#0284C7" strokeWidth="2" />
          <rect x="12" y="8" width="16" height="24" rx="3" fill="#FFFFFF" fillOpacity="0.25" />
          <text x="20" y="26" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="900">
            ?
          </text>
        </svg>
      );
    case 4: // Survey / Clipboard
      return (
        <svg viewBox="0 0 40 40" className={propIconCls} aria-hidden="true">
          <rect x="10" y="8" width="20" height="26" rx="4" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
          <rect x="15" y="5" width="10" height="5" rx="2" fill="#F59E0B" />
          <line x1="14" y1="17" x2="26" y2="17" stroke="#65C438" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="14" y1="23" x2="24" y2="23" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <line x1="14" y1="28" x2="21" y2="28" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 5: // Research Lab
      return (
        <svg viewBox="0 0 44 40" className="h-5 w-6 @[380px]:h-6 @[380px]:w-7 @[460px]:h-8 @[460px]:w-9" aria-hidden="true">
          <polygon points="22,6 38,14 22,22 6,14" fill="#C7D2FE" />
          <polygon points="6,14 22,22 22,36 6,28" fill="#818CF8" />
          <polygon points="38,14 22,22 22,36 38,28" fill="#6366F1" />
          <rect x="11" y="21" width="4" height="5" rx="1" fill="#EEF2FF" />
          <rect x="27" y="21" width="4" height="5" rx="1" fill="#E0E7FF" />
          <circle cx="22" cy="14" r="3.5" fill="#FFFFFF" />
        </svg>
      );
    case 6: // Bank / Coin Vault
      return (
        <svg viewBox="0 0 40 40" className={propIconCls} aria-hidden="true">
          <polygon points="20,6 33,14 7,14" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />
          <rect x="9" y="14" width="22" height="16" rx="2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
          <circle cx="20" cy="22" r="5" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.2" />
          <text x="20" y="24.5" textAnchor="middle" fontSize="8" fontWeight="900" fill="#713F12">฿</text>
        </svg>
      );
    case 7: // Utility Lightbulb
      return (
        <svg viewBox="0 0 40 40" className={specialIconCls} aria-hidden="true">
          <circle cx="20" cy="17" r="9" fill="#FDE047" stroke="#EAB308" strokeWidth="2" />
          <rect x="16" y="26" width="8" height="4" rx="1.5" fill="#64748B" />
          <rect x="17" y="31" width="6" height="2.5" rx="1" fill="#475569" />
          <path d="M20 4 V7 M8 10 L11 12.5 M32 10 L29 12.5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 8: // Tourism / Plane & Globe
      return (
        <svg viewBox="0 0 40 40" className={propIconCls} aria-hidden="true">
          <circle cx="20" cy="22" r="11" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.5" />
          <path d="M12 22 Q20 15 28 22" fill="none" stroke="#38BDF8" strokeWidth="2" />
          <path d="M10 14 L30 10 L23 19 L25 26 L19 20 Z" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1" />
        </svg>
      );
    case 9: // Conference Warp
      return (
        <svg viewBox="0 0 40 40" className={specialIconCls} aria-hidden="true">
          <circle cx="20" cy="20" r="14" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="2" />
          <path d="M14 23 L26 13 M26 13 H19 M26 13 V20" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="13" cy="24" r="3" fill="#A78BFA" />
        </svg>
      );
    case 10: // Bar Chart
      return (
        <svg viewBox="0 0 40 40" className={propIconCls} aria-hidden="true">
          <rect x="8" y="21" width="6" height="12" rx="2" fill="#65C438" />
          <rect x="17" y="13" width="6" height="20" rx="2" fill="#FB923C" />
          <rect x="26" y="8" width="6" height="25" rx="2" fill="#38BDF8" />
          <line x1="6" y1="34" x2="34" y2="34" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 11: // Quiz Visual (?)
      return (
        <svg viewBox="0 0 40 40" className={specialIconCls} aria-hidden="true">
          <rect x="9" y="5" width="22" height="30" rx="5" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
          <rect x="12" y="8" width="16" height="24" rx="3" fill="#FFFFFF" fillOpacity="0.25" />
          <text x="20" y="26" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="900">
            ?
          </text>
        </svg>
      );
    case 12: // Pie Chart
      return (
        <svg viewBox="0 0 40 40" className={propIconCls} aria-hidden="true">
          <circle cx="20" cy="20" r="12" fill="#FB923C" />
          <path d="M20 20 L20 8 A12 12 0 0 1 32 20 Z" fill="#38BDF8" />
          <path d="M20 20 L32 20 A12 12 0 0 1 14 30 Z" fill="#65C438" />
          <circle cx="20" cy="20" r="12" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>
      );
    case 13: // Error / Go to Lab
      return (
        <svg viewBox="0 0 40 40" className={specialIconCls} aria-hidden="true">
          <polygon points="20,6 35,32 5,32" fill="#F43F5E" stroke="#BE123C" strokeWidth="2" strokeLinejoin="round" />
          <rect x="18.5" y="14" width="3" height="9" rx="1.5" fill="#FFFFFF" />
          <circle cx="20" cy="27.5" r="2" fill="#FFFFFF" />
        </svg>
      );
    case 14: // Descriptive Stats (Book & Magnifier)
      return (
        <svg viewBox="0 0 40 40" className={propIconCls} aria-hidden="true">
          <rect x="8" y="9" width="18" height="23" rx="3" fill="#FFE4E6" stroke="#F43F5E" strokeWidth="2" />
          <line x1="12" y1="15" x2="21" y2="15" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="20" x2="19" y2="20" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" />
          <circle cx="25" cy="23" r="6" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2.5" />
          <line x1="29.5" y1="27.5" x2="34" y2="32" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 15: // Data Leak Tax
      return (
        <svg viewBox="0 0 40 40" className={specialIconCls} aria-hidden="true">
          <circle cx="20" cy="20" r="13" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
          <circle cx="20" cy="20" r="9.5" fill="#FDE047" />
          <text x="20" y="24.5" textAnchor="middle" fill="#92400E" fontSize="14" fontWeight="900">
            ฿
          </text>
        </svg>
      );
    case 16: // Inferential Stats (Telescope / Crystal Globe)
    default:
      return (
        <svg viewBox="0 0 40 40" className={propIconCls} aria-hidden="true">
          <circle cx="20" cy="18" r="11" fill="#FDE68A" stroke="#F59E0B" strokeWidth="2" />
          <path d="M13 18 L18 13 L22 17 L27 12" fill="none" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="13" y="30" width="14" height="4" rx="2" fill="#D97706" />
        </svg>
      );
  }
}

export const Tile: React.FC<TileProps> = ({
  tile,
  propState,
  owner,
  playersHere,
  activePlayerId,
  phase,
  gameSpeed = 1,
  moneyPopups = [],
  isWarpTarget,
  isCurrentTurnTile,
  onSelectWarp,
  gridAreaClass,
}) => {
  const isColoredProperty = tile.type === 'property' && tile.group && tile.group !== 'utility';
  const hasPriceBar = tile.type === 'property' || tile.type === 'utility';
  const bandHex =
    isColoredProperty && tile.group !== 'utility'
      ? GROUP_BAND_HEX[tile.group!]
      : '#38BDF8';

  const ownerMeta = owner ? COLOR_META[owner.color] : null;
  const level = propState?.level ?? 0;
  const hasActiveOrPopup =
    playersHere.some((p) => p.id === activePlayerId) ||
    playersHere.some((p) => moneyPopups.some((m) => m.playerId === p.id));

  const content = (
    <div
      className={`relative h-full w-full rounded-xl @[460px]:rounded-2xl select-none transition-transform overflow-visible ${
        hasActiveOrPopup ? 'z-20' : 'z-0'
      } ${
        isWarpTarget
          ? 'ring-3 @[460px]:ring-4 ring-violet-400 cursor-pointer hover:scale-[1.04] shadow-lg'
          : isCurrentTurnTile
            ? 'ring-2 @[460px]:ring-3 ring-[#F5C542] shadow-md'
            : ''
      }`}
    >
      <div
        className={`h-full w-full flex flex-col justify-between rounded-xl @[460px]:rounded-2xl overflow-hidden bg-[#FFFDF7] border @[460px]:border-2 ${
          ownerMeta
            ? 'border-[#F5C542] border-b-[3px] @[460px]:border-b-[4px]'
            : 'border-[#E6D7B9] border-b-[3px] @[460px]:border-b-[4px] border-b-[#D4BE92]'
        }`}
      >
        {/* Top Color Band & Price / Owner Tag */}
        {hasPriceBar ? (
          <div
            style={{ backgroundColor: ownerMeta ? ownerMeta.hex : bandHex }}
            className="flex items-center justify-between gap-0.5 px-1 @[460px]:px-1.5 py-0.5 @[460px]:py-1 text-[8px] @[380px]:text-[9px] @[460px]:text-[11px] font-extrabold text-white leading-none shadow-xs"
          >
            <span className="font-mono-num truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.22)]">
              {ownerMeta
                ? owner?.name
                : `฿${(tile.price ?? 0).toLocaleString()}`}
            </span>
            {level > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-600 border border-white/80 px-1 py-0.5 text-[7px] @[380px]:text-[8px] @[460px]:text-[9px] font-extrabold text-white shrink-0 shadow-xs">
                <Home className="h-2 w-2 @[460px]:h-2.5 @[460px]:w-2.5 fill-white" />
                <span>{level}</span>
              </span>
            )}
          </div>
        ) : (
          <div className="px-1 @[460px]:px-1.5 pt-0.5 flex items-center justify-between text-[7.5px] @[380px]:text-[8px] @[460px]:text-[10px] font-mono-num font-extrabold text-amber-700/60 leading-none">
            <span>#{tile.id}</span>
          </div>
        )}

        {/* Cute Flat-Vector Icon in Center */}
        <div className="flex-1 flex items-center justify-center px-0.5 @[460px]:px-1 min-h-0">
          {renderTileVectorIcon(tile)}
        </div>

        {/* Crisp Bottom Label */}
        <div className="px-0.5 @[460px]:px-1.5 pb-0.5 @[460px]:pb-1 flex items-center justify-center">
          {isColoredProperty || tile.type === 'utility' ? (
            <p className="text-[7px] @[380px]:text-[8.5px] @[460px]:text-[11px] font-extrabold text-slate-800 text-center leading-tight tracking-tighter @[460px]:tracking-normal line-clamp-1">
              {tile.shortName}
            </p>
          ) : (
            <span className="inline-block max-w-full truncate rounded-full bg-[#FAF2E0] border border-[#E6D7B9] px-1 @[380px]:px-1.5 @[460px]:px-2 py-0.5 text-[6.5px] @[380px]:text-[8px] @[460px]:text-[10px] font-extrabold text-slate-700 leading-none tracking-tighter @[460px]:tracking-normal">
              {tile.shortName}
            </span>
          )}
        </div>
      </div>

      {/* Player 3D Puck Tokens Overlay + Step Hop + Glow + Floating Money Text */}
      {playersHere.length > 0 && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20 overflow-visible">
          <div className="flex flex-wrap items-center justify-center gap-0.5 @[460px]:gap-1 p-0.5 @[380px]:p-1 overflow-visible">
            {playersHere.map((p) => {
              const c = COLOR_META[p.color];
              const isActiveToken = p.id === activePlayerId;
              const isStepping = phase === 'MOVING' && isActiveToken;
              const tokenPopups = moneyPopups.filter((m) => m.playerId === p.id);

              return (
                <motion.div
                  key={p.id}
                  layoutId={`token-${p.id}`}
                  transition={{ type: 'spring', stiffness: 240, damping: 24 }}
                  title={p.name}
                  className="relative flex items-center justify-center"
                >
                  {/* Active / Hopping Glow Aura beneath token */}
                  {isActiveToken && (
                    <motion.span
                      animate={{
                        scale: isStepping ? [1, 1.55, 1.1] : [1, 1.32, 1],
                        opacity: isStepping ? [0.85, 0.35, 0.85] : [0.65, 0.25, 0.65],
                      }}
                      transition={{
                        duration: isStepping
                          ? gameSpeed === 2
                            ? 0.45
                            : 0.85
                          : 2.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        backgroundColor: c.hex,
                        boxShadow: `0 0 12px 3px ${c.hex}`,
                      }}
                    />
                  )}

                  {/* Per-Tile Hop Bounce */}
                  <motion.div
                    key={isStepping ? `hop-${p.id}-${p.position}` : `idle-${p.id}`}
                    initial={isStepping ? { y: 0, scale: 1 } : false}
                    animate={
                      isStepping
                        ? { y: [0, -14, 0], scale: [1, 1.24, 1] }
                        : { y: 0, scale: 1 }
                    }
                    transition={{
                      duration: gameSpeed === 2 ? 0.24 : 0.48,
                      ease: 'easeOut',
                    }}
                    className="relative h-3.5 w-3.5 @[380px]:h-5 @[380px]:w-5 @[460px]:h-6 @[460px]:w-6 rounded-full border-[1.5px] @[460px]:border-2 border-white shadow-[0_2px_0_rgba(0,0,0,0.35)] @[460px]:shadow-[0_3px_0_rgba(0,0,0,0.35)] flex items-center justify-center text-[7.5px] @[380px]:text-[9px] @[460px]:text-[10px] font-extrabold text-white"
                    style={{ backgroundColor: c.hex }}
                  >
                    {p.isBot ? p.name.replace('บอท', '').slice(0, 1) : p.name.slice(0, 1)}
                  </motion.div>

                  {/* Floating Money Text above Token */}
                  <AnimatePresence>
                    {tokenPopups.map((pop) => (
                      <motion.div
                        key={pop.id}
                        initial={{ opacity: 0, y: 2, scale: 0.8 }}
                        animate={{
                          opacity: [0, 1, 1, 0],
                          y: [2, -18, -30, -40],
                          scale: [0.8, 1.12, 1, 0.95],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.8, ease: 'easeOut' }}
                        className={`absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono-num text-[10px] sm:text-xs font-extrabold px-1.5 py-0.5 rounded-full shadow-md border border-white pointer-events-none z-30 ${
                          pop.amount >= 0
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {pop.amount >= 0
                          ? `+฿${pop.amount.toLocaleString()}`
                          : `-฿${Math.abs(pop.amount).toLocaleString()}`}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  if (isWarpTarget && onSelectWarp) {
    return (
      <button
        type="button"
        onClick={() => onSelectWarp(tile.id)}
        aria-label={`วาร์ปไปที่ ${tile.name}`}
        className={`${gridAreaClass} text-left focus-visible:outline-none`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={gridAreaClass} title={`${tile.name}: ${tile.description}`}>
      {content}
    </div>
  );
};
