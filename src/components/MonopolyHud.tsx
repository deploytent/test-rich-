import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarChart3,
  BookOpen,
  Dices,
  FlaskConical,
  Gauge,
  Home,
  LogOut,
  ScrollText,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { GameState, MoneyPopup, TileConfig } from '../types';
import { calculateNetWorth, getModeLabel } from '../gameRules';
import { BanknoteStackIcon, MonopolyLogo } from './MonopolyLogo';
import { FrequencyTracker } from './FrequencyTracker';
import { Token3D } from './Token3D';
import type { GameSpeed } from '../botLogic';

interface TopMonopolyBarProps {
  gameState: GameState;
  tiles: TileConfig[];
  localPlayerId: string;
  gameSpeed: GameSpeed;
  muted: boolean;
  elapsedSeconds: number;
  moneyPopups: MoneyPopup[];
  onToggleSpeed: () => void;
  onToggleMute: () => void;
  onExitGame: () => void;
}

export const TopMonopolyBar: React.FC<TopMonopolyBarProps> = ({
  gameState,
  tiles,
  localPlayerId,
  gameSpeed,
  muted,
  elapsedSeconds,
  moneyPopups,
  onToggleSpeed,
  onToggleMute,
  onExitGame,
}) => {
  const currentPlayerId = gameState.players[gameState.turnIndex]?.id;
  const heroPlayer =
    gameState.players.find((p) => p.id === localPlayerId) ?? gameState.players[0];
  const otherPlayers = gameState.players.filter((p) => p.id !== heroPlayer?.id);

  const renderPopupBadges = (playerId: string) => {
    const pops = moneyPopups.filter((m) => m.playerId === playerId);
    return (
      <AnimatePresence>
        {pops.map((pop) => (
          <motion.span
            key={pop.id}
            initial={{ opacity: 0, y: 4, scale: 0.85 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [4, -14, -24, -34],
              scale: [0.85, 1.12, 1, 0.95],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            className={`absolute -bottom-5 left-2 whitespace-nowrap font-mono-num text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-md border border-white pointer-events-none z-40 ${
              pop.amount >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}
          >
            {pop.amount >= 0
              ? `+฿${pop.amount.toLocaleString()}`
              : `-฿${Math.abs(pop.amount).toLocaleString()}`}
          </motion.span>
        ))}
      </AnimatePresence>
    );
  };

  const timerProgress = Math.max(0, Math.min(100, ((45 - elapsedSeconds) / 45) * 100));

  return (
    <header className="w-full max-w-6xl mx-auto px-1.5 min-[380px]:px-2 sm:px-4 pt-1.5 min-[380px]:pt-2 sm:pt-2.5 overflow-visible">
      {/* Main Cream & Gold Top Pill Bar */}
      <div className="rounded-2xl bg-[#FFFDF7] border-2 border-[#F5C542] border-b-4 border-b-[#D49B1A] px-2 min-[380px]:px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-md flex items-center justify-between gap-1.5 sm:gap-2 overflow-visible">
        {/* Left: Compact Logo + Local/Hero Player Cash Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 overflow-visible">
          <div className="hidden lg:block shrink-0">
            <MonopolyLogo compact />
          </div>

          {heroPlayer && (() => {
            const isHeroTurn = heroPlayer.id === currentPlayerId && !heroPlayer.bankrupt;
            return (
              <div
                className={`relative flex items-center gap-1.5 min-[380px]:gap-2 rounded-xl min-[380px]:rounded-2xl px-2 py-1 border-2 transition-all overflow-visible shrink-0 ${
                  isHeroTurn
                    ? 'bg-amber-50 border-[#F5C542] shadow-xs'
                    : 'bg-[#FAF6EE] border-[#E6D7B9]'
                }`}
              >
                {/* 3D Token Avatar */}
                <div className="relative flex items-center shrink-0">
                  <Token3D color={heroPlayer.color} size="md" />
                  {isHeroTurn && (
                    <span
                      className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-500 border-2 border-white z-20"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] min-[380px]:text-xs sm:text-sm font-extrabold text-slate-900 truncate max-w-[74px] min-[380px]:max-w-[100px] sm:max-w-[130px]">
                      {heroPlayer.name}
                    </span>
                    {heroPlayer.inLab && !heroPlayer.bankrupt && (
                      <FlaskConical className="h-3 w-3 text-indigo-600 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 font-mono-num text-[11px] min-[380px]:text-xs sm:text-sm font-extrabold text-emerald-700">
                    <BanknoteStackIcon className="h-3 w-4 min-[380px]:h-3.5 min-[380px]:w-4.5 shrink-0" />
                    <span>฿{heroPlayer.cash.toLocaleString()}</span>
                  </div>
                </div>
                {renderPopupBadges(heroPlayer.id)}
              </div>
            );
          })()}

          {/* Compact Rival Player Chips (Desktop/Tablet) */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-visible">
            {otherPlayers.map((p) => {
              const isActive = p.id === currentPlayerId && !p.bankrupt;
              return (
                <div
                  key={p.id}
                  className={`relative flex items-center gap-1.5 rounded-xl px-2 py-1 border text-xs transition-all overflow-visible ${
                    p.bankrupt
                      ? 'bg-slate-100 border-slate-200 opacity-50'
                      : isActive
                        ? 'bg-sky-50 border-sky-400 shadow-xs'
                        : 'bg-[#FAF6EE] border-[#E6D7B9]'
                  }`}
                  title={`${p.name} · มูลค่าสุทธิ ฿${calculateNetWorth(p, tiles, gameState.properties).toLocaleString()}`}
                >
                  <Token3D color={p.color} size="xs" />
                  <div className="leading-none">
                    <p className="text-[10px] font-extrabold text-slate-700 truncate max-w-[66px]">
                      {p.name}
                    </p>
                    <p className="font-mono-num text-[11px] font-extrabold text-emerald-700 mt-0.5">
                      ฿{p.cash.toLocaleString()}
                    </p>
                  </div>
                  {renderPopupBadges(p.id)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Speed Toggle, Mute, Exit */}
        <div className="flex items-center gap-1 min-[380px]:gap-1.5 shrink-0">
          <span className="hidden xl:inline-block max-w-[190px] truncate rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-bold text-amber-800">
            {getModeLabel(gameState.curriculumMode)}
          </span>
          {gameState.isOnline && gameState.roomCode && (
            <span className="font-mono-num rounded-full bg-rose-50 border border-rose-200 px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-extrabold text-rose-700 whitespace-nowrap">
              {gameState.roomCode}
            </span>
          )}
          <button
            type="button"
            onClick={onToggleSpeed}
            data-testid="speed-toggle-btn"
            aria-label={`สลับความเร็วเกม (ปัจจุบัน ${gameSpeed}x)`}
            className={`inline-flex items-center gap-1 px-2 min-[380px]:px-2.5 py-1.5 rounded-xl border-2 border-b-3 text-[11px] sm:text-xs font-extrabold transition-colors whitespace-nowrap ${
              gameSpeed === 2
                ? 'border-amber-500 bg-amber-100 text-amber-800'
                : 'border-[#E6D7B9] bg-[#FAF6EE] text-slate-700 hover:bg-amber-50'
            }`}
          >
            <Gauge className="h-3.5 w-3.5" />
            <span className="font-mono-num">{gameSpeed}x</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
            className="p-1.5 sm:p-2 rounded-xl border-2 border-b-3 border-[#E6D7B9] bg-[#FAF6EE] text-slate-700 hover:bg-amber-50 transition-colors"
          >
            {muted ? <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>

          <button
            type="button"
            onClick={onExitGame}
            aria-label="ออกเกม"
            className="inline-flex items-center gap-1 px-2 min-[380px]:px-2.5 py-1.5 rounded-xl border-2 border-b-3 border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-extrabold transition-colors whitespace-nowrap"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ออก</span>
          </button>
        </div>
      </div>

      {/* Subtle Online Turn Countdown Progress */}
      {gameState.isOnline && (
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/50 overflow-hidden">
          <div
            className="h-full bg-sky-500 transition-all duration-1000"
            style={{ width: `${timerProgress}%` }}
          />
        </div>
      )}
    </header>
  );
};

interface MobilePlayerGridProps {
  gameState: GameState;
  moneyPopups: MoneyPopup[];
}

export const MobilePlayerGrid: React.FC<MobilePlayerGridProps> = ({
  gameState,
  moneyPopups,
}) => {
  const currentPlayerId = gameState.players[gameState.turnIndex]?.id;

  return (
    <section
      aria-label="รายชื่อผู้เล่นและเงินคงเหลือ"
      className="sm:hidden w-[min(94vw,440px)] mx-auto grid grid-cols-2 gap-1.5 mt-1.5"
    >
      {gameState.players.map((p) => {
        const isActive = p.id === currentPlayerId && !p.bankrupt;
        const pops = moneyPopups.filter((m) => m.playerId === p.id);
        return (
          <div
            key={p.id}
            className={`relative flex items-center justify-between gap-1.5 rounded-xl px-2 py-1 border-2 transition-all overflow-visible ${
              p.bankrupt
                ? 'bg-white/65 border-slate-300 opacity-55'
                : isActive
                  ? 'bg-[#FFFDF7] border-[#F5C542] ring-2 ring-sky-400 shadow-xs'
                  : 'bg-[#FFFDF7]/95 border-[#E6D7B9]'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Token3D color={p.color} size="xs" />
              <span className="text-[11px] font-extrabold text-slate-800 truncate">
                {p.name}
              </span>
              {p.inLab && !p.bankrupt && (
                <FlaskConical className="h-3 w-3 text-indigo-600 shrink-0" />
              )}
            </div>
            <span className="font-mono-num text-[11px] font-extrabold text-emerald-700 shrink-0">
              {p.bankrupt ? 'ล้มละลาย' : `฿${p.cash.toLocaleString()}`}
            </span>

            <AnimatePresence>
              {pops.map((pop) => (
                <motion.span
                  key={pop.id}
                  initial={{ opacity: 0, y: 4, scale: 0.85 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    y: [4, -12, -20, -28],
                    scale: [0.85, 1.1, 1, 0.95],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, ease: 'easeOut' }}
                  className={`absolute -top-4 right-1 whitespace-nowrap font-mono-num text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow border border-white pointer-events-none z-40 ${
                    pop.amount >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}
                >
                  {pop.amount >= 0
                    ? `+฿${pop.amount.toLocaleString()}`
                    : `-฿${Math.abs(pop.amount).toLocaleString()}`}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        );
      })}
    </section>
  );
};

interface DesktopSidePanelProps {
  gameState: GameState;
  tiles: TileConfig[];
}

export const DesktopSidePanel: React.FC<DesktopSidePanelProps> = ({
  gameState,
  tiles,
}) => {
  const currentPlayerId = gameState.players[gameState.turnIndex]?.id;

  return (
    <aside
      aria-label="แผงข้อมูลสถิติและอันดับผู้เล่น"
      className="hidden lg:flex flex-col gap-2.5 w-[335px] xl:w-[375px] shrink-0 max-h-[calc(100dvh-165px)] overflow-y-auto custom-scrollbar pr-0.5"
    >
      {/* Compact Live Players Card */}
      <div className="rounded-2xl border-2 border-[#F5C542] border-b-4 bg-[#FFFDF7] p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-rose-500" />
            <h2 className="text-xs xl:text-sm font-extrabold text-slate-900">
              สถานะผู้เล่น
            </h2>
          </div>
          <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 font-mono-num text-[11px] font-extrabold text-amber-800">
            รอบ {Math.min(gameState.currentRound, gameState.maxRounds)}/{gameState.maxRounds}
          </span>
        </div>

        <div className="space-y-1.5">
          {gameState.players.map((p) => {
            const isActive = p.id === currentPlayerId && !p.bankrupt;
            const netWorth = calculateNetWorth(p, tiles, gameState.properties);
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 transition-all ${
                  p.bankrupt
                    ? 'bg-slate-100 border-slate-200 opacity-55'
                    : isActive
                      ? 'bg-amber-50 border-[#F5C542] shadow-xs'
                      : 'bg-[#FAF6EE] border-[#E6D7B9]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Token3D color={p.color} size="xs" />
                  <div className="min-w-0 leading-tight">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-extrabold text-slate-900 truncate max-w-[115px]">
                        {p.name}
                      </span>
                      {p.inLab && !p.bankrupt && (
                        <FlaskConical className="h-3 w-3 text-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] font-semibold text-slate-500">
                      คำถาม {p.quizCorrect}/{p.quizTotal} · สุทธิ ฿{netWorth.toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="font-mono-num text-xs font-extrabold text-emerald-700 shrink-0">
                  {p.bankrupt ? 'ล้มละลาย' : `฿${p.cash.toLocaleString()}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Frequency Tracker */}
      <FrequencyTracker
        diceCounts={gameState.diceCounts}
        currentRound={gameState.currentRound}
        lastDice={gameState.lastDice}
      />
    </aside>
  );
};

interface BottomMonopolyDockProps {
  gameState: GameState;
  isMyTurn: boolean;
  onRollDice: () => void;
  onOpenRules: () => void;
  onOpenLogs: () => void;
  onOpenFrequency: () => void;
  onOpenPlayerStats: () => void;
}

export const BottomMonopolyDock: React.FC<BottomMonopolyDockProps> = ({
  gameState,
  isMyTurn,
  onRollDice,
  onOpenRules,
  onOpenLogs,
  onOpenFrequency,
  onOpenPlayerStats,
}) => {
  const currentPlayer = gameState.players[gameState.turnIndex];
  const canRoll =
    gameState.phase === 'IDLE' && isMyTurn && Boolean(currentPlayer) && !currentPlayer.isBot;

  return (
    <nav
      aria-label="แถบคำสั่งเกม"
      className="w-full max-w-3xl mx-auto px-1.5 min-[380px]:px-2 sm:px-4 pb-2 min-[380px]:pb-2.5 sm:pb-3.5 pt-1.5 relative shrink-0"
    >
      {/* Cream & Gold Menu Bar flanking the Hero Diamond GO Button */}
      <div className="relative rounded-2xl bg-[#FAF6EE] border-2 border-[#F5C542] border-b-[5px] border-b-[#D49B1A] px-1 min-[380px]:px-2 sm:px-4 py-1.5 sm:py-2 shadow-lg grid grid-cols-5 items-center gap-0.5 min-[380px]:gap-1 sm:gap-2">
        {/* Left Menu 1: กติกา */}
        <button
          type="button"
          onClick={onOpenRules}
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 px-0.5 min-[380px]:py-1.5 min-[380px]:px-1 text-slate-700 hover:bg-amber-100/70 transition-colors"
        >
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
          <span className="text-[9px] min-[380px]:text-[10px] sm:text-xs font-extrabold whitespace-nowrap">กติกา</span>
        </button>

        {/* Left Menu 2: บันทึก */}
        <button
          type="button"
          onClick={onOpenLogs}
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 px-0.5 min-[380px]:py-1.5 min-[380px]:px-1 text-slate-700 hover:bg-sky-100/70 transition-colors"
        >
          <ScrollText className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" />
          <span className="text-[9px] min-[380px]:text-[10px] sm:text-xs font-extrabold whitespace-nowrap">บันทึก</span>
        </button>

        {/* Center Spacer for Protruding Giant Diamond Roll Button */}
        <div className="flex items-center justify-center relative h-9 min-[380px]:h-10 sm:h-11">
          <motion.button
            type="button"
            disabled={!canRoll}
            onClick={onRollDice}
            data-testid="roll-dice-btn"
            aria-label={canRoll ? 'ทอยเต๋า GO' : `รอตา ${currentPlayer?.name ?? ''}`}
            whileHover={canRoll ? { scale: 1.06 } : undefined}
            whileTap={canRoll ? { scale: 0.94, y: 3 } : undefined}
            className="group relative -top-2 min-[380px]:-top-2.5 sm:-top-3 focus-visible:outline-none cursor-pointer disabled:cursor-default"
          >
            {/* Rotated Diamond Frame */}
            <div
              className={`h-14 w-14 min-[380px]:h-16 min-[380px]:w-16 sm:h-20 sm:w-20 rotate-45 rounded-xl min-[380px]:rounded-2xl border-[3px] min-[380px]:border-4 border-white flex items-center justify-center transition-all ${
                canRoll
                  ? 'bg-gradient-to-br from-[#FF6B35] via-[#F43F5E] to-[#E11D48] shadow-[0_6px_0_#9F1239,0_10px_18px_rgba(159,18,57,0.35)] sm:shadow-[0_7px_0_#9F1239,0_12px_20px_rgba(159,18,57,0.35)]'
                  : 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-[0_5px_0_#B45309] opacity-90'
              }`}
            >
              {/* Upright Content inside Diamond */}
              <div className="-rotate-45 flex flex-col items-center justify-center text-white leading-none">
                <Dices className="h-4 w-4 min-[380px]:h-5 min-[380px]:w-5 sm:h-6 sm:w-6 drop-shadow-xs" />
                <span className="mt-0.5 text-[9.5px] min-[380px]:text-[11px] sm:text-xs font-black tracking-wide drop-shadow-xs whitespace-nowrap">
                  {canRoll ? 'ทอยเต๋า' : gameState.phase === 'ROLLING' ? 'กำลังทอย' : 'GO'}
                </span>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Right Menu 1: ตารางความถี่ */}
        <button
          type="button"
          onClick={onOpenFrequency}
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 px-0.5 min-[380px]:py-1.5 min-[380px]:px-1 text-slate-700 hover:bg-emerald-100/70 transition-colors"
        >
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
          <span className="hidden min-[380px]:inline text-[10px] sm:text-xs font-extrabold whitespace-nowrap">ตารางความถี่</span>
          <span className="min-[380px]:hidden text-[9px] font-extrabold whitespace-nowrap">ความถี่</span>
        </button>

        {/* Right Menu 2: สถิติผู้เล่น */}
        <button
          type="button"
          onClick={onOpenPlayerStats}
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 px-0.5 min-[380px]:py-1.5 min-[380px]:px-1 text-slate-700 hover:bg-rose-100/70 transition-colors"
        >
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
          <span className="hidden min-[380px]:inline text-[10px] sm:text-xs font-extrabold whitespace-nowrap">สถิติผู้เล่น</span>
          <span className="min-[380px]:hidden text-[9px] font-extrabold whitespace-nowrap">สถิติ</span>
        </button>
      </div>
    </nav>
  );
};

export const FrequencyModal: React.FC<{
  open: boolean;
  gameState: GameState;
  onClose: () => void;
}> = ({ open, gameState, onClose }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="ตารางความถี่แต้มลูกเต๋า"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto custom-scrollbar rounded-3xl border-4 border-[#F5C542] border-b-[8px] border-b-[#D49B1A] bg-[#FAF6EE] p-4 sm:p-5 shadow-2xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
            สถิติความถี่ลูกเต๋าแบบเรียลไทม์
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างตารางความถี่"
            className="rounded-xl p-1.5 bg-white border border-[#E6D7B9] text-slate-600 hover:bg-amber-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <FrequencyTracker
          diceCounts={gameState.diceCounts}
          currentRound={gameState.currentRound}
          lastDice={gameState.lastDice}
        />
      </motion.div>
    </div>
  );
};

export const PlayerStatsModal: React.FC<{
  open: boolean;
  gameState: GameState;
  tiles: TileConfig[];
  onClose: () => void;
}> = ({ open, gameState, tiles, onClose }) => {
  if (!open) return null;
  const currentPlayerId = gameState.players[gameState.turnIndex]?.id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="สถิติผู้เล่นและทรัพย์สิน"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl max-h-[88dvh] flex flex-col rounded-3xl border-4 border-[#F5C542] border-b-[8px] border-b-[#D49B1A] bg-[#FAF6EE] shadow-2xl overflow-hidden text-slate-800"
      >
        <div className="flex items-center justify-between border-b-2 border-[#E6D7B9] px-5 py-4 bg-[#FFFDF7]">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-rose-500" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              สถิติผู้เล่นและทรัพย์สินที่ถือครอง
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างสถิติผู้เล่น"
            className="rounded-xl p-1.5 bg-[#FAF6EE] border border-[#E6D7B9] text-slate-600 hover:bg-amber-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-3">
          {gameState.players.map((p) => {
            const netWorth = calculateNetWorth(p, tiles, gameState.properties);
            const ownedTiles = tiles.filter(
              (t) => gameState.properties[t.id]?.ownerId === p.id
            );
            const isActive = p.id === currentPlayerId && !p.bankrupt;

            return (
              <div
                key={p.id}
                className={`rounded-2xl border-2 p-3.5 space-y-2 ${
                  p.bankrupt
                    ? 'bg-slate-100 border-slate-200 opacity-60'
                    : isActive
                      ? 'bg-amber-50 border-[#F5C542]'
                      : 'bg-[#FFFDF7] border-[#E6D7B9]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Token3D color={p.color} size="sm" />
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">
                        {p.name}
                        {isActive && (
                          <span className="ml-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-slate-900">
                            ตาปัจจุบัน
                          </span>
                        )}
                        {p.bankrupt && (
                          <span className="ml-2 text-xs text-rose-600 font-bold">(ล้มละลาย)</span>
                        )}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">
                        ตอบถูก {p.quizCorrect}/{p.quizTotal} ข้อ · โบนัสฐานนิยม {p.modeBonusesEarned} ครั้ง
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono-num">
                    <p className="text-xs font-bold text-slate-500">
                      เงินสด <span className="text-emerald-700 font-extrabold">฿{p.cash.toLocaleString()}</span>
                    </p>
                    <p className="text-sm font-extrabold text-sky-700">
                      สุทธิ ฿{netWorth.toLocaleString()}
                    </p>
                  </div>
                </div>

                {ownedTiles.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ownedTiles.map((t) => {
                      const lv = gameState.properties[t.id]?.level ?? 0;
                      return (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-1 rounded-full bg-white border border-[#E6D7B9] px-2.5 py-0.5 text-[11px] font-bold text-slate-700"
                        >
                          <span>{t.shortName}</span>
                          {lv > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 font-extrabold">
                              <Home className="h-2.5 w-2.5 fill-emerald-500" />
                              {lv}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 font-medium">ยังไม่มีพื้นที่ถือครอง</p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
