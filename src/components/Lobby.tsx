import React, { useEffect, useState } from 'react';
import {
  Bot,
  Globe,
  LogIn,
  Copy,
  Check,
  Play,
  BookOpen,
  UserPlus,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Award,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type {
  BotDifficulty,
  CurriculumMode,
  GameState,
  TokenColor,
} from '../types';
import { COLOR_META, getModeLabel } from '../gameRules';
import { isFirebaseConfigured } from '../firebaseConfig';
import { BanknoteStackIcon, MonopolyLogo } from './MonopolyLogo';

interface LobbyProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  playerColor: TokenColor;
  setPlayerColor: (color: TokenColor) => void;
  curriculumMode: CurriculumMode;
  setCurriculumMode: (mode: CurriculumMode) => void;
  maxRounds: 10 | 15 | 20;
  setMaxRounds: (rounds: 10 | 15 | 20) => void;
  onlineRoom: GameState | null;
  localPlayerId: string;
  onlineError: string | null;
  onStartSolo: (botCount: 1 | 2 | 3, difficulty: BotDifficulty, rounds: 10 | 15 | 20) => void;
  onCreateOnlineRoom: () => void;
  onJoinOnlineRoom: (code: string) => void;
  onAddOnlineBot: () => void;
  onStartOnlineGame: () => void;
  onLeaveOnlineRoom: () => void;
  onOpenRules: () => void;
  takenColorsInJoinRoom: TokenColor[];
  onCheckJoinRoomColors: (code: string) => void;
}

const CURRICULUM_OPTIONS: {
  id: CurriculumMode;
  title: string;
  subtitle: string;
  badgeColor: string;
}[] = [
  {
    id: 'mode1',
    title: 'โหมด 1: ความหมายของสถิติศาสตร์และข้อมูล',
    subtitle: 'ประชากร/ตัวอย่าง · พารามิเตอร์/ค่าสถิติ · ปฐมภูมิ/ทุติยภูมิ · เชิงปริมาณ/คุณภาพ',
    badgeColor: '#65C438',
  },
  {
    id: 'mode2',
    title: 'โหมด 2: การวิเคราะห์และนำเสนอข้อมูลเชิงคุณภาพ',
    subtitle: 'ตารางความถี่ · ความถี่สัมพัทธ์ · ฐานนิยม · แผนภูมิแท่ง/วงกลม/รูปภาพ',
    badgeColor: '#38BDF8',
  },
  {
    id: 'mode3',
    title: 'โหมด 3: โหมดผสมผสาน (All-in-One)',
    subtitle: 'รวมเนื้อหาทั้งบทที่ 1 และบทที่ 2 ครบทุกมิติ (แนะนำ)',
    badgeColor: '#F59E0B',
  },
];

const ALL_COLORS: TokenColor[] = ['red', 'blue', 'green', 'yellow'];

