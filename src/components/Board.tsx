import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Crown, FlaskConical, PlaneTakeoff, SkipForward } from 'lucide-react';
import type { GameState, MoneyPopup, TileConfig } from '../types';
import { Tile } from './Tile';
import { computeDiceStats, LAB_BAIL_COST } from '../gameRules';

interface BoardProps {
  gameState: GameState;
  tiles: TileConfig[];
  isMyTurn: boolean;
  gameSpeed?: 1 | 2;
  moneyPopups?: MoneyPopup[];
  canSkipOnlineTurn: boolean;
  secondsLeftToSkip: number;
  onRollDice: () => void;
  onPayLabBail: () => void;
  onSelectWarp: (tileId: number) => void;
  onSkipWarp: () => void;
  onSkipOnlineTurn: () => void;
  onOpenFrequencyModal?: () => void;
}

const TILE_GRID_CLASSES: Record<number, string> = {
  1: 'col-start-1 row-start-1',
  2: 'col-start-2 row-start-1',
  3: 'col-start-3 row-start-1',
  4: 'col-start-4 row-start-1',
  5: 'col-start-5 row-start-1',
  6: 'col-start-5 row-start-2',
  7: 'col-start-5 row-start-3',
  8: 'col-start-5 row-start-4',
  9: 'col-start-5 row-start-5',
  10: 'col-start-4 row-start-5',
  11: 'col-start-3 row-start-5',
  12: 'col-start-2 row-start-5',
  13: 'col-start-1 row-start-5',
  14: 'col-start-1 row-start-4',
  15: 'col-start-1 row-start-3',
  16: 'col-start-1 row-start-2',
};

const DICE_PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/**
 * 3D Raised Question Card Deck (?) for Center Meadow
 */
const QuestionDeck3D: React.FC = () => (
  <svg viewBox="0 0 110 92" className="w-11 @[380px]:w-14 @[460px]:w-24 h-auto drop-shadow-md select-none" aria-hidden="true">
    {/* Soft ground shadow */}
    <ellipse cx="55" cy="80" rx="42" ry="8" fill="#3D7A22" fillOpacity="0.35" />
    {/* Bottom stacked cards */}
    <rect x="20" y="28" width="70" height="48" rx="10" fill="#D97706" stroke="#FFFFFF" strokeWidth="2" transform="rotate(-6 55 52)" />
    <rect x="20" y="22" width="70" height="48" rx="10" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" transform="rotate(-3 55 46)" />
    {/* Top embossed card */}
    <rect x="20" y="15" width="70" height="48" rx="10" fill="#FFCB2B" stroke="#FFFFFF" strokeWidth="3" />
    <rect x="25" y="20" width="60" height="38" rx="7" fill="#FFF7CC" fillOpacity="0.3" />
    <circle cx="55" cy="39" r="14" fill="#FFFFFF" />
    <text x="55" y="46" textAnchor="middle" fontSize="22" fontWeight="900" fill="#EA580C">
      ?
    </text>
  </svg>
);

/**
 * 3D Treasure Chest / Stats Tracker Widget for Center Meadow
 */
const TreasureStatsChest3D: React.FC<{ totalRolls: number }> = ({ totalRolls }) => (
  <div className="relative flex flex-col items-center group">
    <svg viewBox="0 0 116 96" className="w-11 @[380px]:w-14 @[460px]:w-24 h-auto drop-shadow-md select-none transition-transform group-hover:scale-105" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx="58" cy="84" rx="42" ry="8" fill="#3D7A22" fillOpacity="0.35" />
      {/* Chest base */}
      <rect x="22" y="42" width="72" height="36" rx="8" fill="#B45309" stroke="#78350F" strokeWidth="2.5" />
      {/* Gold side bands */}
      <rect x="30" y="42" width="8" height="36" fill="#FACC15" />
      <rect x="78" y="42" width="8" height="36" fill="#FACC15" />
      {/* Chest domed lid */}
      <path d="M20 44 C20 22, 96 22, 96 44 Z" fill="#D97706" stroke="#78350F" strokeWidth="2.5" />
      <path d="M29 44 C30 27, 36 26, 39 44 Z" fill="#FACC15" />
      <path d="M77 44 C80 26, 86 27, 87 44 Z" fill="#FACC15" />
      {/* Gold lock clasp */}
      <rect x="50" y="38" width="16" height="16" rx="4" fill="#FFE042" stroke="#92400E" strokeWidth="2" />
      <circle cx="58" cy="46" r="3" fill="#92400E" />
      {/* Sparkling data bar badge */}
      <rect x="44" y="16" width="28" height="14" rx="7" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2" />
      <rect x="49" y="23" width="4" height="4" rx="1" fill="#FFFFFF" />
      <rect x="55.5" y="20" width="4" height="7" rx="1" fill="#FFFFFF" />
      <rect x="62" y="19" width="4" height="8" rx="1" fill="#FFFFFF" />
    </svg>
    <span className="-mt-1.5 @[460px]:-mt-2 rounded-full bg-[#FFFDF7] border border-[#F5C542] @[460px]:border-2 px-1.5 @[460px]:px-2 py-0.5 text-[7.5px] @[380px]:text-[9px] @[460px]:text-[11px] font-extrabold text-amber-800 shadow-sm whitespace-nowrap">
      คลังความถี่ ({totalRolls})
    </span>
  </div>
);

