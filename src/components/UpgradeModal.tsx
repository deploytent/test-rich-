import React, { useState } from 'react';
import { ArrowUpCircle, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import type { PropertyState, TileConfig, UpgradeChallenge } from '../types';

interface UpgradeModalProps {
  tile: TileConfig;
  propState: PropertyState;
  challenge: UpgradeChallenge;
  onComplete: (success: boolean) => void;
  onCancel: () => void;
}

const UpgradePieSvg: React.FC<{
  slices: NonNullable<UpgradeChallenge['pieSlices']>;
}> = ({ slices }) => {
  const cx = 64;
  const cy = 64;
  const r = 52;
  let angle = -Math.PI / 2;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 rounded-2xl border-2 border-[#E6D7B9] bg-[#FFFDF7] p-3.5">
      <svg viewBox="0 0 128 128" className="w-28 h-28 shrink-0" role="img" aria-label="แผนภูมิวงกลม">
        {slices.map((s) => {
          const sliceAngle = (s.percent / 100) * Math.PI * 2;
          const x1 = cx + r * Math.cos(angle);
          const y1 = cy + r * Math.sin(angle);
          const next = angle + sliceAngle;
          const x2 = cx + r * Math.cos(next);
          const y2 = cy + r * Math.sin(next);
          const largeArc = sliceAngle > Math.PI ? 1 : 0;
          const mid = angle + sliceAngle / 2;
          const lx = cx + r * 0.62 * Math.cos(mid);
          const ly = cy + r * 0.62 * Math.sin(mid);
          angle = next;

          return (
            <g key={s.label}>
              <path
                d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={s.color}
                stroke="#FFFDF7"
                strokeWidth="2"
              />
              <text
                x={lx}
                y={ly + 4}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="800"
              >
                {s.isMissing ? '?' : `${s.percent}%`}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="space-y-1.5 text-xs">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-slate-700 font-bold">{s.label}</span>
            <span className="font-mono-num font-extrabold text-slate-900">
              {s.isMissing ? '?%' : `${s.percent}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  tile,
  propState,
  challenge,
  onComplete,
  onCancel,
}) => {
  const [selected, setSelected] = useState<number | null>(null);
  const nextLevel = propState.level + 1;
  const cost = tile.price ?? 0;
  const resolved = selected !== null;
  const isCorrect = selected === challenge.correctIndex;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-lg max-h-[90dvh] flex flex-col rounded-3xl border-4 border-[#F5C542] border-b-[8px] border-b-[#D49B1A] bg-[#FAF6EE] text-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b-2 border-[#E6D7B9] px-4 sm:px-5 py-3.5 sm:py-4 bg-[#FFFDF7] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
              <ArrowUpCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 id="upgrade-modal-title" className="text-sm sm:text-base font-extrabold text-slate-900">
                ภารกิจอัปเกรด: {tile.name}
              </h2>
              <p className="text-xs font-medium text-slate-600">
                อัปเกรดเป็น Level {nextLevel} (ค่าเช่า {nextLevel === 1 ? '2×' : '3×'}) · ค่าใช้จ่าย{' '}
                <span className="font-mono-num text-amber-700 font-extrabold">
                  ฿{cost.toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
          <div>
            <h3 className="text-sm font-extrabold text-amber-700 mb-1">
              {challenge.title}
            </h3>
            <p className="text-sm font-bold text-slate-800">{challenge.prompt}</p>
          </div>

          {challenge.pieSlices && <UpgradePieSvg slices={challenge.pieSlices} />}

          {challenge.tableRows && (
            <div className="overflow-hidden rounded-2xl border-2 border-[#E6D7B9]">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FFFDF7] text-slate-600 border-b border-[#E6D7B9]">
                    <th className="py-2 px-3 text-left font-bold">หมวดหมู่</th>
                    <th className="py-2 px-3 text-right font-bold">ความถี่ (f)</th>
                    <th className="py-2 px-3 text-right font-bold">ความถี่สัมพัทธ์ (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E9D2]">
                  {challenge.tableRows.map((row) => (
                    <tr key={row.label} className="bg-white">
                      <td className="py-2 px-3 font-bold text-slate-800">{row.label}</td>
                      <td className="py-2 px-3 text-right font-mono-num font-bold text-slate-800">
                        {row.freq}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono-num font-extrabold ${
                          row.relFreqDisplay === '?'
                            ? 'text-amber-700 bg-amber-100'
                            : 'text-slate-600'
                        }`}
                      >
                        {row.relFreqDisplay}
                      </td>
                    </tr>
                  ))}
                  {challenge.totalFreq && (
                    <tr className="bg-[#FAF6EE] font-extrabold text-slate-900">
                      <td className="py-2 px-3">รวมทั้งหมด</td>
                      <td className="py-2 px-3 text-right font-mono-num">
                        {challenge.totalFreq}
                      </td>
                      <td className="py-2 px-3 text-right font-mono-num">100%</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {challenge.options.map((opt, idx) => {
              const isRight = idx === challenge.correctIndex;
              const isPick = selected === idx;
              let cls =
                'border-[#E6D7B9] border-b-4 bg-[#FFFDF7] hover:bg-amber-50 text-slate-800';
              if (resolved) {
                if (isRight) {
                  cls = 'border-emerald-500 border-b-4 bg-emerald-50 text-emerald-900';
                } else if (isPick) {
                  cls = 'border-rose-500 border-b-4 bg-rose-50 text-rose-900';
                } else {
                  cls = 'border-slate-200 bg-slate-100 text-slate-400';
                }
              }
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={resolved}
                  onClick={() => setSelected(idx)}
                  className={`flex items-center justify-between gap-2 rounded-2xl border-2 px-3.5 py-2.5 text-left text-sm font-bold transition-colors ${cls}`}
                >
                  <span>{opt}</span>
                  {resolved && isRight && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  )}
                  {resolved && isPick && !isRight && (
                    <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {resolved && (
            <div
              className={`rounded-2xl border-2 p-3 text-xs leading-relaxed ${
                isCorrect
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-rose-300 bg-rose-50 text-rose-900'
              }`}
            >
              <p className="font-extrabold mb-0.5">
                {isCorrect
                  ? `ภารกิจสำเร็จ! พร้อมอัปเกรดเป็น Level ${nextLevel}`
                  : 'คำตอบยังไม่ถูกต้อง การอัปเกรดถูกยกเลิกในรอบนี้'}
              </p>
              <p className="text-slate-700 font-medium">{challenge.explanation}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t-2 border-[#E6D7B9] px-5 py-3.5 bg-[#FFFDF7]">
          {!resolved ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-2xl border-2 border-[#D8C6A0] border-b-4 bg-white text-slate-700 hover:bg-slate-50 text-sm font-extrabold whitespace-nowrap"
            >
              ยกเลิกการอัปเกรด
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onComplete(isCorrect)}
              className="px-5 py-2 rounded-2xl bg-[#F59E0B] hover:bg-amber-400 border-2 border-white shadow-[0_4px_0_#B45309] text-white font-extrabold text-sm transition-all whitespace-nowrap"
            >
              {isCorrect
                ? `จ่าย ฿${cost.toLocaleString()} และอัปเกรด`
                : 'ปิดหน้าต่าง'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
