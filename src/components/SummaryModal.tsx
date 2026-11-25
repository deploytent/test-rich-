import React from 'react';
import { Trophy, RotateCcw, Home, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import type { GameState, TileConfig } from '../types';
import { calculateNetWorth, computeDiceStats } from '../gameRules';
import { Token3D } from './Token3D';

interface SummaryModalProps {
  gameState: GameState;
  tiles: TileConfig[];
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  gameState,
  tiles,
  onPlayAgain,
  onBackToLobby,
}) => {
  const rankedPlayers = [...gameState.players].sort((a, b) => {
    if (a.bankrupt !== b.bankrupt) return a.bankrupt ? 1 : -1;
    return (
      calculateNetWorth(b, tiles, gameState.properties) -
      calculateNetWorth(a, tiles, gameState.properties)
    );
  });

  const winner =
    gameState.players.find((p) => p.id === gameState.winnerId) ?? rankedPlayers[0];
  const diceStats = computeDiceStats(gameState.diceCounts, Math.max(gameState.currentRound, 3));
  const maxBarCount = Math.max(diceStats.maxCount, 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-[94vw] max-w-lg max-h-[88dvh] overflow-y-auto custom-scrollbar flex flex-col rounded-3xl border-4 border-[#F5C542] border-b-[8px] border-b-[#D49B1A] bg-[#FAF6EE] text-slate-800 shadow-2xl"
      >
        {/* Header */}
        <div className="border-b-2 border-[#E6D7B9] px-4 sm:px-6 py-4 bg-gradient-to-b from-amber-100 to-[#FFFDF7] text-center shrink-0">
          <div className="mx-auto mb-2 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-amber-400 border-2 border-white shadow-[0_4px_0_#D97706] text-white">
            <Trophy className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <h2 id="summary-title" className="text-lg sm:text-2xl font-extrabold text-slate-900">
            สรุปผลสถิติการแข่งขัน
          </h2>
          <p className="mt-1 text-xs sm:text-sm font-bold text-slate-600">
            ผู้ชนะเลิศ:{' '}
            <span className="font-extrabold text-amber-700">{winner?.name}</span> ·{' '}
            {gameState.endReason === 'last_standing'
              ? 'ผู้รอดชีวิตคนสุดท้าย'
              : `ครบ ${gameState.maxRounds} รอบการแข่งขัน`}
          </p>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Responsive Leaderboard Cards */}
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 mb-2">
              อันดับมูลค่าทรัพย์สินสุทธิ (Net Worth)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {rankedPlayers.map((p, idx) => {
                const netWorth = calculateNetWorth(p, tiles, gameState.properties);
                const quizAccuracy =
                  p.quizTotal > 0
                    ? `${Math.round((p.quizCorrect / p.quizTotal) * 100)}%`
                    : '-';
                const isFirst = idx === 0;

                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl border-2 p-3 space-y-2 ${
                      p.bankrupt
                        ? 'bg-slate-100 border-slate-200 opacity-65'
                        : isFirst
                          ? 'bg-amber-50 border-[#F5C542] shadow-xs'
                          : 'bg-[#FFFDF7] border-[#E6D7B9]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-lg font-mono-num text-xs font-black shrink-0 ${
                            isFirst
                              ? 'bg-amber-400 text-slate-900'
                              : 'bg-[#FAF6EE] border border-[#E6D7B9] text-slate-700'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <Token3D color={p.color} size="xs" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                            {p.name}
                          </p>
                          {p.bankrupt && (
                            <span className="text-[10px] font-bold text-rose-600">(ล้มละลาย)</span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono-num text-xs sm:text-sm font-black text-emerald-700 shrink-0">
                        ฿{netWorth.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#F0E6D2] text-[11px] sm:text-xs font-semibold text-slate-600">
                      <span>
                        เงินสด:{' '}
                        <strong className="font-mono-num text-slate-800">
                          ฿{p.cash.toLocaleString()}
                        </strong>
                      </span>
                      <span>
                        คำถาม:{' '}
                        <strong className="font-mono-num text-sky-700">
                          {p.quizCorrect}/{p.quizTotal} ({quizAccuracy})
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Match Dice Statistics Visual Bar Chart */}
          <div className="rounded-2xl border-2 border-[#E6D7B9] bg-[#FFFDF7] p-3.5 sm:p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                <Crown className="h-4 w-4 text-amber-500 fill-amber-400 shrink-0" />
                <span>สรุปความถี่ลูกเต๋าตลอดเกม</span>
              </div>
              <span className="font-mono-num text-[11px] sm:text-xs font-semibold text-slate-600">
                ทอย {diceStats.totalRolls} ครั้ง · ฐานนิยม:{' '}
                {diceStats.modeFaces.length > 0 ? diceStats.modeFaces.join(', ') : '-'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {diceStats.rows.map((row) => {
                const barWidth =
                  diceStats.totalRolls > 0
                    ? Math.max((row.count / maxBarCount) * 100, row.count > 0 ? 10 : 0)
                    : 0;
                return (
                  <div
                    key={row.face}
                    className={`rounded-xl border-2 p-2 space-y-1.5 ${
                      row.isMode
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-[#E6D7B9] bg-[#FAF6EE]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-xs">
                      <span className="font-mono-num font-extrabold text-slate-800 inline-flex items-center gap-1">
                        แต้ม {row.face}
                        {row.isMode && (
                          <Crown className="h-3 w-3 text-amber-500 fill-amber-400" />
                        )}
                      </span>
                      <span className="font-mono-num font-extrabold text-sky-700">
                        {row.count} ({row.relativePercent.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white border border-[#E6D7B9] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          row.isMode ? 'bg-amber-500' : 'bg-[#65C438]'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-20 grid grid-cols-2 gap-2.5 border-t-2 border-[#E6D7B9] px-4 sm:px-6 py-3 bg-[#FFFDF7] shrink-0">
          <button
            type="button"
            onClick={onBackToLobby}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl border-2 border-[#D8C6A0] border-b-4 bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-extrabold transition-colors whitespace-nowrap"
          >
            <Home className="h-4 w-4 shrink-0" />
            <span>กลับหน้าหลัก</span>
          </button>
          <button
            type="button"
            onClick={onPlayAgain}
            data-start="true"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-[#65C438] hover:bg-[#57B12C] border-2 border-white shadow-[0_4px_0_#3D821E] text-white font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4 shrink-0" />
            <span>เล่นอีกครั้ง</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
