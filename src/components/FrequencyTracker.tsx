import React from 'react';
import { Crown, BarChart3 } from 'lucide-react';
import { computeDiceStats } from '../gameRules';

interface FrequencyTrackerProps {
  diceCounts: Record<number, number>;
  currentRound: number;
  lastDice: number | null;
  compact?: boolean;
}

export const FrequencyTracker: React.FC<FrequencyTrackerProps> = ({
  diceCounts,
  currentRound,
  lastDice,
  compact = false,
}) => {
  const stats = computeDiceStats(diceCounts, currentRound);
  const maxBarCount = Math.max(stats.maxCount, 1);

  if (compact) {
    return (
      <div className="rounded-2xl bg-[#FFFDF7] border-2 border-[#F5C542] border-b-4 px-3 py-2 shadow-sm text-slate-800">
        <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
          <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
            <BarChart3 className="h-3.5 w-3.5 text-[#0EA5E9]" />
            <span>ความถี่ลูกเต๋า (รวม {stats.totalRolls})</span>
          </div>
          {stats.modeActive ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 font-mono-num text-[11px] font-extrabold text-amber-700">
              <Crown className="h-3 w-3 fill-amber-400 text-amber-500" />
              ฐานนิยม: {stats.modeFaces.join(', ')}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-amber-700">
              โบนัสฐานนิยมเริ่มรอบ 3
            </span>
          )}
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {stats.rows.map((row) => {
            const barH =
              stats.totalRolls > 0
                ? Math.max(Math.round((row.count / maxBarCount) * 22), row.count > 0 ? 4 : 2)
                : 2;
            return (
              <div
                key={row.face}
                className={`flex flex-col items-center rounded-xl px-1 py-1 border ${
                  row.isMode
                    ? 'bg-amber-100 border-amber-400'
                    : lastDice === row.face
                      ? 'bg-sky-100 border-sky-300'
                      : 'bg-[#FAF6EE] border-[#E6D7B9]'
                }`}
              >
                <div className="h-6 flex items-end justify-center w-full">
                  <div
                    className={`w-3 rounded-t-md transition-all ${
                      row.isMode
                        ? 'bg-amber-500'
                        : lastDice === row.face
                          ? 'bg-sky-500'
                          : 'bg-[#65C438]'
                    }`}
                    style={{ height: `${barH}px` }}
                  />
                </div>
                <span className="font-mono-num text-[10px] font-extrabold text-slate-800 mt-0.5">
                  {row.face}
                </span>
                <span className="font-mono-num text-[9px] font-semibold text-slate-500">
                  {row.count} ({row.relativePercent.toFixed(0)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#F5C542] border-b-4 bg-[#FFFDF7] p-4 text-slate-800 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center shrink-0">
            <BarChart3 className="h-4 w-4 text-sky-600" />
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
            ตารางความถี่แต้มลูกเต๋า (Live Statistics)
          </h3>
        </div>
        <span className="rounded-full bg-[#FAF6EE] border border-[#E6D7B9] px-2.5 py-0.5 text-xs font-mono-num font-bold text-slate-700 whitespace-nowrap shrink-0">
          ทอยรวม {stats.totalRolls} ครั้ง
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-amber-900 font-bold whitespace-nowrap">
          <Crown
            className={`h-3.5 w-3.5 shrink-0 ${
              stats.modeActive ? 'text-amber-500 fill-amber-400' : 'text-amber-400'
            }`}
          />
          <span>โบนัสฐานนิยม (+฿2,000):</span>
        </div>
        {stats.modeActive ? (
          <span className="font-mono-num font-extrabold text-amber-700 whitespace-nowrap">
            แต้ม {stats.modeFaces.join(', ')}
          </span>
        ) : (
          <span className="text-amber-700 font-medium text-[11px] whitespace-nowrap">
            เริ่มรอบ 3 (รอบ {currentRound})
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border-2 border-[#E6D7B9]">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#FAF6EE] text-slate-600 border-b border-[#E6D7B9]">
              <th className="py-1.5 px-2.5 text-left font-bold whitespace-nowrap">แต้ม</th>
              <th className="py-1.5 px-2 text-right font-bold whitespace-nowrap">ความถี่</th>
              <th className="py-1.5 px-2 text-right font-bold whitespace-nowrap">ร้อยละ</th>
              <th className="py-1.5 px-2.5 text-left font-bold w-24">แผนภูมิ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3E9D2]">
            {stats.rows.map((row) => {
              const barWidth =
                stats.totalRolls > 0
                  ? Math.max((row.count / maxBarCount) * 100, row.count > 0 ? 8 : 0)
                  : 0;
              const isLastRolled = lastDice === row.face;
              return (
                <tr
                  key={row.face}
                  className={
                    row.isMode
                      ? 'bg-amber-50/90'
                      : isLastRolled
                        ? 'bg-sky-50/90'
                        : 'bg-white'
                  }
                >
                  <td className="py-1.5 px-2.5 font-mono-num font-extrabold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#FAF6EE] border border-[#E6D7B9]">
                        {row.face}
                      </span>
                      {row.isMode && (
                        <Crown
                          className="h-3.5 w-3.5 text-amber-500 fill-amber-400 shrink-0"
                          aria-label="ฐานนิยม"
                        />
                      )}
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono-num font-bold text-slate-800">
                    {row.count}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono-num font-semibold text-slate-600">
                    {row.relativePercent.toFixed(1)}%
                  </td>
                  <td className="py-1.5 px-2.5">
                    <div className="h-3 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          row.isMode
                            ? 'bg-amber-500'
                            : isLastRolled
                              ? 'bg-sky-500'
                              : 'bg-[#65C438]'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