export const Board: React.FC<BoardProps> = ({
  gameState,
  tiles,
  isMyTurn,
  gameSpeed = 1,
  moneyPopups = [],
  canSkipOnlineTurn,
  secondsLeftToSkip,
  onRollDice,
  onPayLabBail,
  onSelectWarp,
  onSkipWarp,
  onSkipOnlineTurn,
  onOpenFrequencyModal,
}) => {
  const [rollingFace, setRollingFace] = useState<number>(5);
  const currentPlayer = gameState.players[gameState.turnIndex];
  const stats = computeDiceStats(gameState.diceCounts, gameState.currentRound);

  const isWarpMode =
    gameState.phase === 'ACTION' &&
    gameState.pendingAction?.type === 'warp' &&
    isMyTurn &&
    !currentPlayer?.isBot;

  const canRollHere =
    gameState.phase === 'IDLE' && isMyTurn && !currentPlayer?.isBot;

  useEffect(() => {
    if (gameState.phase !== 'ROLLING') return;
    const interval = window.setInterval(
      () => {
        setRollingFace((prev) => ((prev % 6) + 1));
      },
      gameSpeed === 2 ? 90 : 150
    );
    return () => window.clearInterval(interval);
  }, [gameState.phase, gameSpeed]);

  const activeDice =
    gameState.phase === 'ROLLING' ? rollingFace : (gameState.lastDice ?? 5);
  const pips = DICE_PIPS[activeDice] ?? [4];

  return (
    <div className="@container w-full max-w-[min(440px,max(304px,calc(100dvh-205px)))] sm:max-w-[min(580px,max(340px,calc(100dvh-205px)))] mx-auto">
      {/* 5x5 Cream 3D Board Perimeter */}
      <div className="grid grid-cols-5 grid-rows-5 gap-1 @[380px]:gap-1.5 @[460px]:gap-2 aspect-square rounded-2xl @[460px]:rounded-[28px] bg-[#FAF6EE] p-1.5 @[380px]:p-2 @[460px]:p-3 border-2 @[460px]:border-4 border-[#F5E6C8] border-b-[6px] @[460px]:border-b-[10px] border-b-[#D4BE92] shadow-[0_14px_30px_rgba(30,65,20,0.22)]">
        {tiles.map((tile) => {
          const propState = gameState.properties[tile.id];
          const owner = propState?.ownerId
            ? gameState.players.find((p) => p.id === propState.ownerId)
            : undefined;
          const playersHere = gameState.players.filter(
            (p) => !p.bankrupt && p.position === tile.id
          );
          const isCurrentTurnTile =
            Boolean(currentPlayer) &&
            !currentPlayer.bankrupt &&
            currentPlayer.position === tile.id;

          return (
            <Tile
              key={tile.id}
              tile={tile}
              propState={propState}
              owner={owner}
              playersHere={playersHere}
              activePlayerId={currentPlayer?.id}
              phase={gameState.phase}
              gameSpeed={gameSpeed}
              moneyPopups={moneyPopups}
              isWarpTarget={isWarpMode && tile.id !== 9}
              isCurrentTurnTile={isCurrentTurnTile}
              onSelectWarp={onSelectWarp}
              gridAreaClass={TILE_GRID_CLASSES[tile.id]}
            />
          );
        })}

        {/* Lush Meadow Center Stage with Curved Cream Pathway, 3D Question Deck & Treasure Stats Chest */}
        <div className="col-start-2 col-end-5 row-start-2 row-end-5 rounded-xl @[460px]:rounded-2xl bg-gradient-to-br from-[#7ED957] via-[#6EC848] to-[#5AA832] border-2 border-[#4B9626] p-1.5 @[380px]:p-2 @[460px]:p-3.5 flex flex-col items-center justify-between gap-1 @[460px]:gap-1.5 overflow-hidden relative shadow-inner">
          {/* Decorative Curved Cream Pathway & Meadow Tuft SVG */}
          <svg
            viewBox="0 0 360 360"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            {/* Soft meadow highlights */}
            <circle cx="52" cy="72" r="38" fill="#92E66B" fillOpacity="0.35" />
            <circle cx="305" cy="278" r="46" fill="#92E66B" fillOpacity="0.3" />
            {/* Curved Cream Cobblestone Path */}
            <path
              d="M -20 265 Q 110 240, 178 178 T 380 105"
              fill="none"
              stroke="#E6D7B9"
              strokeWidth="44"
              strokeLinecap="round"
            />
            <path
              d="M -20 265 Q 110 240, 178 178 T 380 105"
              fill="none"
              stroke="#FAF6EE"
              strokeWidth="36"
              strokeLinecap="round"
            />
            {/* Decorative Stepping Stones */}
            <ellipse cx="95" cy="232" rx="11" ry="6" fill="#EDE1C7" transform="rotate(-14 95 232)" />
            <ellipse cx="180" cy="176" rx="12" ry="6.5" fill="#EDE1C7" transform="rotate(-35 180 176)" />
            <ellipse cx="268" cy="126" rx="11" ry="6" fill="#EDE1C7" transform="rotate(-18 268 126)" />
          </svg>

          {/* Top Row: Round Pill + Live Mode Badge */}
          <div className="relative z-10 w-full flex items-center justify-between gap-1 text-[8.5px] @[380px]:text-[10px] @[460px]:text-xs font-extrabold">
            <span className="rounded-full bg-[#FFFDF7] border border-[#F5C542] @[460px]:border-2 px-1.5 @[380px]:px-2.5 py-0.5 font-mono-num text-slate-800 shadow-xs whitespace-nowrap">
              รอบ {Math.min(gameState.currentRound, gameState.maxRounds)}/{gameState.maxRounds}
            </span>
            <button
              type="button"
              onClick={onOpenFrequencyModal}
              className="inline-flex items-center gap-0.5 @[460px]:gap-1 rounded-full bg-[#FFFDF7] hover:bg-amber-50 border border-[#F5C542] @[460px]:border-2 px-1.5 @[380px]:px-2.5 py-0.5 text-[8.5px] @[380px]:text-[10px] @[460px]:text-xs font-extrabold text-amber-800 shadow-xs transition-colors whitespace-nowrap"
            >
              <Crown className="h-2.5 w-2.5 @[460px]:h-3 @[460px]:w-3 text-amber-500 fill-amber-400" />
              <span>
                {stats.modeActive
                  ? `ฐานนิยม: ${stats.modeFaces.join(',')}`
                  : 'ฐานนิยม รอบ 3'}
              </span>
            </button>
          </div>

          {/* Crisp Cream/White Speech Bubble Banner */}
          <div className="relative z-10 w-full max-w-[98%]">
            <div className="rounded-xl @[460px]:rounded-2xl bg-[#FFFDF7] px-2 py-1 @[380px]:px-2.5 @[380px]:py-1.5 @[460px]:px-3.5 @[460px]:py-2 text-center shadow-md border border-[#F5C542] @[460px]:border-2">
              <p className="text-[9px] @[380px]:text-[10px] @[460px]:text-xs font-extrabold text-slate-800 leading-snug line-clamp-2">
                {gameState.speechMessage}
              </p>
            </div>
            <div
              className="mx-auto w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#F5C542]"
              aria-hidden="true"
            />
          </div>

          {/* Center Meadow Props: 3D Question Card Deck (?) + Clickable Treasure Stats Chest */}
          <div className="relative z-10 w-full flex-1 min-h-0 flex items-center justify-around gap-1 @[460px]:gap-2 px-0.5">
            <div className="flex flex-col items-center">
              <QuestionDeck3D />
              <span className="-mt-1 @[460px]:-mt-1.5 rounded-full bg-[#FFFDF7] border border-[#E6D7B9] px-1.5 @[460px]:px-2 py-0.5 text-[7.5px] @[380px]:text-[9px] @[460px]:text-[10px] font-extrabold text-amber-800 shadow-xs whitespace-nowrap">
                กองการ์ดคำถาม
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenFrequencyModal}
              aria-label="เปิดตารางความถี่ลูกเต๋า"
              className="focus-visible:outline-none cursor-pointer"
            >
              <TreasureStatsChest3D totalRolls={stats.totalRolls} />
            </button>
          </div>

          {/* Bottom of Center Stage: Tumbling 3D Dice + Lab Bail / Warp / Online Skip */}
          <div className="relative z-10 w-full flex flex-wrap items-center justify-center gap-2">
            {isWarpMode ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 border-2 border-white px-3 py-1 text-[11px] sm:text-xs font-extrabold text-white shadow">
                  <PlaneTakeoff className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">คลิกช่องบนกระดานเพื่อวาร์ป</span>
                  <span className="sm:hidden">แตะช่องที่จะไป</span>
                </span>
                <button
                  type="button"
                  onClick={onSkipWarp}
                  className="rounded-full bg-[#FFFDF7] border-2 border-[#E6D7B9] px-3 py-1 text-[11px] font-extrabold text-slate-700 shadow-sm hover:bg-amber-50 whitespace-nowrap"
                >
                  ไม่วาร์ป
                </button>
              </div>
            ) : (
              <>
                {canRollHere && currentPlayer?.inLab && currentPlayer.cash >= LAB_BAIL_COST && (
                  <button
                    type="button"
                    onClick={onPayLabBail}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-600 hover:bg-indigo-500 border-2 border-white px-3 py-1 text-[11px] sm:text-xs font-extrabold text-white shadow transition-colors whitespace-nowrap"
                  >
                    <FlaskConical className="h-3.5 w-3.5" />
                    <span>จ่าย ฿{LAB_BAIL_COST.toLocaleString()} ออกแล็บ</span>
                  </button>
                )}

                <motion.button
                  type="button"
                  disabled={!canRollHere}
                  onClick={onRollDice}
                  data-testid="center-dice-btn"
                  aria-label={canRollHere ? 'กดทอยลูกเต๋า' : `หน้าลูกเต๋า ${activeDice}`}
                  key={`${gameState.totalRolls}-${gameState.phase === 'ROLLING' ? 'rolling' : 'rest'}`}
                  animate={
                    gameState.phase === 'ROLLING'
                      ? {
                          rotate: [0, -20, 22, -16, 14, 360],
                          x: [0, -4, 4, -3, 3, 0],
                          y: [0, -6, 2, -4, 0],
                          scale: [1, 1.18, 1.08, 1.16, 1],
                        }
                      : { rotate: 0, x: 0, y: 0, scale: 1 }
                  }
                  transition={{
                    duration: gameState.phase === 'ROLLING' ? (gameSpeed === 2 ? 0.62 : 1.25) : 0.35,
                    ease: 'easeInOut',
                  }}
                  className={`h-8 w-8 @[380px]:h-9 @[380px]:w-9 @[460px]:h-12 @[460px]:w-12 rounded-lg @[460px]:rounded-xl bg-white border-2 border-[#E6D7B9] shadow-[0_3px_0_#CBD5E1] @[460px]:shadow-[0_4px_0_#CBD5E1] p-1 @[380px]:p-1.5 @[460px]:p-2 grid grid-cols-3 grid-rows-3 place-items-center transition-transform ${
                    canRollHere
                      ? 'cursor-pointer hover:-translate-y-0.5 ring-2 ring-[#F5C542]'
                      : 'cursor-default'
                  }`}
                >
                  {Array.from({ length: 9 }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 w-1.5 @[460px]:h-2 @[460px]:w-2 rounded-full ${
                        pips.includes(idx) ? 'bg-rose-500' : 'bg-transparent'
                      }`}
                    />
                  ))}
                </motion.button>

                {gameState.isOnline && !isMyTurn && (
                  <button
                    type="button"
                    disabled={!canSkipOnlineTurn}
                    onClick={onSkipOnlineTurn}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold shadow-sm border-2 border-white whitespace-nowrap ${
                      canSkipOnlineTurn
                        ? 'bg-rose-500 hover:bg-rose-400 text-white'
                        : 'bg-white/90 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                    <span>
                      {canSkipOnlineTurn ? 'ข้ามตา' : `ข้าม (${secondsLeftToSkip}s)`}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