const SkyMeadowBackdrop: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
    {/* Pastel Sky Blue Gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-[#63C8FF] via-[#B4E8FF] to-[#E6F8FF]" />

    {/* Warm Sun Glow */}
    <div className="absolute -top-12 right-10 h-44 w-44 rounded-full bg-[#FFF3A1]/70 blur-2xl" />
    <svg viewBox="0 0 120 120" className="absolute top-5 right-6 sm:right-14 h-20 w-20 sm:h-24 sm:w-24 opacity-90">
      <circle cx="60" cy="60" r="28" fill="#FFE042" stroke="#F59E0B" strokeWidth="4" />
      <circle cx="60" cy="60" r="20" fill="#FFF394" />
    </svg>

    {/* Fluffy Vector Clouds */}
    <svg viewBox="0 0 220 90" className="absolute top-6 left-4 sm:left-12 w-36 sm:w-52 opacity-90">
      <path
        d="M35 72 H175 C192 72 204 60 204 46 C204 33 193 23 180 23 C176 10 162 2 146 2 C131 2 119 10 113 21 C106 16 97 13 87 13 C69 13 54 26 52 42 C38 42 26 51 26 62 C26 68 30 72 35 72 Z"
        fill="#FFFFFF"
      />
    </svg>
    <svg viewBox="0 0 200 80" className="hidden md:block absolute top-16 left-[42%] w-44 opacity-80">
      <path
        d="M30 64 H162 C176 64 186 54 186 42 C186 30 176 21 164 21 C159 10 147 3 133 3 C120 3 109 10 103 19 C96 15 88 13 80 13 C64 13 51 24 49 38 C36 38 26 46 26 55 C26 60 28 64 30 64 Z"
        fill="#FFFFFF"
      />
    </svg>

    {/* Rolling Vibrant Meadow Green Hills at bottom */}
    <svg
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
      className="absolute bottom-0 left-0 w-full h-[38vh] min-h-[220px]"
    >
      <path
        d="M0,128 C280,40 520,210 820,130 C1080,60 1260,150 1440,96 L1440,320 L0,320 Z"
        fill="#A8E6CF"
      />
      <path
        d="M0,176 C320,96 640,250 980,170 C1200,118 1350,180 1440,152 L1440,320 L0,320 Z"
        fill="#7BC043"
      />
      <path
        d="M0,245 C360,190 740,295 1120,232 C1280,206 1380,235 1440,224 L1440,320 L0,320 Z"
        fill="#63AD32"
      />
    </svg>
  </div>
);

