import React from 'react';
import { Trophy, RotateCcw, Home, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import type { GameState, TileConfig } from '../types';
import { calculateNetWorth, COLOR_META, computeDiceStats } from '../gameRules';

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border-4 border-[#F5C542] border-b-[8px] border-b-[#D49B1A] bg-[#FAF6EE] text-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="border-b-2 border-[#E6D7B9] px-6 py-5 bg-gradient-to-b from-amber-100 to-[#FFFDF7] text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 border-2 border-white shadow-[0_4px_0_#D97706] text-white">
            <Trophy className="h-7 w-7" />
          </div>
          <h2 id="summary-title" className="text-xl sm:text-2xl font-extrabold text-slate-900">
            สรุปผลสถิติการแข่งขัน
          </h2>
          <p className="mt-1 text-sm font-bold text-slate-600">
            ผู้ชนะเลิศ:{' '}
            <span className="font-extrabold text-amber-700">{winner?.name}</span> ·{' '}
            {gameState.endReason === 'last_standing'
              ? 'ผู้รอดชีวิตคนสุดท้าย'
              : `ครบ ${gameState.maxRounds} รอบการแข่งขัน`}
          </p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto custom-scrollbar p-6 space-y-5">
          {/* Leaderboard */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-2.5">
              อันดับมูลค่าทรัพย์สินสุทธิ (Net Worth)
            </h3>
            <div className="overflow-hidden rounded-2xl border-2 border-[#E6D7B9] bg-[#FFFDF7]">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#FAF6EE] text-slate-600 border-b border-[#E6D7B9]">
                    <th className="py-2.5 px-3 text-left font-bold">อันดับ</th>
                    <th className="py-2.5 px-3 text-left font-bold">ผู้เล่น</th>
                    <th className="py-2.5 px-3 text-right font-bold">เงินสด</th>
                    <th className="py-2.5 px-3 text-right font-bold">ตอบคำถาม</th>
                    <th className="py-2.5 px-3 text-right font-bold">มูลค่าสุทธิ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E9D2]">
                  {rankedPlayers.map((p, idx) => {
                    const netWorth = calculateNetWorth(p, tiles, gameState.properties);
                    const colorMeta = COLOR_META[p.color];
                    const quizAccuracy =
                      p.quizTotal > 0
                        ? `${Math.round((p.quizCorrect / p.quizTotal) * 100)}%`
                        : '-';
                    return (
                      <tr
                        key={p.id}
                        className={idx === 0 ? 'bg-amber-50' : 'bg-white'}
                      >
                        <td className="py-2.5 px-3 font-mono-num font-extrabold text-slate-800">
                          #{idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-white shadow-xs shrink-0"
                              style={{ backgroundColor: colorMeta.hex }}
                            />
                            <span className="font-extrabold text-slate-900">{p.name}</span>
                            {p.bankrupt && (
                              <span className="text-[11px] font-bold text-rose-600">(ล้มละลาย)</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-slate-700">
                          {p.cash.toLocaleString()}฿
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-slate-600">
                          {p.quizCorrect}/{p.quizTotal} ({quizAccuracy})
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num font-extrabold text-emerald-700">
                          {netWorth.toLocaleString()}฿
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Match Dice Statistics */}
          <div className="rounded-2xl border-2 border-[#E6D7B9] bg-[#FFFDF7] p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                <Crown className="h-4 w-4 text-amber-500 fill-amber-400" />
                <span>สรุปการแจกแจงความถี่ลูกเต๋าตลอดเกม</span>
              </div>
              <span className="font-mono-num font-semibold text-slate-600">
                ทอยทั้งหมด {diceStats.totalRolls} ครั้ง · ฐานนิยม: แต้ม{' '}
                {diceStats.modeFaces.length > 0 ? diceStats.modeFaces.join(', ') : '-'}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2 pt-1">
              {diceStats.rows.map((row) => (
                <div
                  key={row.face}
                  className={`rounded-xl border-2 p-2 text-center ${
                    row.isMode
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-[#E6D7B9] bg-[#FAF6EE]'
                  }`}
                >
                  <div className="font-mono-num text-xs font-extrabold text-slate-800">
                    แต้ม {row.face}
                  </div>
                  <div className="font-mono-num text-sm font-extrabold text-sky-600 mt-0.5">
                    {row.count}
                  </div>
                  <div className="font-mono-num text-[11px] font-semibold text-slate-500">
                    {row.relativePercent.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#E6D7B9] px-6 py-4 bg-[#FFFDF7]">
          <button
            type="button"
            onClick={onBackToLobby}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-[#D8C6A0] border-b-4 bg-white text-slate-700 hover:bg-slate-50 text-sm font-extrabold transition-colors whitespace-nowrap"
          >
            <Home className="h-4 w-4" />
            <span>กลับหน้าล็อบบี้</span>
          </button>
          <button
            type="button"
            onClick={onPlayAgain}
            data-start="true"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#65C438] hover:bg-[#57B12C] border-2 border-white shadow-[0_4px_0_#3D821E] text-white font-extrabold text-sm transition-all whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4" />
            <span>เล่นใหม่อีกครั้ง</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
