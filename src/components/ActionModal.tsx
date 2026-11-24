import React, { useState } from 'react';
import {
  Building2,
  ArrowUpCircle,
  Repeat,
  AlertCircle,
  Zap,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { GameState, PendingAction, Player, TileConfig } from '../types';
import { getDiscountedPrice, getSellToBankValue } from '../gameRules';
import { pickBuyDiscountPuzzle } from '../gameData';

interface ActionModalProps {
  pendingAction: PendingAction;
  player: Player;
  tiles: TileConfig[];
  gameState: GameState;
  onBuyProperty: (paidPrice: number, usedDiscount: boolean) => void;
  onStartUpgradeChallenge: () => void;
  onTakeoverProperty: () => void;
  onSellPropertyForDebt: (tileId: number) => void;
  onDeclareBankruptcy: () => void;
  onDeclineAction: () => void;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  pendingAction,
  player,
  tiles,
  gameState,
  onBuyProperty,
  onStartUpgradeChallenge,
  onTakeoverProperty,
  onSellPropertyForDebt,
  onDeclareBankruptcy,
  onDeclineAction,
}) => {
  const [discountMode, setDiscountMode] = useState(false);
  const [pickedOption, setPickedOption] = useState<number | null>(null);
  const [puzzle, setPuzzle] = useState(() => pickBuyDiscountPuzzle());

  const tile = tiles.find((t) => t.id === pendingAction.tileId);
  if (!tile && pendingAction.type !== 'sell_for_debt') return null;

  if (pendingAction.type === 'sell_for_debt') {
    const ownedTiles = tiles.filter(
      (t) => gameState.properties[t.id]?.ownerId === player.id
    );

    return (
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="debt-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md max-h-[90dvh] overflow-y-auto custom-scrollbar rounded-3xl border-4 border-rose-400 border-b-[8px] border-b-rose-600 bg-[#FAF6EE] p-4 sm:p-6 text-slate-800 shadow-2xl space-y-4"
        >
          <div className="flex items-center gap-2.5 text-rose-600">
            <AlertCircle className="h-6 w-6 shrink-0" />
            <h2 id="debt-modal-title" className="text-lg font-extrabold text-slate-900">
              เงินสดติดลบ! กรุณาขายทรัพย์สิน
            </h2>
          </div>

          <p className="text-sm font-medium text-slate-600">
            ยอดเงินสดปัจจุบัน:{' '}
            <span className="font-mono-num font-extrabold text-rose-600">
              ฿{player.cash.toLocaleString()}
            </span>
            <br />
            เลือกขายพื้นที่คืนธนาคาร (ได้รับ 50% ของมูลค่ารวม) จนกว่าเงินสดจะเป็น ฿0 ขึ้นไป
          </p>

          {ownedTiles.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {ownedTiles.map((t) => {
                const state = gameState.properties[t.id];
                const sellVal = getSellToBankValue(t, state);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSellPropertyForDebt(t.id)}
                    className="w-full flex items-center justify-between rounded-2xl border-2 border-[#E6D7B9] border-b-4 bg-[#FFFDF7] hover:bg-amber-50 px-4 py-3 text-left text-sm transition-colors"
                  >
                    <div>
                      <p className="font-extrabold text-slate-900">{t.name}</p>
                      <p className="text-xs font-semibold text-slate-500">ระดับ {state.level}</p>
                    </div>
                    <span className="font-mono-num font-extrabold text-emerald-700">
                      +฿{sellVal.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-[#E6D7B9] bg-[#FFFDF7] p-4 text-sm font-semibold text-slate-500 text-center">
              คุณไม่มีพื้นที่เหลือให้ขายแล้ว
            </div>
          )}

          {ownedTiles.length === 0 && (
            <button
              type="button"
              onClick={onDeclareBankruptcy}
              className="w-full py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-400 border-2 border-white shadow-[0_4px_0_#BE123C] text-white font-extrabold text-sm transition-all"
            >
              ยอมรับการล้มละลาย
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  const fullPrice = pendingAction.amount;
  const discountedPrice = getDiscountedPrice(fullPrice);
  const canAffordFull = player.cash >= fullPrice;
  const canAffordDiscount = player.cash >= discountedPrice;
  const puzzleResolved = pickedOption !== null;
  const puzzleCorrect = pickedOption === puzzle.correctIndex;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.16 }}
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto custom-scrollbar rounded-3xl border-4 border-[#F5C542] border-b-[8px] border-b-[#D49B1A] bg-[#FAF6EE] p-4 sm:p-6 text-slate-800 shadow-2xl space-y-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
            {pendingAction.type === 'buy' && (
              <Building2 className="h-5 w-5 text-emerald-600" />
            )}
            {pendingAction.type === 'upgrade_prompt' && (
              <ArrowUpCircle className="h-5 w-5 text-amber-600" />
            )}
            {pendingAction.type === 'takeover' && (
              <Repeat className="h-5 w-5 text-sky-600" />
            )}
          </div>
          <h2 id="action-modal-title" className="text-lg font-extrabold text-slate-900">
            {pendingAction.type === 'buy' && `ซื้อพื้นที่: ${tile?.name}`}
            {pendingAction.type === 'upgrade_prompt' && `อัปเกรดพื้นที่: ${tile?.name}`}
            {pendingAction.type === 'takeover' && `เทคโอเวอร์กิจการ: ${tile?.name}`}
          </h2>
        </div>

        {/* Buy Discount Puzzle View */}
        {pendingAction.type === 'buy' && discountMode ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-[#FFFDF7] border-2 border-amber-300 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-amber-700">
                <span className="inline-flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                  ภารกิจลดราคา 20%
                </span>
                <span className="font-mono-num rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                  เหลือ ฿{discountedPrice.toLocaleString()}
                </span>
              </div>
              <p className="text-sm font-extrabold text-slate-900 leading-relaxed">
                {puzzle.prompt}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {puzzle.options.map((opt, idx) => {
                const isRight = idx === puzzle.correctIndex;
                const isPick = pickedOption === idx;
                let cls =
                  'border-[#E6D7B9] border-b-4 bg-[#FFFDF7] hover:bg-amber-50 text-slate-800';
                if (puzzleResolved) {
                  if (isRight) cls = 'border-emerald-500 border-b-4 bg-emerald-50 text-emerald-900';
                  else if (isPick) cls = 'border-rose-500 border-b-4 bg-rose-50 text-rose-900';
                  else cls = 'border-slate-200 bg-slate-100 text-slate-400';
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={puzzleResolved}
                    onClick={() => setPickedOption(idx)}
                    className={`flex items-center justify-between gap-2 rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-bold transition-colors ${cls}`}
                  >
                    <span>{opt}</span>
                    {puzzleResolved && isRight && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                    {puzzleResolved && isPick && !isRight && (
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {puzzleResolved && (
              <div
                className={`rounded-2xl border-2 p-3 text-xs leading-relaxed ${
                  puzzleCorrect
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-rose-300 bg-rose-50 text-rose-900'
                }`}
              >
                <p className="font-extrabold">
                  {puzzleCorrect
                    ? `เก่งมาก! รับส่วนลด 20% เหลือ ฿${discountedPrice.toLocaleString()}`
                    : 'ตอบยังไม่ถูก! สามารถซื้อราคาเต็มหรือข้ามได้'}
                </p>
                <p className="text-slate-700 mt-0.5 font-medium">{puzzle.explanation}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onDeclineAction}
                className="px-4 py-2 rounded-2xl border-2 border-[#D8C6A0] border-b-4 bg-white text-slate-700 hover:bg-slate-50 text-sm font-extrabold whitespace-nowrap"
              >
                ข้าม
              </button>
              {puzzleResolved && puzzleCorrect ? (
                <button
                  type="button"
                  disabled={!canAffordDiscount}
                  onClick={() => onBuyProperty(discountedPrice, true)}
                  className="px-5 py-2 rounded-2xl bg-[#65C438] hover:bg-[#57B12C] disabled:bg-slate-300 border-2 border-white shadow-[0_4px_0_#3D821E] text-white font-extrabold text-sm whitespace-nowrap"
                >
                  ซื้อเลย ฿{discountedPrice.toLocaleString()}
                </button>
              ) : puzzleResolved ? (
                <button
                  type="button"
                  disabled={!canAffordFull}
                  onClick={() => onBuyProperty(fullPrice, false)}
                  className="px-5 py-2 rounded-2xl bg-[#38BDF8] hover:bg-sky-400 disabled:bg-slate-300 border-2 border-white shadow-[0_4px_0_#0284C7] text-white font-extrabold text-sm whitespace-nowrap"
                >
                  ซื้อราคาเต็ม ฿{fullPrice.toLocaleString()}
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">{tile?.description}</p>

            <div className="rounded-2xl border-2 border-[#E6D7B9] bg-[#FFFDF7] p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">
                  {pendingAction.type === 'buy'
                    ? 'ราคาซื้อปกติ'
                    : pendingAction.type === 'upgrade_prompt'
                      ? 'ค่าใช้จ่ายอัปเกรด'
                      : 'ราคาเทคโอเวอร์ (2× มูลค่ารวม)'}
                </span>
                <span className="font-mono-num font-extrabold text-amber-700">
                  ฿{fullPrice.toLocaleString()}
                </span>
              </div>
              {pendingAction.type === 'buy' && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">ราคาหลังแก้โจทย์ไว (-20%)</span>
                  <span className="font-mono-num font-extrabold text-emerald-700">
                    ฿{discountedPrice.toLocaleString()}
                  </span>
                </div>
              )}
              {tile?.baseRent && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">ค่าเช่าพื้นฐาน</span>
                  <span className="font-mono-num font-bold text-slate-800">
                    ฿{tile.baseRent.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-[#E6D7B9] pt-2">
                <span className="font-semibold text-slate-600">เงินสดคงเหลือของคุณ</span>
                <span
                  className={`font-mono-num font-extrabold ${
                    canAffordFull || (pendingAction.type === 'buy' && canAffordDiscount)
                      ? 'text-emerald-700'
                      : 'text-rose-600'
                  }`}
                >
                  ฿{player.cash.toLocaleString()}
                </span>
              </div>
            </div>

            {pendingAction.type === 'upgrade_prompt' && (
              <p className="text-xs font-bold text-amber-800 bg-amber-100/70 rounded-xl px-3 py-2 border border-amber-200">
                แก้โจทย์ภาพสั้นๆ 1 ข้อเพื่อยืนยันการอัปเกรดเป็นค่าเช่า{' '}
                {(gameState.properties[tile!.id]?.level ?? 0) === 0 ? '2 เท่า' : '3 เท่า'}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onDeclineAction}
                className="px-4 py-2.5 rounded-2xl border-2 border-[#D8C6A0] border-b-4 bg-white text-slate-700 hover:bg-slate-50 text-sm font-extrabold whitespace-nowrap"
              >
                ข้าม
              </button>

              {pendingAction.type === 'buy' && (
                <>
                  <button
                    type="button"
                    disabled={!canAffordFull}
                    onClick={() => onBuyProperty(fullPrice, false)}
                    className="px-4 py-2.5 rounded-2xl bg-[#38BDF8] hover:bg-sky-400 disabled:bg-slate-300 disabled:text-slate-500 border-2 border-white shadow-[0_4px_0_#0284C7] text-white font-extrabold text-sm transition-all whitespace-nowrap"
                  >
                    ซื้อราคาเต็ม
                  </button>
                  <button
                    type="button"
                    disabled={!canAffordDiscount}
                    onClick={() => {
                      setPuzzle(pickBuyDiscountPuzzle());
                      setPickedOption(null);
                      setDiscountMode(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#65C438] hover:bg-[#57B12C] disabled:bg-slate-300 disabled:text-slate-500 border-2 border-white shadow-[0_4px_0_#3D821E] text-white font-extrabold text-sm transition-all whitespace-nowrap"
                  >
                    <Zap className="h-4 w-4" />
                    <span>แก้โจทย์ไว ลด 20%!</span>
                  </button>
                </>
              )}

              {pendingAction.type === 'upgrade_prompt' && (
                <button
                  type="button"
                  disabled={!canAffordFull}
                  onClick={onStartUpgradeChallenge}
                  className="px-5 py-2.5 rounded-2xl bg-[#F59E0B] hover:bg-amber-400 disabled:bg-slate-300 border-2 border-white shadow-[0_4px_0_#B45309] text-white font-extrabold text-sm transition-all whitespace-nowrap"
                >
                  ทำภารกิจอัปเกรด
                </button>
              )}

              {pendingAction.type === 'takeover' && (
                <button
                  type="button"
                  disabled={!canAffordFull}
                  onClick={onTakeoverProperty}
                  className="px-5 py-2.5 rounded-2xl bg-[#38BDF8] hover:bg-sky-400 disabled:bg-slate-300 border-2 border-white shadow-[0_4px_0_#0284C7] text-white font-extrabold text-sm transition-all whitespace-nowrap"
                >
                  ยืนยันเทคโอเวอร์
                </button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