export const Lobby: React.FC<LobbyProps> = ({
  playerName,
  setPlayerName,
  playerColor,
  setPlayerColor,
  curriculumMode,
  setCurriculumMode,
  maxRounds,
  setMaxRounds,
  onlineRoom,
  localPlayerId,
  onlineError,
  onStartSolo,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  onAddOnlineBot,
  onStartOnlineGame,
  onLeaveOnlineRoom,
  onOpenRules,
  takenColorsInJoinRoom,
  onCheckJoinRoomColors,
}) => {
  const [lobbyStep, setLobbyStep] = useState<'welcome' | 'setup'>('welcome');
  const [showSoloSetup, setShowSoloSetup] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [botCount, setBotCount] = useState<1 | 2 | 3>(2);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('rookie');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [nameWarning, setNameWarning] = useState<string | null>(null);

  useEffect(() => {
    if (showCredits) {
      const onEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowCredits(false);
      };
      window.addEventListener('keydown', onEsc);
      return () => window.removeEventListener('keydown', onEsc);
    }
    if (onlineRoom?.status === 'waiting' || lobbyStep !== 'welcome' || showSoloSetup) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setLobbyStep('setup');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lobbyStep, onlineRoom?.status, showSoloSetup, showCredits]);

  const validateName = (): boolean => {
    if (!playerName.trim()) {
      setNameWarning('กรุณากรอกชื่อผู้เล่นก่อนเริ่มเกม');
      return false;
    }
    setNameWarning(null);
    return true;
  };

  const handleCopyCode = () => {
    if (!onlineRoom?.roomCode) return;
    navigator.clipboard?.writeText(onlineRoom.roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ==================== WAITING LOBBY VIEW ====================
  if (onlineRoom && onlineRoom.status === 'waiting') {
    const isHost = onlineRoom.hostId === localPlayerId;
    const takenColors = new Set(onlineRoom.players.map((p) => p.color));

    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8">
        <SkyMeadowBackdrop />
        <div className="relative z-10 w-full max-w-2xl rounded-3xl border-4 border-[#F5C542] border-b-[8px] border-b-[#D49B1A] bg-[#FAF6EE] p-6 sm:p-8 shadow-2xl space-y-6 text-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#E6D7B9] pb-5">
            <div>
              <p className="text-xs font-bold text-amber-700">ห้องรอเล่นออนไลน์</p>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                รหัสห้อง:{' '}
                <span className="font-mono-num tracking-widest text-rose-600">
                  {onlineRoom.roomCode}
                </span>
              </h1>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#FFFDF7] border-2 border-[#E6D7B9] border-b-4 hover:bg-amber-50 text-slate-800 text-sm font-bold transition-colors whitespace-nowrap"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4 text-sky-600" />
              )}
              <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกรหัสห้อง'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-bold text-slate-700">
            <span className="rounded-full bg-white border border-[#E6D7B9] px-3 py-1">
              {getModeLabel(onlineRoom.curriculumMode)}
            </span>
            <span className="font-mono-num rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-amber-900">
              จำนวนรอบ: {onlineRoom.maxRounds} รอบ · ผู้เล่น {onlineRoom.players.length}/4 คน
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((slotIdx) => {
              const p = onlineRoom.players[slotIdx];
              if (!p) {
                return (
                  <div
                    key={slotIdx}
                    className="flex items-center justify-between rounded-2xl border-2 border-dashed border-[#D8C6A0] bg-[#FFFDF7]/70 px-4 py-3.5 text-sm font-semibold text-slate-400"
                  >
                    <span>ช่องผู้เล่น #{slotIdx + 1} (ว่าง)</span>
                  </div>
                );
              }
              const meta = COLOR_META[p.color];
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl border-2 border-[#E6D7B9] border-b-4 bg-[#FFFDF7] px-4 py-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-6 w-6 rounded-full shrink-0 border-2 border-white shadow-[0_2px_0_rgba(0,0,0,0.28)]"
                      style={{ backgroundColor: meta.hex }}
                    />
                    <span className="font-extrabold text-slate-900 truncate">{p.name}</span>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 whitespace-nowrap">
                    {p.id === onlineRoom.hostId
                      ? 'หัวหน้าห้อง'
                      : p.isBot
                        ? 'บอท AI'
                        : 'ผู้เล่น'}
                  </span>
                </div>
              );
            })}
          </div>

          {takenColors.size > 0 && (
            <p className="text-xs font-medium text-slate-600">
              ผู้เล่นที่เข้าร่วมด้วยรหัส{' '}
              <span className="font-mono-num font-extrabold text-slate-900">
                {onlineRoom.roomCode}
              </span>{' '}
              จะถูกล็อกสีที่ถูกเลือกแล้วอัตโนมัติ
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#E6D7B9] pt-5">
            <button
              type="button"
              onClick={onLeaveOnlineRoom}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-[#D8C6A0] border-b-4 bg-white text-slate-700 hover:bg-slate-50 text-sm font-bold transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>ออกจากห้อง</span>
            </button>

            <div className="flex items-center gap-2.5">
              {isHost && onlineRoom.players.length < 4 && (
                <button
                  type="button"
                  onClick={onAddOnlineBot}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#38BDF8] hover:bg-sky-400 border-2 border-white border-b-4 border-b-sky-700 text-white text-sm font-extrabold transition-colors whitespace-nowrap"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>+ เพิ่มบอท</span>
                </button>
              )}
              {isHost ? (
                <button
                  type="button"
                  disabled={onlineRoom.players.length < 2}
                  onClick={onStartOnlineGame}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#65C438] hover:bg-[#57B12C] disabled:bg-slate-300 disabled:text-slate-500 border-2 border-white border-b-4 border-b-[#3D821E] text-white font-extrabold text-sm transition-colors whitespace-nowrap"
                >
                  <Play className="h-4 w-4" />
                  <span>เริ่มเกม</span>
                </button>
              ) : (
                <span className="text-sm text-amber-700 font-bold">
                  รอหัวหน้าห้องกดเริ่มเกม...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== HOME SCREEN: 2-STEP NO-SCROLL LOBBY ====================
  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center p-3 sm:p-5 text-slate-800 overflow-x-hidden">
      <SkyMeadowBackdrop />

      <AnimatePresence mode="wait">
        {lobbyStep === 'welcome' ? (
          /* STEP 1: Welcome / Title Screen (Card 1 centered + Large 3D Play CTA below) */
          <motion.div
            key="lobby-step-welcome"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-md sm:max-w-lg mx-auto flex flex-col items-center gap-4 sm:gap-5"
          >
            {/* Card 1 */}
            <div className="w-full rounded-3xl border-4 border-[#F5C542] border-b-[8px] border-b-[#D49B1A] bg-[#FAF6EE] p-4 sm:p-6 flex flex-col gap-3.5 sm:gap-4 shadow-[0_14px_30px_rgba(25,55,15,0.22)]">
              <MonopolyLogo className="mx-auto" />

              <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed text-center">
                เกมกระดานเศรษฐีสไตล์ 3D สดใสเพื่อการเรียนรู้สถิติศาสตร์ภาษาไทย ซื้อพื้นที่ด้วยโจทย์ไวลด 20% อัปเกรดด้วยมินิเกมแผนภูมิ และชิงโบนัสฐานนิยมลูกเต๋า!
              </p>

              {/* Color Group Mini Strip */}
              <div className="grid grid-cols-4 gap-2">
                <div className="h-2 sm:h-2.5 rounded-full bg-[#65C438] shadow-inner" />
                <div className="h-2 sm:h-2.5 rounded-full bg-[#38BDF8] shadow-inner" />
                <div className="h-2 sm:h-2.5 rounded-full bg-[#FB923C] shadow-inner" />
                <div className="h-2 sm:h-2.5 rounded-full bg-[#F43F5E] shadow-inner" />
              </div>

              <div className="rounded-2xl bg-[#FFFDF7] border-2 border-[#E6D7B9] p-3 sm:p-4 space-y-2 text-xs sm:text-sm text-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">กระดานการเรียนรู้</span>
                  <span className="font-mono-num text-slate-900 font-extrabold">16 ช่อง · 50+ โจทย์ · 3 โหมด</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold inline-flex items-center gap-1.5">
                    <BanknoteStackIcon className="h-4 w-5" />
                    ทุนวิจัยเริ่มต้น
                  </span>
                  <span className="font-mono-num text-emerald-700 font-extrabold">฿20,000</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">โจทย์ไวลดราคาซื้อพื้นที่</span>
                  <span className="font-mono-num text-sky-700 font-extrabold">ลดทันที 20%</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">โบนัสฐานนิยมลูกเต๋า</span>
                  <span className="font-mono-num text-amber-700 font-extrabold">+฿2,000 (ตั้งแต่รอบ 3)</span>
                </div>
              </div>

              <div className="pt-2.5 border-t-2 border-[#E6D7B9] flex flex-wrap items-center justify-center sm:justify-between gap-2">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenRules}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border-2 border-[#E6D7B9] border-b-4 bg-white hover:bg-amber-50 text-slate-800 text-xs sm:text-sm font-extrabold transition-colors whitespace-nowrap"
                  >
                    <BookOpen className="h-4 w-4 text-amber-600" />
                    <span>คู่มือกติกาการเล่น</span>
                  </button>
                  <button
                    type="button"
                    data-testid="lobby-credits-btn"
                    onClick={() => setShowCredits(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border-2 border-[#E6D7B9] border-b-4 bg-white hover:bg-sky-50 text-slate-800 text-xs sm:text-sm font-extrabold transition-colors whitespace-nowrap"
                  >
                    <Award className="h-4 w-4 text-sky-600" />
                    <span>เครดิตผู้จัดทำ</span>
                  </button>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Enter / Space เพื่อเข้าเล่น
                </span>
              </div>
            </div>

            {/* Large 3D Green/Orange Play Button below Card 1 */}
            <motion.button
              type="button"
              data-testid="lobby-play-btn"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97, y: 3 }}
              onClick={() => setLobbyStep('setup')}
              className="w-full max-w-md inline-flex items-center justify-center gap-3 px-6 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-b from-[#72D63F] via-[#57B92A] to-[#F59E0B] hover:brightness-105 border-[3px] border-white shadow-[0_6px_0_#3D821E,0_12px_24px_rgba(30,65,20,0.28)] active:shadow-[0_2px_0_#3D821E] text-white font-black text-base sm:text-lg tracking-wide transition-all cursor-pointer"
            >
              <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-white shrink-0" />
              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                เข้าสู่เกม / เลือกโหมดเล่น (Play)
              </span>
            </motion.button>
          </motion.div>
        ) : (
          /* STEP 2: Game Setup Screen (Only Card 2 centered with Back button) */
          <motion.div
            key="lobby-step-setup"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-2xl mx-auto rounded-3xl border-4 border-[#F5C542] border-b-[8px] border-b-[#D49B1A] bg-[#FAF6EE] p-3.5 sm:p-5 space-y-3 sm:space-y-3.5 shadow-[0_14px_30px_rgba(25,55,15,0.22)]"
          >
            {/* Top-left Back Button */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-[#E6D7B9]">
              <button
                type="button"
                data-testid="lobby-back-btn"
                onClick={() => setLobbyStep('welcome')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#E6D7B9] border-b-3 bg-white hover:bg-amber-50 text-slate-700 text-xs font-extrabold transition-colors whitespace-nowrap"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-amber-600" />
                <span>กลับหน้าหลัก</span>
              </button>
              <span className="text-xs font-extrabold text-amber-800 bg-amber-100/80 border border-amber-300 rounded-full px-3 py-0.5">
                ตั้งค่าตัวละครและโหมดเล่น
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="player-name-input"
                  className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1"
                >
                  ชื่อผู้เล่น (Player Name)
                </label>
                <input
                  id="player-name-input"
                  type="text"
                  maxLength={18}
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    if (nameWarning) setNameWarning(null);
                  }}
                  placeholder="เช่น น้องซิกมา"
                  className="w-full rounded-2xl border-2 border-[#E6D7B9] bg-[#FFFDF7] px-3 py-2 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:outline-none"
                />
                {nameWarning && (
                  <p className="mt-1 text-xs font-bold text-rose-600">{nameWarning}</p>
                )}
              </div>

              <div>
                <span className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1">
                  สีตัวหมาก 3D (Token Color)
                </span>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {ALL_COLORS.map((c) => {
                    const meta = COLOR_META[c];
                    const active = playerColor === c;
                    const isTaken = takenColorsInJoinRoom.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        disabled={isTaken}
                        onClick={() => setPlayerColor(c)}
                        aria-label={isTaken ? `${meta.label} (ถูกเลือกแล้ว)` : meta.label}
                        className={`flex flex-col items-center justify-center gap-0.5 rounded-xl sm:rounded-2xl border-2 py-1.5 text-[11px] sm:text-xs font-extrabold transition-all ${
                          isTaken
                            ? 'border-slate-200 bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
                            : active
                              ? 'border-amber-500 border-b-4 bg-amber-50 text-slate-900 shadow-sm -translate-y-0.5'
                              : 'border-[#E6D7B9] bg-[#FFFDF7] text-slate-600 hover:border-amber-300'
                        }`}
                      >
                        <span
                          className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-white shadow-[0_2px_0_rgba(0,0,0,0.3)]"
                          style={{ backgroundColor: meta.hex }}
                        />
                        <span>{isTaken ? 'ถูกใช้' : meta.label.replace('สี', '')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <span className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1.5">
                เลือกเรื่องที่จะเล่น (Curriculum Mode)
              </span>
              <div className="space-y-1.5">
                {CURRICULUM_OPTIONS.map((opt) => {
                  const selected = curriculumMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCurriculumMode(opt.id)}
                      className={`w-full rounded-2xl border-2 px-3 sm:px-4 py-2 text-left transition-all ${
                        selected
                          ? 'border-sky-500 border-b-4 bg-sky-50 text-slate-900 shadow-sm'
                          : 'border-[#E6D7B9] bg-[#FFFDF7] text-slate-700 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: opt.badgeColor }}
                        />
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900">{opt.title}</p>
                      </div>
                      <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-0.5 pl-4.5 line-clamp-1">
                        {opt.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5 border-t-2 border-[#E6D7B9] pt-3">
              <button
                type="button"
                data-start="true"
                onClick={() => {
                  if (validateName()) setShowSoloSetup(true);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-2xl bg-[#65C438] hover:bg-[#57B12C] border-2 border-white shadow-[0_5px_0_#3D821E] active:translate-y-0.5 active:shadow-[0_2px_0_#3D821E] text-white font-extrabold text-sm sm:text-base transition-all whitespace-nowrap"
              >
                <Bot className="h-5 w-5" />
                <span>เล่นคนเดียวกับบอท (Solo vs Bot)</span>
              </button>

              <div className="rounded-2xl border-2 border-[#E6D7B9] bg-[#FFFDF7] p-2.5 sm:p-3 space-y-2">
                {!isFirebaseConfigured && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p>กรุณาตั้งค่า Firebase Realtime Database ใน src/firebaseConfig.ts</p>
                  </div>
                )}

                {onlineError && (
                  <p className="rounded-xl border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700">
                    {onlineError}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (validateName()) onCreateOnlineRoom();
                    }}
                    className="sm:col-span-5 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl sm:rounded-2xl bg-[#38BDF8] hover:bg-sky-400 border-2 border-white shadow-[0_3px_0_#0284C7] active:translate-y-0.5 text-white font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap"
                  >
                    <Globe className="h-4 w-4" />
                    <span>สร้างห้องออนไลน์</span>
                  </button>

                  <div className="sm:col-span-7 flex items-center gap-1.5 sm:gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={joinCode}
                      onChange={(e) => {
                        const next = e.target.value.toUpperCase();
                        setJoinCode(next);
                        onCheckJoinRoomColors(next);
                      }}
                      placeholder="รหัสห้อง 6 หลัก"
                      aria-label="รหัสห้อง 6 หลัก"
                      className="flex-1 min-w-0 rounded-xl sm:rounded-2xl border-2 border-[#E6D7B9] bg-white px-2.5 py-2 text-xs sm:text-sm font-mono-num font-bold uppercase tracking-wider text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (validateName()) onJoinOnlineRoom(joinCode.trim().toUpperCase());
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl sm:rounded-2xl border-2 border-[#E6D7B9] border-b-4 bg-[#FAF6EE] hover:bg-amber-50 text-slate-800 font-extrabold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0"
                    >
                      <LogIn className="h-3.5 w-3.5 text-sky-600" />
                      <span>เข้าร่วมห้อง</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Solo Setup Modal */}
      <AnimatePresence>
        {showSoloSetup && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="solo-setup-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-md max-h-[90dvh] overflow-y-auto custom-scrollbar rounded-3xl border-4 border-[#F5C542] border-b-[8px] border-b-[#D49B1A] bg-[#FAF6EE] p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl text-slate-800"
            >
              <div>
                <h2 id="solo-setup-title" className="text-lg font-extrabold text-slate-900">
                  ตั้งค่าการแข่งขันกับบอท AI
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  เลือกจำนวนคู่แข่ง ระดับความฉลาด และจำนวนรอบการแข่งขัน
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-extrabold text-slate-700 mb-2">
                    จำนวนบอท AI
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {([1, 2, 3] as const).map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setBotCount(cnt)}
                        className={`py-2.5 rounded-2xl border-2 text-sm font-extrabold transition-all ${
                          botCount === cnt
                            ? 'border-[#65C438] border-b-4 bg-emerald-50 text-emerald-700'
                            : 'border-[#E6D7B9] bg-[#FFFDF7] text-slate-600 hover:border-amber-300'
                        }`}
                      >
                        {cnt} ตัว ({cnt + 1} คน)
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-extrabold text-slate-700 mb-2">
                    ระดับความเก่งของบอท
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBotDifficulty('rookie')}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${
                        botDifficulty === 'rookie'
                          ? 'border-sky-500 border-b-4 bg-sky-50 text-slate-900'
                          : 'border-[#E6D7B9] bg-[#FFFDF7] text-slate-600'
                      }`}
                    >
                      <p className="text-sm font-extrabold">บอทมือใหม่</p>
                      <p className="text-[11px] font-medium text-slate-500">ตอบถูกประมาณ 50%</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBotDifficulty('professor')}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${
                        botDifficulty === 'professor'
                          ? 'border-sky-500 border-b-4 bg-sky-50 text-slate-900'
                          : 'border-[#E6D7B9] bg-[#FFFDF7] text-slate-600'
                      }`}
                    >
                      <p className="text-sm font-extrabold">บอทศาสตราจารย์</p>
                      <p className="text-[11px] font-medium text-slate-500">ตอบถูกประมาณ 85%</p>
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-extrabold text-slate-700 mb-2">
                    จำนวนรอบสูงสุด
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {([10, 15, 20] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setMaxRounds(r)}
                        className={`py-2 rounded-2xl border-2 text-sm font-mono-num font-extrabold transition-all ${
                          maxRounds === r
                            ? 'border-amber-500 border-b-4 bg-amber-50 text-amber-700'
                            : 'border-[#E6D7B9] bg-[#FFFDF7] text-slate-600'
                        }`}
                      >
                        {r} รอบ
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-[#E6D7B9]">
                <button
                  type="button"
                  onClick={() => setShowSoloSetup(false)}
                  className="px-4 py-2.5 rounded-2xl border-2 border-[#D8C6A0] border-b-4 bg-white text-slate-700 hover:bg-slate-50 text-sm font-extrabold whitespace-nowrap"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSoloSetup(false);
                    onStartSolo(botCount, botDifficulty, maxRounds);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-[#65C438] hover:bg-[#57B12C] border-2 border-white shadow-[0_4px_0_#3D821E] text-white font-extrabold text-sm transition-all whitespace-nowrap"
                >
                  เริ่มเกมทันที
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showCredits && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4"
            onClick={() => setShowCredits(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="credits-modal-title"
              data-testid="lobby-credits-modal"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border-4 border-[#F5C542] border-b-[8px] border-b-[#D49B1A] bg-[#FAF6EE] p-5 sm:p-6 shadow-2xl space-y-4 text-slate-800"
            >
              <div className="flex items-center justify-between gap-3 border-b-2 border-[#E6D7B9] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 border-2 border-sky-300 text-sky-600">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 id="credits-modal-title" className="text-lg font-extrabold text-slate-900">
                      เครดิตผู้จัดทำ
                    </h2>
                    <p className="text-xs font-semibold text-amber-700">
                      Data Tycoon: สถิติพิชิตเศรษฐี
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCredits(false)}
                  aria-label="ปิดหน้าต่างเครดิต"
                  className="p-1.5 rounded-xl border-2 border-[#E6D7B9] bg-white hover:bg-amber-50 text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-2xl bg-[#FFFDF7] border-2 border-[#E6D7B9] p-4 sm:p-5 text-center space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
                  ผู้พัฒนาและออกแบบเกม
                </p>
                <p className="text-base sm:text-lg font-black text-slate-900">
                  จัดทำโดยนาย นเรศพล เกตุหนู
                </p>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs sm:text-sm font-extrabold">
                  <span>ม6/4 เลขที่9</span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  data-testid="lobby-credits-close-btn"
                  onClick={() => setShowCredits(false)}
                  className="px-5 py-2 rounded-2xl bg-[#38BDF8] hover:bg-sky-400 border-2 border-white shadow-[0_4px_0_#0284C7] active:translate-y-0.5 text-white font-extrabold text-sm transition-all"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
