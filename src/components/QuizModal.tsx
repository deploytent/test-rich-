import React from 'react';
import { HelpCircle, CheckCircle2, XCircle, Bot } from 'lucide-react';
import { motion } from 'motion/react';
import type { ActiveQuizState, ChartSpec, Player } from '../types';
import { QUIZ_PENALTY, QUIZ_REWARD } from '../gameRules';

interface QuizModalProps {
  quizState: ActiveQuizState;
  player: Player;
  canInteract: boolean;
  onSelectAnswer: (index: number) => void;
  onContinue: () => void;
}

const InlineQuizChart: React.FC<{ chart: ChartSpec }> = ({ chart }) => {
  if (chart.kind === 'bar') {
    const maxVal = Math.max(...chart.items.map((i) => i.value), 1);
    const chartW = 340;
    const chartH = 165;
    const padLeft = 36;
    const padBottom = 32;
    const padTop = 22;
    const plotH = chartH - padTop - padBottom;
    const barSlot = (chartW - padLeft - 16) / chart.items.length;

    return (
      <div className="rounded-2xl border-2 border-[#E6D7B9] bg-[#FFFDF7] p-3">
        <p className="text-xs font-extrabold text-slate-800 mb-2 text-center">
          {chart.title}
        </p>
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full max-w-[360px] mx-auto h-auto"
          role="img"
          aria-label={chart.title}
        >
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={chartW - 10}
            y2={padTop + plotH}
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + plotH}
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />
          {[0.5, 1].map((ratio) => {
            const y = padTop + plotH * (1 - ratio);
            const labelVal = Math.round(maxVal * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartW - 10}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748B"
                  fontSize="10"
                  fontWeight="600"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}
          {chart.items.map((item, idx) => {
            const barH = (item.value / maxVal) * plotH;
            const barW = Math.min(38, barSlot * 0.62);
            const x = padLeft + idx * barSlot + (barSlot - barW) / 2;
            const y = padTop + plotH - barH;
            return (
              <g key={item.label}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx="5"
                  fill={item.color}
                />
                <text
                  x={x + barW / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fill="#1E293B"
                  fontSize="11"
                  fontWeight="800"
                >
                  {item.value}
                </text>
                <text
                  x={x + barW / 2}
                  y={padTop + plotH + 15}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="10"
                  fontWeight="700"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  if (chart.kind === 'grouped_bar') {
    const maxVal = Math.max(
      ...chart.items.flatMap((i) => i.values),
      1
    );
    const chartW = 350;
    const chartH = 175;
    const padLeft = 36;
    const padBottom = 32;
    const padTop = 24;
    const plotH = chartH - padTop - padBottom;
    const groupSlot = (chartW - padLeft - 16) / chart.items.length;

    return (
      <div className="rounded-2xl border-2 border-[#E6D7B9] bg-[#FFFDF7] p-3">
        <p className="text-xs font-extrabold text-slate-800 mb-1.5 text-center">
          {chart.title}
        </p>
        <div className="flex items-center justify-center gap-4 mb-1.5 text-[11px] font-bold">
          <span className="inline-flex items-center gap-1.5 text-slate-700">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: chart.seriesColors[0] }}
            />
            {chart.seriesLabels[0]}
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-700">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: chart.seriesColors[1] }}
            />
            {chart.seriesLabels[1]}
          </span>
        </div>
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full max-w-[360px] mx-auto h-auto"
          role="img"
          aria-label={chart.title}
        >
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={chartW - 10}
            y2={padTop + plotH}
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + plotH}
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />
          {[0.5, 1].map((ratio) => {
            const y = padTop + plotH * (1 - ratio);
            const labelVal = Math.round(maxVal * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartW - 10}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748B"
                  fontSize="10"
                  fontWeight="600"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}
          {chart.items.map((item, idx) => {
            const barW = Math.min(22, groupSlot * 0.34);
            const gap = 4;
            const groupCenter = padLeft + idx * groupSlot + groupSlot / 2;
            const x0 = groupCenter - barW - gap / 2;
            const x1 = groupCenter + gap / 2;
            const h0 = (item.values[0] / maxVal) * plotH;
            const h1 = (item.values[1] / maxVal) * plotH;
            const y0 = padTop + plotH - h0;
            const y1 = padTop + plotH - h1;

            return (
              <g key={item.label}>
                <rect x={x0} y={y0} width={barW} height={h0} rx="4" fill={chart.seriesColors[0]} />
                <text
                  x={x0 + barW / 2}
                  y={y0 - 4}
                  textAnchor="middle"
                  fill="#1E293B"
                  fontSize="9.5"
                  fontWeight="800"
                >
                  {item.values[0]}
                </text>
                <rect x={x1} y={y1} width={barW} height={h1} rx="4" fill={chart.seriesColors[1]} />
                <text
                  x={x1 + barW / 2}
                  y={y1 - 4}
                  textAnchor="middle"
                  fill="#1E293B"
                  fontSize="9.5"
                  fontWeight="800"
                >
                  {item.values[1]}
                </text>
                <text
                  x={groupCenter}
                  y={padTop + plotH + 15}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="10"
                  fontWeight="700"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  if (chart.kind === 'pie') {
    const cx = 75;
    const cy = 75;
    const r = 60;
    let cumulativeAngle = -Math.PI / 2;

    return (
      <div className="rounded-2xl border-2 border-[#E6D7B9] bg-[#FFFDF7] p-3">
        <p className="text-xs font-extrabold text-slate-800 mb-2 text-center">
          {chart.title}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <svg
            viewBox="0 0 150 150"
            className="w-36 h-36 shrink-0"
            role="img"
            aria-label={chart.title}
          >
            {chart.items.map((item) => {
              const sliceAngle = (item.percent / 100) * Math.PI * 2;
              const x1 = cx + r * Math.cos(cumulativeAngle);
              const y1 = cy + r * Math.sin(cumulativeAngle);
              const nextAngle = cumulativeAngle + sliceAngle;
              const x2 = cx + r * Math.cos(nextAngle);
              const y2 = cy + r * Math.sin(nextAngle);
              const largeArc = sliceAngle > Math.PI ? 1 : 0;

              const midAngle = cumulativeAngle + sliceAngle / 2;
              const lx = cx + r * 0.62 * Math.cos(midAngle);
              const ly = cy + r * 0.62 * Math.sin(midAngle);

              cumulativeAngle = nextAngle;
              const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

              return (
                <g key={item.label}>
                  <path d={d} fill={item.color} stroke="#FFFDF7" strokeWidth="2" />
                  <text
                    x={lx}
                    y={ly + 3}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="10"
                    fontWeight="800"
                  >
                    {item.percent}%
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="space-y-1.5 text-xs">
            {chart.items.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-bold text-slate-800">{item.label}</span>
                <span className="font-mono-num font-semibold text-slate-500">
                  ({item.percent}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (chart.kind === 'table') {
    return (
      <div className="rounded-2xl border-2 border-[#E6D7B9] bg-[#FFFDF7] p-3">
        <p className="text-xs font-extrabold text-slate-800 mb-2 text-center">
          {chart.title}
        </p>
        <div className="overflow-x-auto rounded-xl border border-[#E6D7B9]">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF6EE] border-b border-[#E6D7B9] text-slate-700">
                {chart.headers.map((h, i) => (
                  <th
                    key={h}
                    className={`py-2 px-2.5 font-extrabold ${i === 0 ? 'text-left' : 'text-right'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3E9D2]">
              {chart.rows.map((row, rIdx) => (
                <tr key={rIdx} className="bg-white">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className={`py-1.5 px-2.5 ${
                        cIdx === 0
                          ? 'text-left font-bold text-slate-800'
                          : 'text-right font-mono-num font-bold text-slate-700'
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[#E6D7B9] bg-[#FFFDF7] p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-extrabold text-slate-800">{chart.title}</p>
        <span className="text-[11px] text-amber-700 font-bold">
          กำหนดให้ 1 {chart.symbolLabel} = {chart.unitPerSymbol} หน่วย
        </span>
      </div>
      <div className="space-y-1.5">
        {chart.items.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-xl bg-[#FAF6EE] border border-[#E6D7B9] px-3 py-1.5 text-xs"
          >
            <span className="font-bold text-slate-800 w-24 shrink-0">
              {row.label}
            </span>
            <div className="flex-1 flex items-center gap-1.5 text-base leading-none">
              {Array.from({ length: row.symbols }).map((_, idx) => (
                <span key={idx} aria-hidden="true">
                  {chart.symbolLabel}
                </span>
              ))}
              <span className="ml-auto font-mono-num text-[11px] font-bold text-slate-500">
                ({row.symbols} รูป)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const QuizModal: React.FC<QuizModalProps> = ({
  quizState,
  player,
  canInteract,
  onSelectAnswer,
  onContinue,
}) => {
  const { question, selectedIndex, isResolved } = quizState;
  const isCorrect = selectedIndex === question.correctIndex;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-xl max-h-[90dvh] flex flex-col rounded-3xl border-4 border-[#F5C542] border-b-[8px] border-b-[#D49B1A] bg-[#FAF6EE] text-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b-2 border-[#E6D7B9] px-5 py-3.5 bg-[#FFFDF7]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center shrink-0">
              <HelpCircle className="h-5 w-5 text-sky-600" />
            </div>
            <div className="min-w-0">
              <h2 id="quiz-modal-title" className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                การ์ดคำถามสถิติ · {question.category}
              </h2>
              <p className="text-xs font-medium text-slate-500">
                ผู้ตอบ: <span className="text-slate-800 font-bold">{player.name}</span>
                {player.isBot && ' (บอทกำลังวิเคราะห์โจทย์)'}
              </p>
            </div>
          </div>
          <div className="text-right text-xs font-mono-num font-extrabold shrink-0">
            <span className="text-emerald-700">+{QUIZ_REWARD.toLocaleString()}฿</span>
            <span className="text-slate-400 mx-1">/</span>
            <span className="text-rose-600">-{QUIZ_PENALTY.toLocaleString()}฿</span>
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-5 space-y-4">
          {player.isBot && !isResolved && (
            <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
              <Bot className="h-4 w-4 text-sky-600 shrink-0" />
              <span>บอทกำลังอ่านโจทย์... คุณสามารถอ่านคำถามเพื่อเรียนรู้ไปพร้อมกันได้</span>
            </div>
          )}

          {question.chart && <InlineQuizChart chart={question.chart} />}

          <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-relaxed">
            {question.question}
          </p>

          <div className="space-y-2">
            {question.options.map((opt, idx) => {
              const isSelected = selectedIndex === idx;
              const isRightOption = idx === question.correctIndex;
              let btnStyle =
                'border-[#E6D7B9] border-b-4 bg-[#FFFDF7] hover:bg-amber-50 text-slate-800';

              if (isResolved) {
                if (isRightOption) {
                  btnStyle =
                    'border-emerald-500 border-b-4 bg-emerald-50 text-emerald-900';
                } else if (isSelected && !isRightOption) {
                  btnStyle = 'border-rose-500 border-b-4 bg-rose-50 text-rose-900';
                } else {
                  btnStyle = 'border-slate-200 bg-slate-100 text-slate-400';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!canInteract || isResolved || player.isBot}
                  onClick={() => onSelectAnswer(idx)}
                  className={`w-full flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition-colors disabled:cursor-default ${btnStyle}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono-num font-extrabold text-amber-700 shrink-0">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span>{opt}</span>
                  </div>
                  {isResolved && isRightOption && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  )}
                  {isResolved && isSelected && !isRightOption && (
                    <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {isResolved && (
            <div
              className={`rounded-2xl border-2 p-3.5 text-xs sm:text-sm space-y-1 ${
                isCorrect
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-rose-300 bg-rose-50 text-rose-900'
              }`}
            >
              <p className="font-extrabold">
                {isCorrect
                  ? `ถูกต้อง! ได้รับทุนวิจัย +${QUIZ_REWARD.toLocaleString()} บาท`
                  : `ยังไม่ถูก! เสียค่าปรับ -${QUIZ_PENALTY.toLocaleString()} บาท`}
              </p>
              <p className="text-slate-700 font-medium leading-relaxed">
                <strong>คำอธิบาย:</strong> {question.explanation}
              </p>
            </div>
          )}
        </div>

        {isResolved && !player.isBot && canInteract && (
          <div className="flex justify-end border-t-2 border-[#E6D7B9] px-5 py-3.5 bg-[#FFFDF7]">
            <button
              type="button"
              onClick={onContinue}
              className="px-5 py-2.5 rounded-2xl bg-[#65C438] hover:bg-[#57B12C] border-2 border-white shadow-[0_4px_0_#3D821E] text-white font-extrabold text-sm transition-all whitespace-nowrap"
            >
              ดำเนินการต่อ
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
