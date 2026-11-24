import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { get, onValue, ref, set } from 'firebase/database';
import { ScrollText, X } from 'lucide-react';
import { isFirebaseConfigured, rtdb } from './firebaseConfig';
import { getBoardTiles, pickQuizQuestionWithHistory, pickUpgradeChallenge } from './gameData';
import {
  calculateRent,
  computeDiceStats,
  createEmptyDiceCounts,
  createInitialProperties,
  evaluateGameEnd,
  findNextTurn,
  generateRoomCode,
  getModeLabel,
  getSellToBankValue,
  getStepPath,
  getTakeoverCost,
  LAB_BAIL_COST,
  MODE_BONUS_AMOUNT,
  QUIZ_PENALTY,
  QUIZ_REWARD,
  START_PASS_BONUS,
  STARTING_CASH,
  TAX_AMOUNT,
  WARP_COST,
} from './gameRules';
import {
  BOT_DELAYS,
  BOT_NAMES,
  getBotGreeting,
  getScaledDelay,
  pickBotPropertyToSell,
  pickBotQuizAnswer,
  pickBotWarpDestination,
  shouldBotBuyProperty,
  shouldBotPayLabBail,
  shouldBotTakeover,
  shouldBotUpgradeProperty,
  type GameSpeed,
} from './botLogic';
import { soundFx } from './soundFx';
import type {
  BotDifficulty,
  CurriculumMode,
  GameState,
  LogEntry,
  MoneyPopup,
  Player,
  TileConfig,
  TokenColor,
} from './types';
import { Lobby } from './components/Lobby';
import { Board } from './components/Board';
import {
  BottomMonopolyDock,
  FrequencyModal,
  PlayerStatsModal,
  TopMonopolyBar,
} from './components/MonopolyHud';
import { QuizModal } from './components/QuizModal';
import { UpgradeModal } from './components/UpgradeModal';
import { ActionModal } from './components/ActionModal';
import { RulesModal } from './components/RulesModal';
import { SummaryModal } from './components/SummaryModal';

const ALL_COLORS: TokenColor[] = ['red', 'blue', 'green', 'yellow'];

function makeLog(round: number, message: string, tone: LogEntry['tone'] = 'info'): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    round,
    message,
    tone,
  };
}

function prependLog(logs: LogEntry[], entry: LogEntry): LogEntry[] {
  return [entry, ...logs].slice(0, 60);
}

function buildTurnSpeech(player: Player | undefined): string {
  if (!player) return 'เตรียมพร้อมทอยลูกเต๋า!';
  if (player.inLab) {
    return `${player.name} อยู่ในห้องแล็บ (${player.labTurns}/2 รอบ) ทอยเลขคู่หรือจ่าย ฿1,500 เพื่อออก!`;
  }
  if (player.isBot) {
    return `ตาของ ${player.name} กำลังคิด...`;
  }
  return `ตาของ ${player.name} กดทอยลูกเต๋าได้เลย!`;
}

function sanitizeFirebaseState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<GameState>;
  const mode: CurriculumMode = r.curriculumMode ?? 'mode3';
  const tiles = getBoardTiles(mode);
  const baseProps = createInitialProperties(tiles);
  const mergedProps = { ...baseProps, ...(r.properties ?? {}) };
  const baseDice = createEmptyDiceCounts();
  const mergedDice = { ...baseDice, ...(r.diceCounts ?? {}) };
  const players = Array.isArray(r.players) ? r.players : [];
  const turnIdx = r.turnIndex ?? 0;

  return {
    roomCode: r.roomCode ?? null,
    isOnline: Boolean(r.isOnline),
    hostId: r.hostId ?? '',
    status: r.status ?? 'waiting',
    curriculumMode: mode,
    maxRounds: (r.maxRounds as 10 | 15 | 20) ?? 15,
    currentRound: r.currentRound ?? 1,
    turnIndex: turnIdx,
    phase: r.phase ?? 'IDLE',
    turnStartedAt: r.turnStartedAt ?? Date.now(),
    players,
    properties: mergedProps,
    diceCounts: mergedDice,
    totalRolls: r.totalRolls ?? 0,
    lastDice: r.lastDice ?? null,
    speechMessage: r.speechMessage ?? buildTurnSpeech(players[turnIdx]),
    pendingAction: r.pendingAction ?? null,
    activeQuiz: r.activeQuiz ?? null,
    activeUpgradeChallenge: r.activeUpgradeChallenge ?? null,
    usedQuestionIds: Array.isArray(r.usedQuestionIds) ? r.usedQuestionIds : [],
    logs: Array.isArray(r.logs) ? r.logs : [],
    winnerId: r.winnerId ?? null,
    endReason: r.endReason ?? null,
  };
}

function cleanForFirebase(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export default function App() {
  const [localPlayerId] = useState<string>(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('dt_player_id') : null;
    if (saved) return saved;
    const created = `p-${Math.random().toString(36).slice(2, 10)}`;
    if (typeof window !== 'undefined') sessionStorage.setItem('dt_player_id', created);
    return created;
  });

  const [playerName, setPlayerName] = useState<string>('นักสถิติมือทอง');
  const [playerColor, setPlayerColor] = useState<TokenColor>('blue');
  const [curriculumMode, setCurriculumMode] = useState<CurriculumMode>('mode3');
  const [maxRounds, setMaxRounds] = useState<10 | 15 | 20>(15);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [takenColorsInJoinRoom, setTakenColorsInJoinRoom] = useState<TokenColor[]>([]);
  const [rulesOpen, setRulesOpen] = useState<boolean>(false);
  const [logDrawerOpen, setLogDrawerOpen] = useState<boolean>(false);
  const [frequencyModalOpen, setFrequencyModalOpen] = useState<boolean>(false);
  const [playerStatsModalOpen, setPlayerStatsModalOpen] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [gameSpeed, setGameSpeed] = useState<GameSpeed>(1);
  const [moneyPopups, setMoneyPopups] = useState<MoneyPopup[]>([]);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [lastSoloConfig, setLastSoloConfig] = useState<{
    botCount: 1 | 2 | 3;
    difficulty: BotDifficulty;
    rounds: 10 | 15 | 20;
  }>({ botCount: 2, difficulty: 'rookie', rounds: 15 });

  const botTimerRef = useRef<number | null>(null);
  const turnTimersRef = useRef<number[]>([]);
  const isSteppingRef = useRef<boolean>(false);
  const stateRef = useRef<GameState | null>(null);
  stateRef.current = gameState;
  const gameSpeedRef = useRef<GameSpeed>(1);
  gameSpeedRef.current = gameSpeed;
  const prevCashMapRef = useRef<Record<string, number> | null>(null);

  const clearTurnTimers = useCallback(() => {
    turnTimersRef.current.forEach((id) => window.clearTimeout(id));
    turnTimersRef.current = [];
    isSteppingRef.current = false;
  }, []);

  const scheduleTurnTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    turnTimersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      clearTurnTimers();
    };
  }, [clearTurnTimers]);

  // Detect any player cash gain/loss and spawn Floating Money Text popups
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') {
      prevCashMapRef.current = null;
      return;
    }

    const nextMap: Record<string, number> = {};
    for (const p of gameState.players) {
      nextMap[p.id] = p.cash;
    }

    if (!prevCashMapRef.current) {
      prevCashMapRef.current = nextMap;
      return;
    }

    const deltas: MoneyPopup[] = [];
    for (const p of gameState.players) {
      const prevCash = prevCashMapRef.current[p.id];
      if (typeof prevCash === 'number' && prevCash !== p.cash) {
        deltas.push({
          id: `${p.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          playerId: p.id,
          amount: p.cash - prevCash,
        });
      }
    }
    prevCashMapRef.current = nextMap;

    if (deltas.length > 0) {
      setMoneyPopups((prev) => [...prev, ...deltas].slice(-12));
      const ids = new Set(deltas.map((d) => d.id));
      window.setTimeout(() => {
        setMoneyPopups((prev) => prev.filter((item) => !ids.has(item.id)));
      }, 1900);
    }
  }, [gameState?.status, gameState?.players]);

  const tiles = useMemo<TileConfig[]>(
    () => getBoardTiles(gameState?.curriculumMode ?? curriculumMode),
    [gameState?.curriculumMode, curriculumMode]
  );

  useEffect(() => {
    if (!gameState || gameState.status === 'waiting') {
      document.body.dataset.state = rulesOpen ? 'paused' : 'title';
    } else if (gameState.status === 'finished' || gameState.phase === 'GAME_OVER') {
      document.body.dataset.state = 'gameover';
    } else if (rulesOpen) {
      document.body.dataset.state = 'paused';
    } else {
      document.body.dataset.state = 'playing';
    }
  }, [gameState, rulesOpen]);

  const commitState = useCallback((next: GameState) => {
    setGameState(next);
    if (next.isOnline && next.roomCode && rtdb) {
      set(ref(rtdb, `rooms/${next.roomCode}`), cleanForFirebase(next)).catch((err) => {
        console.error('Firebase sync error:', err);
      });
    }
  }, []);

  const activeOnlineRoomCode = gameState?.isOnline ? gameState.roomCode : null;
  useEffect(() => {
    if (!activeOnlineRoomCode || !rtdb) return;
    const roomRef = ref(rtdb, `rooms/${activeOnlineRoomCode}`);
    const unsub = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists() || isSteppingRef.current) return;
      const parsed = sanitizeFirebaseState(snapshot.val());
      if (parsed) {
        setGameState(parsed);
      }
    });
    return () => unsub();
  }, [activeOnlineRoomCode]);

  // 1-second timer for turn countdown bar & 45s skip-turn safety
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [gameState?.status]);

  // ==================== START SOLO GAME ====================
  const handleStartSolo = useCallback(
    (botCount: 1 | 2 | 3, difficulty: BotDifficulty, rounds: 10 | 15 | 20) => {
      setLastSoloConfig({ botCount, difficulty, rounds });
      const availableColors = ALL_COLORS.filter((c) => c !== playerColor);
      const human: Player = {
        id: localPlayerId,
        name: playerName.trim() || 'ผู้เล่น 1',
        color: playerColor,
        isBot: false,
        position: 1,
        cash: STARTING_CASH,
        inLab: false,
        labTurns: 0,
        bankrupt: false,
        quizCorrect: 0,
        quizTotal: 0,
        modeBonusesEarned: 0,
      };

      const bots: Player[] = Array.from({ length: botCount }).map((_, idx) => ({
        id: `bot-${idx + 1}`,
        name: BOT_NAMES[idx],
        color: availableColors[idx],
        isBot: true,
        botDifficulty: difficulty,
        position: 1,
        cash: STARTING_CASH,
        inLab: false,
        labTurns: 0,
        bankrupt: false,
        quizCorrect: 0,
        quizTotal: 0,
        modeBonusesEarned: 0,
      }));

      const modeTiles = getBoardTiles(curriculumMode);
      const initialState: GameState = {
        roomCode: null,
        isOnline: false,
        hostId: localPlayerId,
        status: 'playing',
        curriculumMode,
        maxRounds: rounds,
        currentRound: 1,
        turnIndex: 0,
        phase: 'IDLE',
        turnStartedAt: Date.now(),
        players: [human, ...bots],
        properties: createInitialProperties(modeTiles),
        diceCounts: createEmptyDiceCounts(),
        totalRolls: 0,
        lastDice: null,
        speechMessage: buildTurnSpeech(human),
        pendingAction: null,
        activeQuiz: null,
        activeUpgradeChallenge: null,
        usedQuestionIds: [],
        logs: [
          makeLog(1, `${bots[0].name}: "${getBotGreeting(difficulty)}"`, 'info'),
          makeLog(1, `เริ่มเกมโหมด ${getModeLabel(curriculumMode)} (${rounds} รอบ)`, 'bonus'),
        ],
        winnerId: null,
        endReason: null,
      };

      setRulesOpen(false);
      setGameState(initialState);
    },
    [curriculumMode, localPlayerId, playerColor, playerName]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && !stateRef.current) {
      handleStartSolo(2, 'rookie', 15);
    }
  }, [handleStartSolo]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current && stateRef.current.status !== 'waiting') {
        if (e.key === 'Escape') {
          setRulesOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // ==================== ONLINE ROOM HANDLERS ====================
  const handleCheckJoinRoomColors = async (code: string) => {
    setOnlineError(null);
    if (code.length !== 6 || !isFirebaseConfigured || !rtdb) {
      setTakenColorsInJoinRoom([]);
      return;
    }
    try {
      const snap = await get(ref(rtdb, `rooms/${code}`));
      if (!snap.exists()) {
        setTakenColorsInJoinRoom([]);
        return;
      }
      const room = sanitizeFirebaseState(snap.val());
      if (!room) return;
      const taken = room.players.map((p) => p.color);
      setTakenColorsInJoinRoom(taken);
      if (taken.includes(playerColor)) {
        const free = ALL_COLORS.find((c) => !taken.includes(c));
        if (free) setPlayerColor(free);
      }
    } catch {
      setTakenColorsInJoinRoom([]);
    }
  };

  const handleCreateOnlineRoom = async () => {
    setOnlineError(null);
    if (!isFirebaseConfigured || !rtdb) {
      setOnlineError(
        'ยังไม่ได้ตั้งค่า Firebase Realtime Database ในไฟล์ src/firebaseConfig.ts กรุณาใส่ค่า Config ของคุณ หรือกดเล่นโหมด "เล่นคนเดียวกับบอท"'
      );
      return;
    }

    try {
      let roomCode = generateRoomCode();
      for (let attempt = 0; attempt < 5; attempt++) {
        const snap = await get(ref(rtdb, `rooms/${roomCode}`));
        if (!snap.exists()) break;
        roomCode = generateRoomCode();
      }

      const host: Player = {
        id: localPlayerId,
        name: playerName.trim() || 'หัวหน้าห้อง',
        color: playerColor,
        isBot: false,
        position: 1,
        cash: STARTING_CASH,
        inLab: false,
        labTurns: 0,
        bankrupt: false,
        quizCorrect: 0,
        quizTotal: 0,
        modeBonusesEarned: 0,
      };

      const modeTiles = getBoardTiles(curriculumMode);
      const roomState: GameState = {
        roomCode,
        isOnline: true,
        hostId: localPlayerId,
        status: 'waiting',
        curriculumMode,
        maxRounds,
        currentRound: 1,
        turnIndex: 0,
        phase: 'IDLE',
        turnStartedAt: Date.now(),
        players: [host],
        properties: createInitialProperties(modeTiles),
        diceCounts: createEmptyDiceCounts(),
        totalRolls: 0,
        lastDice: null,
        speechMessage: buildTurnSpeech(host),
        pendingAction: null,
        activeQuiz: null,
        activeUpgradeChallenge: null,
        usedQuestionIds: [],
        logs: [makeLog(1, `สร้างห้องออนไลน์ ${roomCode} สำเร็จ`, 'info')],
        winnerId: null,
        endReason: null,
      };

      await set(ref(rtdb, `rooms/${roomCode}`), cleanForFirebase(roomState));
      setGameState(roomState);
    } catch (err) {
      setOnlineError(
        `ไม่สามารถสร้างห้องได้: ${err instanceof Error ? err.message : 'โปรดตรวจสอบสิทธิ์ Firebase RTDB'}`
      );
    }
  };

  const handleJoinOnlineRoom = async (code: string) => {
    setOnlineError(null);
    if (!isFirebaseConfigured || !rtdb) {
      setOnlineError(
        'ยังไม่ได้ตั้งค่า Firebase Realtime Database ในไฟล์ src/firebaseConfig.ts กรุณาใส่ค่า Config ของคุณก่อนเข้าร่วมห้องออนไลน์'
      );
      return;
    }
    if (code.length !== 6) {
      setOnlineError('กรุณากรอกรหัสห้อง 6 หลักให้ครบถ้วน');
      return;
    }

    try {
      const snap = await get(ref(rtdb, `rooms/${code}`));
      if (!snap.exists()) {
        setOnlineError(`ไม่พบห้องรหัส "${code}" กรุณาตรวจสอบรหัสอีกครั้ง`);
        return;
      }
      const room = sanitizeFirebaseState(snap.val());
      if (!room) {
        setOnlineError('ข้อมูลห้องไม่ถูกต้อง');
        return;
      }
      if (room.status !== 'waiting') {
        setOnlineError('ห้องนี้เริ่มการแข่งขันไปแล้ว ไม่สามารถเข้าร่วมได้');
        return;
      }
      const alreadyIn = room.players.some((p) => p.id === localPlayerId);
      if (!alreadyIn && room.players.length >= 4) {
        setOnlineError('ห้องนี้มีผู้เล่นครบ 4 คนแล้ว');
        return;
      }

      if (!alreadyIn) {
        const taken = room.players.map((p) => p.color);
        const chosenColor = taken.includes(playerColor)
          ? ALL_COLORS.find((c) => !taken.includes(c)) ?? playerColor
          : playerColor;

        const newPlayer: Player = {
          id: localPlayerId,
          name: playerName.trim() || `ผู้เล่น ${room.players.length + 1}`,
          color: chosenColor,
          isBot: false,
          position: 1,
          cash: STARTING_CASH,
          inLab: false,
          labTurns: 0,
          bankrupt: false,
          quizCorrect: 0,
          quizTotal: 0,
          modeBonusesEarned: 0,
        };

        const updated: GameState = {
          ...room,
          players: [...room.players, newPlayer],
          logs: prependLog(room.logs, makeLog(1, `${newPlayer.name} เข้าร่วมห้อง`, 'info')),
        };
        await set(ref(rtdb, `rooms/${code}`), cleanForFirebase(updated));
        setGameState(updated);
      } else {
        setGameState(room);
      }
    } catch (err) {
      setOnlineError(
        `ไม่สามารถเข้าร่วมห้องได้: ${err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'}`
      );
    }
  };

  const handleAddOnlineBot = () => {
    if (!gameState || !gameState.isOnline || gameState.players.length >= 4) return;
    const takenColors = new Set(gameState.players.map((p) => p.color));
    const freeColor = ALL_COLORS.find((c) => !takenColors.has(c)) ?? 'red';
    const botIdx = gameState.players.filter((p) => p.isBot).length;
    const bot: Player = {
      id: `bot-${Date.now()}-${botIdx}`,
      name: BOT_NAMES[botIdx % BOT_NAMES.length],
      color: freeColor,
      isBot: true,
      botDifficulty: 'rookie',
      position: 1,
      cash: STARTING_CASH,
      inLab: false,
      labTurns: 0,
      bankrupt: false,
      quizCorrect: 0,
      quizTotal: 0,
      modeBonusesEarned: 0,
    };
    commitState({
      ...gameState,
      players: [...gameState.players, bot],
      logs: prependLog(gameState.logs, makeLog(1, `เพิ่ม ${bot.name} เข้าห้อง`, 'info')),
    });
  };

  const handleStartOnlineGame = () => {
    if (!gameState || !gameState.isOnline || gameState.players.length < 2) return;
    commitState({
      ...gameState,
      status: 'playing',
      phase: 'IDLE',
      turnStartedAt: Date.now(),
      speechMessage: buildTurnSpeech(gameState.players[0]),
      logs: prependLog(
        gameState.logs,
        makeLog(1, `เริ่มเกมออนไลน์! ${getModeLabel(gameState.curriculumMode)}`, 'bonus')
      ),
    });
  };

  const handleLeaveOnlineRoom = () => {
    setGameState(null);
    setTakenColorsInJoinRoom([]);
  };

  // ==================== TURN ADVANCEMENT & END CHECK ====================
  const advanceTurnAndCheckEnd = useCallback(
    (state: GameState, actionSummary?: string): GameState => {
      const stateTiles = getBoardTiles(state.curriculumMode);
      const { nextTurnIndex, nextRound } = findNextTurn(
        state.players,
        state.turnIndex,
        state.currentRound
      );
      const nextPlayer = state.players[nextTurnIndex];
      const nextSpeech = actionSummary
        ? nextPlayer && !nextPlayer.isBot
          ? `${actionSummary} · ตาของ ${nextPlayer.name} ทอยเต๋าได้เลย!`
          : actionSummary
        : buildTurnSpeech(nextPlayer);

      const provisional: GameState = {
        ...state,
        turnIndex: nextTurnIndex,
        currentRound: nextRound,
        phase: 'IDLE',
        speechMessage: nextSpeech,
        pendingAction: null,
        activeQuiz: null,
        activeUpgradeChallenge: null,
        turnStartedAt: Date.now(),
      };

      const endEval = evaluateGameEnd(provisional, stateTiles);
      if (endEval.ended) {
        soundFx.playVictory();
        const winner = provisional.players.find((p) => p.id === endEval.winnerId);
        return {
          ...provisional,
          status: 'finished',
          phase: 'GAME_OVER',
          winnerId: endEval.winnerId,
          endReason: endEval.reason,
          speechMessage: `จบเกม! ผู้ชนะคือ ${winner?.name ?? 'แชมป์สถิติ'}`,
          logs: prependLog(
            provisional.logs,
            makeLog(state.currentRound, 'จบการแข่งขัน! สรุปผลสถิติผู้ชนะ', 'bonus')
          ),
        };
      }
      return provisional;
    },
    []
  );

  const checkDebtOrAdvance = useCallback(
    (state: GameState, playerIndex: number, actionSummary?: string): GameState => {
      const stateTiles = getBoardTiles(state.curriculumMode);
      const players = [...state.players];
      const properties = { ...state.properties };
      let logs = [...state.logs];
      const player = { ...players[playerIndex] };

      if (player.cash >= 0) {
        return advanceTurnAndCheckEnd(state, actionSummary);
      }

      if (player.isBot) {
        while (player.cash < 0) {
          const sellTileId = pickBotPropertyToSell(player, { ...state, properties }, stateTiles);
          if (sellTileId === null) break;
          const tile = stateTiles.find((t) => t.id === sellTileId)!;
          const sellVal = getSellToBankValue(tile, properties[sellTileId]);
          player.cash += sellVal;
          properties[sellTileId] = { ownerId: null, level: 0 };
          logs = prependLog(
            logs,
            makeLog(
              state.currentRound,
              `${player.name} ขาย ${tile.shortName} คืนธนาคารได้ +฿${sellVal.toLocaleString()}`,
              'alert'
            )
          );
        }

        if (player.cash < 0) {
          player.bankrupt = true;
          soundFx.playAlert();
          logs = prependLog(
            logs,
            makeLog(state.currentRound, `${player.name} ล้มละลายและออกจากการแข่งขัน!`, 'loss')
          );
        }
        players[playerIndex] = player;
        return advanceTurnAndCheckEnd({ ...state, players, properties, logs }, actionSummary);
      }

      return {
        ...state,
        phase: 'ACTION',
        speechMessage: `${player.name} เงินสดติดลบ! กรุณาขายทรัพย์สิน`,
        pendingAction: {
          type: 'sell_for_debt',
          tileId: player.position,
          amount: Math.abs(player.cash),
        },
      };
    },
    [advanceTurnAndCheckEnd]
  );

  const resolveLandingTile = useCallback(
    (state: GameState, playerIndex: number, diceRoll: number): GameState => {
      const stateTiles = getBoardTiles(state.curriculumMode);
      const players = [...state.players];
      const properties = { ...state.properties };
      let logs = [...state.logs];
      const player = { ...players[playerIndex] };
      const tile = stateTiles.find((t) => t.id === player.position)!;

      if (tile.type === 'start') {
        return advanceTurnAndCheckEnd({ ...state, players, properties, logs });
      }

      if (tile.type === 'go_to_lab') {
        player.position = 5;
        player.inLab = true;
        player.labTurns = 0;
        players[playerIndex] = player;
        soundFx.playAlert();
        logs = prependLog(
          logs,
          makeLog(
            state.currentRound,
            `${player.name} ข้อมูลคลาดเคลื่อน! ถูกส่งไปห้องแล็บวิจัย (ช่อง 5)`,
            'alert'
          )
        );
        return advanceTurnAndCheckEnd(
          { ...state, players, properties, logs },
          `${player.name} ข้อมูลพลาด! ถูกส่งไปห้องแล็บวิจัย`
        );
      }

      if (tile.type === 'lab') {
        logs = prependLog(
          logs,
          makeLog(state.currentRound, `${player.name} แวะเยี่ยมชมห้องแล็บวิจัย`, 'info')
        );
        return advanceTurnAndCheckEnd(
          { ...state, players, properties, logs },
          `${player.name} แวะเยี่ยมชมห้องแล็บวิจัย`
        );
      }

      if (tile.type === 'tax') {
        player.cash -= TAX_AMOUNT;
        players[playerIndex] = player;
        soundFx.playPay();
        const taxMsg = `${player.name} จ่ายค่าปรับข้อมูลรั่วไหล -฿${TAX_AMOUNT.toLocaleString()}`;
        logs = prependLog(logs, makeLog(state.currentRound, taxMsg, 'loss'));
        return checkDebtOrAdvance({ ...state, players, properties, logs }, playerIndex, taxMsg);
      }

      if (tile.type === 'warp') {
        if (player.isBot) {
          if (player.cash >= 3500) {
            const destId = pickBotWarpDestination(player, state, stateTiles);
            player.cash -= WARP_COST;
            player.position = destId;
            if (destId === 1) {
              player.cash += START_PASS_BONUS;
            }
            players[playerIndex] = player;
            const destTile = stateTiles.find((t) => t.id === destId)!;
            logs = prependLog(
              logs,
              makeLog(
                state.currentRound,
                `${player.name} จ่าย ฿1,000 วาร์ปไปที่ ${destTile.shortName}`,
                'info'
              )
            );
            return resolveLandingTile({ ...state, players, properties, logs }, playerIndex, diceRoll);
          }
          return advanceTurnAndCheckEnd({ ...state, players, properties, logs });
        }

        if (player.cash >= WARP_COST) {
          return {
            ...state,
            players,
            properties,
            logs,
            phase: 'ACTION',
            speechMessage: `${player.name} แตะเลือกช่องใดก็ได้บนกระดานเพื่อวาร์ป (฿1,000)`,
            pendingAction: {
              type: 'warp',
              tileId: tile.id,
              amount: WARP_COST,
            },
          };
        }
        logs = prependLog(
          logs,
          makeLog(state.currentRound, `${player.name} เงินไม่พอสำหรับวาร์ป (฿1,000)`, 'info')
        );
        return advanceTurnAndCheckEnd({ ...state, players, properties, logs });
      }

      if (tile.type === 'quiz_basic' || tile.type === 'quiz_visual') {
        const { question, nextUsedQuestionIds } = pickQuizQuestionWithHistory(
          state.curriculumMode,
          tile.type,
          state.usedQuestionIds ?? []
        );
        return {
          ...state,
          players,
          properties,
          logs,
          usedQuestionIds: nextUsedQuestionIds,
          phase: 'QUIZ',
          speechMessage: player.isBot
            ? `${player.name} กำลังตอบการ์ดคำถามสถิติ...`
            : `${player.name} เปิดการ์ดคำถามสถิติ!`,
          activeQuiz: {
            question,
            playerId: player.id,
            selectedIndex: null,
            isResolved: false,
          },
        };
      }

      if (tile.type === 'property' || tile.type === 'utility') {
        const propState = properties[tile.id] ?? { ownerId: null, level: 0 };

        if (!propState.ownerId) {
          const price = tile.price ?? 0;
          if (player.isBot) {
            let botBuyMsg = `${player.name} เลือกไม่ซื้อ ${tile.shortName}`;
            if (shouldBotBuyProperty(player, price)) {
              player.cash -= price;
              properties[tile.id] = { ownerId: player.id, level: 0 };
              players[playerIndex] = player;
              soundFx.playGain();
              botBuyMsg = `${player.name} ซื้อ ${tile.shortName} ราคา ฿${price.toLocaleString()}`;
              logs = prependLog(logs, makeLog(state.currentRound, botBuyMsg, 'gain'));
            } else {
              logs = prependLog(logs, makeLog(state.currentRound, botBuyMsg, 'info'));
            }
            return advanceTurnAndCheckEnd({ ...state, players, properties, logs }, botBuyMsg);
          }

          return {
            ...state,
            players,
            properties,
            logs,
            phase: 'ACTION',
            speechMessage: `${player.name} ตกช่อง ${tile.shortName} (แก้โจทย์ไวลดได้ 20%!)`,
            pendingAction: {
              type: 'buy',
              tileId: tile.id,
              amount: price,
            },
          };
        }

        if (propState.ownerId === player.id) {
          if (tile.type === 'property' && propState.level < 2) {
            const upgradeCost = tile.price ?? 0;
            if (player.isBot) {
              let botUpgMsg: string | undefined;
              if (shouldBotUpgradeProperty(player, upgradeCost)) {
                player.cash -= upgradeCost;
                const nextLevel = (propState.level + 1) as 1 | 2;
                properties[tile.id] = { ownerId: player.id, level: nextLevel };
                players[playerIndex] = player;
                soundFx.playGain();
                botUpgMsg = `${player.name} อัปเกรด ${tile.shortName} เป็น Level ${nextLevel}!`;
                logs = prependLog(logs, makeLog(state.currentRound, botUpgMsg, 'bonus'));
              }
              return advanceTurnAndCheckEnd({ ...state, players, properties, logs }, botUpgMsg);
            }

            return {
              ...state,
              players,
              properties,
              logs,
              phase: 'ACTION',
              speechMessage: `${player.name} สามารถอัปเกรด ${tile.shortName} ได้!`,
              pendingAction: {
                type: 'upgrade_prompt',
                tileId: tile.id,
                amount: upgradeCost,
              },
            };
          }
          return advanceTurnAndCheckEnd({ ...state, players, properties, logs });
        }

        const ownerIdx = players.findIndex((p) => p.id === propState.ownerId);
        const owner = players[ownerIdx];
        const rent = calculateRent(tile, propState, diceRoll, stateTiles, properties);

        player.cash -= rent;
        players[playerIndex] = player;

        if (owner && !owner.bankrupt) {
          players[ownerIdx] = { ...owner, cash: owner.cash + rent };
        }
        soundFx.playPay();
        const rentMsg = `${player.name} จ่ายค่าเช่า ฿${rent.toLocaleString()} ให้ ${owner?.name ?? 'เจ้าของ'}`;
        logs = prependLog(
          logs,
          makeLog(state.currentRound, `${rentMsg} ที่ ${tile.shortName}`, 'loss')
        );

        if (player.cash < 0) {
          return checkDebtOrAdvance({ ...state, players, properties, logs }, playerIndex, rentMsg);
        }

        if (propState.level < 2) {
          const takeoverCost = getTakeoverCost(tile, propState);
          if (player.isBot) {
            let botSummary = rentMsg;
            if (shouldBotTakeover(player, takeoverCost)) {
              player.cash -= takeoverCost;
              if (owner && !owner.bankrupt) {
                players[ownerIdx] = {
                  ...players[ownerIdx],
                  cash: players[ownerIdx].cash + takeoverCost,
                };
              }
              properties[tile.id] = { ownerId: player.id, level: propState.level };
              players[playerIndex] = player;
              soundFx.playBonus();
              botSummary = `${player.name} เทคโอเวอร์ ${tile.shortName} ราคา ฿${takeoverCost.toLocaleString()}!`;
              logs = prependLog(logs, makeLog(state.currentRound, botSummary, 'bonus'));
            }
            return advanceTurnAndCheckEnd({ ...state, players, properties, logs }, botSummary);
          }

          if (player.cash >= takeoverCost) {
            return {
              ...state,
              players,
              properties,
              logs,
              phase: 'ACTION',
              speechMessage: `${player.name} จ่ายค่าเช่าแล้ว สามารถเทคโอเวอร์ ${tile.shortName} ได้`,
              pendingAction: {
                type: 'takeover',
                tileId: tile.id,
                amount: takeoverCost,
                targetOwnerId: propState.ownerId,
              },
            };
          }
        }

        return advanceTurnAndCheckEnd({ ...state, players, properties, logs }, rentMsg);
      }

      return advanceTurnAndCheckEnd({ ...state, players, properties, logs });
    },
    [advanceTurnAndCheckEnd, checkDebtOrAdvance]
  );

  // ==================== DICE ROLL & STEP-BY-STEP MOVEMENT ====================
  const executeRollDice = useCallback(
    (baseState: GameState) => {
      const idx = baseState.turnIndex;
      const rollingPlayer = baseState.players[idx];
      if (!rollingPlayer || rollingPlayer.bankrupt || baseState.phase !== 'IDLE') return;

      clearTurnTimers();
      isSteppingRef.current = true;
      soundFx.playRoll();
      const roll = Math.floor(Math.random() * 6) + 1;

      const preRollStats = computeDiceStats(baseState.diceCounts, baseState.currentRound);
      const earnedModeBonus =
        preRollStats.modeActive && preRollStats.modeFaces.includes(roll);

      const nextDiceCounts = {
        ...baseState.diceCounts,
        [roll]: (baseState.diceCounts[roll] ?? 0) + 1,
      };

      const rollingState: GameState = {
        ...baseState,
        phase: 'ROLLING',
        lastDice: roll,
        diceCounts: nextDiceCounts,
        totalRolls: baseState.totalRolls + 1,
        speechMessage: `${rollingPlayer.name} กำลังทอยลูกเต๋า...`,
      };
      commitState(rollingState);

      const rollDelay = getScaledDelay(
        rollingPlayer.isBot ? BOT_DELAYS.ROLL_MS : 1250,
        gameSpeedRef.current
      );
      const stepDelay = getScaledDelay(BOT_DELAYS.STEP_MS, gameSpeedRef.current);
      const landPause = getScaledDelay(
        rollingPlayer.isBot ? BOT_DELAYS.LAND_PAUSE_MS : 750,
        gameSpeedRef.current
      );

      scheduleTurnTimer(() => {
        const latest = stateRef.current;
        if (!latest || latest.status !== 'playing') {
          isSteppingRef.current = false;
          return;
        }

        const players = [...latest.players];
        const p = { ...players[idx] };
        let logs = [...latest.logs];

        logs = prependLog(
          logs,
          makeLog(latest.currentRound, `${p.name} ทอยได้แต้ม ${roll}`, 'info')
        );

        let speech = `${p.name} ทอยได้แต้ม ${roll}!`;

        if (earnedModeBonus) {
          p.cash += MODE_BONUS_AMOUNT;
          p.modeBonusesEarned += 1;
          soundFx.playBonus();
          speech = `โบนัสฐานนิยม! ${p.name} ทอยได้ ${roll} รับ +฿${MODE_BONUS_AMOUNT.toLocaleString()}`;
          logs = prependLog(
            logs,
            makeLog(
              latest.currentRound,
              `โบนัสฐานนิยม! ${p.name} ทอยได้แต้ม ${roll} ตรงกับฐานนิยม รับ +฿${MODE_BONUS_AMOUNT.toLocaleString()}`,
              'bonus'
            )
          );
        }

        if (p.inLab) {
          if (roll % 2 === 0) {
            p.inLab = false;
            p.labTurns = 0;
            speech = `${p.name} ทอยได้เลขคู่ (${roll}) ออกจากห้องแล็บแล้ว!`;
            logs = prependLog(
              logs,
              makeLog(
                latest.currentRound,
                `${p.name} ทอยได้เลขคู่ (${roll}) ออกจากห้องแล็บวิจัยสำเร็จ!`,
                'gain'
              )
            );
          } else {
            p.labTurns += 1;
            const labSummary = `${p.name} ทอยได้ ${roll} (เลขคี่) ยังอยู่ในห้องแล็บ (${p.labTurns}/2)`;
            if (p.labTurns >= 2) {
              p.inLab = false;
              p.labTurns = 0;
              logs = prependLog(
                logs,
                makeLog(
                  latest.currentRound,
                  `${p.name} ทอยได้ ${roll} (ครบ 2 รอบในห้องแล็บ) รอบหน้าเดินทางต่อได้`,
                  'alert'
                )
              );
            } else {
              logs = prependLog(logs, makeLog(latest.currentRound, labSummary, 'alert'));
            }
            players[idx] = p;
            isSteppingRef.current = false;
            commitState(advanceTurnAndCheckEnd({ ...latest, players, logs }, labSummary));
            return;
          }
        }

        players[idx] = p;
        const startMovingState: GameState = {
          ...latest,
          players,
          logs,
          speechMessage: speech,
          phase: 'MOVING',
        };
        setGameState(startMovingState);

        const stepPath = getStepPath(p.position, roll);
        const stateTiles = getBoardTiles(latest.curriculumMode);

        stepPath.forEach((step, stepIdx) => {
          scheduleTurnTimer(() => {
            const cur = stateRef.current;
            if (!cur || cur.status !== 'playing') {
              isSteppingRef.current = false;
              return;
            }
            const curPlayers = [...cur.players];
            const mover = { ...curPlayers[idx] };
            let curLogs = [...cur.logs];
            let curSpeech = cur.speechMessage;

            mover.position = step.pos;
            soundFx.playStep(stepIdx);

            if (step.passedStart) {
              mover.cash += START_PASS_BONUS;
              soundFx.playGain();
              curLogs = prependLog(
                curLogs,
                makeLog(
                  cur.currentRound,
                  `${mover.name} ผ่านจุดเริ่มต้น รับทุนวิจัย +฿${START_PASS_BONUS.toLocaleString()}`,
                  'gain'
                )
              );
            }

            const isFinalStep = stepIdx === stepPath.length - 1;
            if (isFinalStep) {
              const destTile = stateTiles.find((t) => t.id === step.pos);
              if (destTile) {
                curSpeech = `${mover.name} เดินถึงช่อง ${destTile.shortName}`;
              }
            }

            curPlayers[idx] = mover;
            setGameState({
              ...cur,
              players: curPlayers,
              logs: curLogs,
              speechMessage: curSpeech,
              phase: 'MOVING',
            });

            if (isFinalStep) {
              scheduleTurnTimer(() => {
                const postMove = stateRef.current;
                isSteppingRef.current = false;
                if (!postMove || postMove.status !== 'playing') return;
                const resolved = resolveLandingTile(postMove, idx, roll);
                commitState(resolved);
              }, landPause);
            }
          }, stepIdx * stepDelay);
        });
      }, rollDelay);
    },
    [advanceTurnAndCheckEnd, clearTurnTimers, commitState, resolveLandingTile, scheduleTurnTimer]
  );

  // ==================== HUMAN INTERACTION HANDLERS ====================
  const currentPlayer = gameState?.players[gameState.turnIndex];
  const isMyTurn = Boolean(
    gameState &&
      gameState.status === 'playing' &&
      currentPlayer &&
      (!gameState.isOnline || currentPlayer.id === localPlayerId)
  );

  const handlePayLabBail = () => {
    if (!gameState || !currentPlayer || currentPlayer.cash < LAB_BAIL_COST) return;
    const players = [...gameState.players];
    players[gameState.turnIndex] = {
      ...currentPlayer,
      cash: currentPlayer.cash - LAB_BAIL_COST,
      inLab: false,
      labTurns: 0,
    };
    soundFx.playPay();
    commitState({
      ...gameState,
      players,
      speechMessage: `${currentPlayer.name} จ่ายค่าออกจากห้องแล็บแล้ว กดทอยลูกเต๋าได้เลย!`,
      logs: prependLog(
        gameState.logs,
        makeLog(
          gameState.currentRound,
          `${currentPlayer.name} จ่าย ฿${LAB_BAIL_COST.toLocaleString()} ออกจากห้องแล็บวิจัย`,
          'info'
        )
      ),
    });
  };

  const handleBuyProperty = (paidPrice: number, usedDiscount: boolean) => {
    if (!gameState || !gameState.pendingAction || !currentPlayer) return;
    const tileId = gameState.pendingAction.tileId;
    const tile = tiles.find((t) => t.id === tileId);
    if (!tile || currentPlayer.cash < paidPrice) return;

    const players = [...gameState.players];
    players[gameState.turnIndex] = {
      ...currentPlayer,
      cash: currentPlayer.cash - paidPrice,
    };
    const properties = {
      ...gameState.properties,
      [tileId]: { ownerId: currentPlayer.id, level: 0 as const },
    };
    soundFx.playGain();
    const next = advanceTurnAndCheckEnd({
      ...gameState,
      players,
      properties,
      logs: prependLog(
        gameState.logs,
        makeLog(
          gameState.currentRound,
          usedDiscount
            ? `${currentPlayer.name} แก้โจทย์ไวสำเร็จ! ซื้อ ${tile.shortName} ลด 20% เหลือ ฿${paidPrice.toLocaleString()}`
            : `${currentPlayer.name} ซื้อ ${tile.shortName} ราคา ฿${paidPrice.toLocaleString()}`,
          usedDiscount ? 'bonus' : 'gain'
        )
      ),
    });
    commitState(next);
  };

  const handleStartUpgradeChallenge = () => {
    if (!gameState || !gameState.pendingAction) return;
    const challenge = pickUpgradeChallenge();
    commitState({
      ...gameState,
      phase: 'UPGRADE_TASK',
      activeUpgradeChallenge: challenge,
    });
  };

  const handleCompleteUpgradeChallenge = (success: boolean) => {
    if (!gameState || !gameState.pendingAction || !currentPlayer) return;
    const tileId = gameState.pendingAction.tileId;
    const tile = tiles.find((t) => t.id === tileId);
    const prop = gameState.properties[tileId];
    if (!tile || !prop) return;

    if (!success) {
      soundFx.playAlert();
      const next = advanceTurnAndCheckEnd({
        ...gameState,
        logs: prependLog(
          gameState.logs,
          makeLog(
            gameState.currentRound,
            `${currentPlayer.name} ตอบภารกิจอัปเกรดผิด ยกเลิกการอัปเกรด ${tile.shortName}`,
            'loss'
          )
        ),
      });
      commitState(next);
      return;
    }

    const cost = tile.price ?? 0;
    const nextLevel = Math.min(2, prop.level + 1) as 1 | 2;
    const players = [...gameState.players];
    players[gameState.turnIndex] = {
      ...currentPlayer,
      cash: currentPlayer.cash - cost,
    };
    const properties = {
      ...gameState.properties,
      [tileId]: { ownerId: currentPlayer.id, level: nextLevel },
    };
    soundFx.playBonus();
    const next = advanceTurnAndCheckEnd({
      ...gameState,
      players,
      properties,
      logs: prependLog(
        gameState.logs,
        makeLog(
          gameState.currentRound,
          `${currentPlayer.name} ผ่านภารกิจ! อัปเกรด ${tile.shortName} เป็น Level ${nextLevel}`,
          'bonus'
        )
      ),
    });
    commitState(next);
  };

  const handleTakeoverProperty = () => {
    if (!gameState || !gameState.pendingAction || !currentPlayer) return;
    const { tileId, amount, targetOwnerId } = gameState.pendingAction;
    const tile = tiles.find((t) => t.id === tileId);
    const prop = gameState.properties[tileId];
    if (!tile || !prop || currentPlayer.cash < amount) return;

    const players = [...gameState.players];
    players[gameState.turnIndex] = {
      ...currentPlayer,
      cash: currentPlayer.cash - amount,
    };
    const ownerIdx = players.findIndex((p) => p.id === targetOwnerId);
    if (ownerIdx >= 0 && !players[ownerIdx].bankrupt) {
      players[ownerIdx] = {
        ...players[ownerIdx],
        cash: players[ownerIdx].cash + amount,
      };
    }

    const properties = {
      ...gameState.properties,
      [tileId]: { ownerId: currentPlayer.id, level: prop.level },
    };
    soundFx.playBonus();
    const next = advanceTurnAndCheckEnd({
      ...gameState,
      players,
      properties,
      logs: prependLog(
        gameState.logs,
        makeLog(
          gameState.currentRound,
          `${currentPlayer.name} เทคโอเวอร์ ${tile.shortName} ราคา ฿${amount.toLocaleString()}!`,
          'bonus'
        )
      ),
    });
    commitState(next);
  };

  const handleSelectWarp = (destTileId: number) => {
    if (!gameState || !currentPlayer || currentPlayer.cash < WARP_COST) return;
    const players = [...gameState.players];
    const destTile = tiles.find((t) => t.id === destTileId)!;
    const passedStart = destTileId === 1;
    players[gameState.turnIndex] = {
      ...currentPlayer,
      cash: currentPlayer.cash - WARP_COST + (passedStart ? START_PASS_BONUS : 0),
      position: destTileId,
    };
    soundFx.playStep();
    const warped: GameState = {
      ...gameState,
      players,
      pendingAction: null,
      logs: prependLog(
        gameState.logs,
        makeLog(
          gameState.currentRound,
          `${currentPlayer.name} จ่าย ฿${WARP_COST.toLocaleString()} วาร์ปไปที่ ${destTile.shortName}`,
          'info'
        )
      ),
    };
    const resolved = resolveLandingTile(warped, gameState.turnIndex, gameState.lastDice ?? 1);
    commitState(resolved);
  };

  const handleDeclineAction = () => {
    if (!gameState) return;
    commitState(advanceTurnAndCheckEnd(gameState));
  };

  const handleSellPropertyForDebt = (tileId: number) => {
    if (!gameState || !currentPlayer) return;
    const tile = tiles.find((t) => t.id === tileId);
    const prop = gameState.properties[tileId];
    if (!tile || !prop) return;

    const sellVal = getSellToBankValue(tile, prop);
    const players = [...gameState.players];
    const updatedPlayer = {
      ...currentPlayer,
      cash: currentPlayer.cash + sellVal,
    };
    players[gameState.turnIndex] = updatedPlayer;
    const properties = {
      ...gameState.properties,
      [tileId]: { ownerId: null, level: 0 as const },
    };
    soundFx.playGain();
    const updatedState: GameState = {
      ...gameState,
      players,
      properties,
      logs: prependLog(
        gameState.logs,
        makeLog(
          gameState.currentRound,
          `${currentPlayer.name} ขาย ${tile.shortName} คืนธนาคารได้ +฿${sellVal.toLocaleString()}`,
          'alert'
        )
      ),
    };

    if (updatedPlayer.cash >= 0) {
      commitState(advanceTurnAndCheckEnd(updatedState));
    } else {
      commitState({
        ...updatedState,
        pendingAction: {
          type: 'sell_for_debt',
          tileId: updatedPlayer.position,
          amount: Math.abs(updatedPlayer.cash),
        },
      });
    }
  };

  const handleDeclareBankruptcy = () => {
    if (!gameState || !currentPlayer) return;
    const players = [...gameState.players];
    players[gameState.turnIndex] = { ...currentPlayer, bankrupt: true };
    soundFx.playAlert();
    const next = advanceTurnAndCheckEnd({
      ...gameState,
      players,
      logs: prependLog(
        gameState.logs,
        makeLog(
          gameState.currentRound,
          `${currentPlayer.name} ล้มละลายและออกจากการแข่งขัน!`,
          'loss'
        )
      ),
    });
    commitState(next);
  };

  const handleQuizSelectAnswer = useCallback(
    (choiceIdx: number) => {
      const current = stateRef.current;
      if (!current || !current.activeQuiz || current.activeQuiz.isResolved) return;
      const quiz = current.activeQuiz;
      const isCorrect = choiceIdx === quiz.question.correctIndex;
      const players = [...current.players];
      const pIdx = players.findIndex((p) => p.id === quiz.playerId);
      if (pIdx < 0) return;

      const p = { ...players[pIdx] };
      p.quizTotal += 1;
      if (isCorrect) {
        p.cash += QUIZ_REWARD;
        p.quizCorrect += 1;
        soundFx.playGain();
      } else {
        p.cash -= QUIZ_PENALTY;
        soundFx.playPay();
      }
      players[pIdx] = p;

      const resultText = isCorrect
        ? `${p.name} ตอบคำถามสถิติถูกต้อง! รับ +฿${QUIZ_REWARD.toLocaleString()}`
        : `${p.name} ตอบคำถามผิด เสีย -฿${QUIZ_PENALTY.toLocaleString()}`;

      const speechText = p.isBot
        ? isCorrect
          ? `✅ ${p.name} ตอบคำถามถูก! รับ +฿${QUIZ_REWARD.toLocaleString()}`
          : `❌ ${p.name} ตอบคำถามผิด! เสีย -฿${QUIZ_PENALTY.toLocaleString()}`
        : current.speechMessage;

      const logs = prependLog(
        current.logs,
        makeLog(current.currentRound, resultText, isCorrect ? 'gain' : 'loss')
      );

      commitState({
        ...current,
        players,
        logs,
        speechMessage: speechText,
        activeQuiz: {
          ...quiz,
          selectedIndex: choiceIdx,
          isResolved: true,
        },
      });
    },
    [commitState]
  );

  const handleQuizContinue = useCallback(
    (preserveSpeech = false) => {
      const current = stateRef.current;
      if (!current || !current.activeQuiz) return;
      const pIdx = current.players.findIndex((p) => p.id === current.activeQuiz?.playerId);
      const resolved = checkDebtOrAdvance(
        { ...current, activeQuiz: null },
        pIdx >= 0 ? pIdx : current.turnIndex,
        preserveSpeech ? current.speechMessage : undefined
      );
      commitState(resolved);
    },
    [checkDebtOrAdvance, commitState]
  );

  // ==================== AI BOT ORCHESTRATION ====================
  useEffect(() => {
    if (botTimerRef.current) {
      window.clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }

    if (!gameState || gameState.status !== 'playing') return;
    if (gameState.isOnline && gameState.hostId !== localPlayerId) return;

    const activePlayer = gameState.players[gameState.turnIndex];
    if (!activePlayer || !activePlayer.isBot || activePlayer.bankrupt) return;

    if (gameState.phase === 'IDLE') {
      botTimerRef.current = window.setTimeout(() => {
        const latest = stateRef.current;
        if (!latest || latest.phase !== 'IDLE') return;
        const bot = latest.players[latest.turnIndex];
        if (!bot || !bot.isBot) return;

        if (bot.inLab && shouldBotPayLabBail(bot)) {
          const players = [...latest.players];
          players[latest.turnIndex] = {
            ...bot,
            cash: bot.cash - LAB_BAIL_COST,
            inLab: false,
            labTurns: 0,
          };
          const bailedState: GameState = {
            ...latest,
            players,
            logs: prependLog(
              latest.logs,
              makeLog(
                latest.currentRound,
                `${bot.name} จ่าย ฿${LAB_BAIL_COST.toLocaleString()} ออกจากห้องแล็บ`,
                'info'
              )
            ),
          };
          executeRollDice(bailedState);
        } else {
          executeRollDice(latest);
        }
      }, getScaledDelay(BOT_DELAYS.IDLE_MS, gameSpeed));
    } else if (gameState.phase === 'QUIZ' && gameState.activeQuiz) {
      if (!gameState.activeQuiz.isResolved) {
        botTimerRef.current = window.setTimeout(() => {
          const latest = stateRef.current;
          if (!latest || latest.phase !== 'QUIZ' || !latest.activeQuiz) return;
          const bot = latest.players[latest.turnIndex];
          const pick = pickBotQuizAnswer(
            latest.activeQuiz.question.correctIndex,
            bot?.botDifficulty
          );
          handleQuizSelectAnswer(pick);
        }, getScaledDelay(BOT_DELAYS.QUIZ_ANSWER_MS, gameSpeed));
      } else {
        botTimerRef.current = window.setTimeout(() => {
          handleQuizContinue(true);
        }, getScaledDelay(BOT_DELAYS.QUIZ_RESULT_MS, gameSpeed));
      }
    }

    return () => {
      if (botTimerRef.current) {
        window.clearTimeout(botTimerRef.current);
        botTimerRef.current = null;
      }
    };
  }, [
    gameState?.status,
    gameState?.phase,
    gameState?.turnIndex,
    gameState?.totalRolls,
    gameState?.activeQuiz?.isResolved,
    gameState?.isOnline,
    gameState?.hostId,
    localPlayerId,
    gameSpeed,
    executeRollDice,
    handleQuizSelectAnswer,
    handleQuizContinue,
  ]);

  // ==================== 45-SECOND ONLINE SKIP TURN ====================
  const elapsedSeconds = gameState
    ? Math.max(0, Math.floor((nowTick - gameState.turnStartedAt) / 1000))
    : 0;
  const canSkipOnlineTurn = Boolean(gameState?.isOnline && elapsedSeconds >= 45);
  const secondsLeftToSkip = Math.max(0, 45 - elapsedSeconds);

  const handleSkipOnlineTurn = () => {
    if (!gameState || !canSkipOnlineTurn || !currentPlayer) return;
    const next = advanceTurnAndCheckEnd({
      ...gameState,
      logs: prependLog(
        gameState.logs,
        makeLog(
          gameState.currentRound,
          `ข้ามตาของ ${currentPlayer.name} เนื่องจากไม่มีการเคลื่อนไหวเกิน 45 วินาที`,
          'alert'
        )
      ),
    });
    commitState(next);
  };

  const toggleMute = () => {
    const next = !muted;
    soundFx.muted = next;
    setMuted(next);
  };

  if (!gameState || gameState.status === 'waiting') {
    return (
      <>
        <Lobby
          playerName={playerName}
          setPlayerName={setPlayerName}
          playerColor={playerColor}
          setPlayerColor={setPlayerColor}
          curriculumMode={curriculumMode}
          setCurriculumMode={setCurriculumMode}
          maxRounds={maxRounds}
          setMaxRounds={setMaxRounds}
          onlineRoom={gameState}
          localPlayerId={localPlayerId}
          onlineError={onlineError}
          onStartSolo={handleStartSolo}
          onCreateOnlineRoom={handleCreateOnlineRoom}
          onJoinOnlineRoom={handleJoinOnlineRoom}
          onAddOnlineBot={handleAddOnlineBot}
          onStartOnlineGame={handleStartOnlineGame}
          onLeaveOnlineRoom={handleLeaveOnlineRoom}
          onOpenRules={() => setRulesOpen(true)}
          takenColorsInJoinRoom={takenColorsInJoinRoom}
          onCheckJoinRoomColors={handleCheckJoinRoomColors}
        />
        <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      </>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#A8E6CF] via-[#8AD979] to-[#7BC043] text-slate-800 flex flex-col justify-between overflow-x-hidden">
      {/* Monopoly GO! Top Bar: Cream-white pill with Avatar, Banknote Cash, Rivals, and Speed/Mute/Exit */}
      <TopMonopolyBar
        gameState={gameState}
        tiles={tiles}
        localPlayerId={localPlayerId}
        gameSpeed={gameSpeed}
        muted={muted}
        elapsedSeconds={elapsedSeconds}
        moneyPopups={moneyPopups}
        onToggleSpeed={() => setGameSpeed((s) => (s === 1 ? 2 : 1))}
        onToggleMute={toggleMute}
        onExitGame={() => {
          clearTurnTimers();
          setFrequencyModalOpen(false);
          setPlayerStatsModalOpen(false);
          setLogDrawerOpen(false);
          setGameState(null);
        }}
      />

      {/* Main Playfield: Centered Cream & Meadow Square Board */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-1.5 min-[380px]:px-2.5 sm:px-6 pt-1.5 pb-4 sm:py-3 flex flex-col items-center justify-center">
        <Board
          gameState={gameState}
          tiles={tiles}
          isMyTurn={isMyTurn}
          gameSpeed={gameSpeed}
          moneyPopups={moneyPopups}
          canSkipOnlineTurn={canSkipOnlineTurn}
          secondsLeftToSkip={secondsLeftToSkip}
          onRollDice={() => executeRollDice(gameState)}
          onPayLabBail={handlePayLabBail}
          onSelectWarp={handleSelectWarp}
          onSkipWarp={handleDeclineAction}
          onSkipOnlineTurn={handleSkipOnlineTurn}
          onOpenFrequencyModal={() => setFrequencyModalOpen(true)}
        />
      </main>

      {/* Bottom Cream & Gold Menu Bar + Protruding Red-Orange Diamond GO Roll Button */}
      <BottomMonopolyDock
        gameState={gameState}
        isMyTurn={isMyTurn}
        onRollDice={() => executeRollDice(gameState)}
        onOpenRules={() => setRulesOpen(true)}
        onOpenLogs={() => setLogDrawerOpen((v) => !v)}
        onOpenFrequency={() => setFrequencyModalOpen(true)}
        onOpenPlayerStats={() => setPlayerStatsModalOpen(true)}
      />

      {/* Collapsible Bright Cream Live Action Log Drawer */}
      {logDrawerOpen && (
        <div
          className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#FAF6EE] border-l-4 border-[#F5C542] shadow-2xl flex flex-col text-slate-800"
          role="dialog"
          aria-modal="true"
          aria-label="บันทึกเหตุการณ์สด"
        >
          <div className="flex items-center justify-between border-b-2 border-[#E6D7B9] px-4 py-3.5 bg-[#FFFDF7]">
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-sky-600" />
              <h2 className="text-sm font-extrabold text-slate-900">บันทึกเหตุการณ์สด</h2>
            </div>
            <button
              type="button"
              onClick={() => setLogDrawerOpen(false)}
              aria-label="ปิดบันทึกเหตุการณ์"
              className="rounded-xl p-1.5 bg-[#FAF6EE] border border-[#E6D7B9] text-slate-600 hover:bg-amber-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 text-xs">
            {gameState.logs.map((entry) => {
              const toneClass =
                entry.tone === 'gain'
                  ? 'text-emerald-700 font-bold'
                  : entry.tone === 'loss'
                    ? 'text-rose-600 font-bold'
                    : entry.tone === 'bonus'
                      ? 'text-amber-700 font-extrabold'
                      : entry.tone === 'alert'
                        ? 'text-indigo-700 font-bold'
                        : 'text-slate-700 font-medium';
              return (
                <div
                  key={entry.id}
                  className="rounded-2xl bg-[#FFFDF7] border-2 border-[#E6D7B9] px-3 py-2 leading-relaxed"
                >
                  <span className="font-mono-num font-bold text-slate-400 mr-1.5">
                    [R{entry.round}]
                  </span>
                  <span className={toneClass}>{entry.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Frequency Tracker Modal & Player Stats Modal */}
      <FrequencyModal
        open={frequencyModalOpen}
        gameState={gameState}
        onClose={() => setFrequencyModalOpen(false)}
      />
      <PlayerStatsModal
        open={playerStatsModalOpen}
        gameState={gameState}
        tiles={tiles}
        onClose={() => setPlayerStatsModalOpen(false)}
      />

      {/* Interactive Modals (QuizModal only shown for human players; bots resolve silently in Speech Bubble) */}
      {(() => {
        if (gameState.phase !== 'QUIZ' || !gameState.activeQuiz) return null;
        const quizPlayer =
          gameState.players.find((p) => p.id === gameState.activeQuiz?.playerId) ??
          currentPlayer;
        if (!quizPlayer || quizPlayer.isBot) return null;
        return (
          <QuizModal
            quizState={gameState.activeQuiz}
            player={quizPlayer}
            canInteract={isMyTurn}
            onSelectAnswer={handleQuizSelectAnswer}
            onContinue={() => handleQuizContinue(false)}
          />
        );
      })()}

      {gameState.phase === 'UPGRADE_TASK' &&
        gameState.pendingAction &&
        gameState.activeUpgradeChallenge &&
        isMyTurn && (
          <UpgradeModal
            tile={tiles.find((t) => t.id === gameState.pendingAction!.tileId)!}
            propState={gameState.properties[gameState.pendingAction.tileId]}
            challenge={gameState.activeUpgradeChallenge}
            onComplete={handleCompleteUpgradeChallenge}
            onCancel={handleDeclineAction}
          />
        )}

      {gameState.phase === 'ACTION' &&
        gameState.pendingAction &&
        gameState.pendingAction.type !== 'warp' &&
        currentPlayer &&
        !currentPlayer.isBot &&
        isMyTurn && (
          <ActionModal
            pendingAction={gameState.pendingAction}
            player={currentPlayer}
            tiles={tiles}
            gameState={gameState}
            onBuyProperty={handleBuyProperty}
            onStartUpgradeChallenge={handleStartUpgradeChallenge}
            onTakeoverProperty={handleTakeoverProperty}
            onSellPropertyForDebt={handleSellPropertyForDebt}
            onDeclareBankruptcy={handleDeclareBankruptcy}
            onDeclineAction={handleDeclineAction}
          />
        )}

      {(gameState.status === 'finished' || gameState.phase === 'GAME_OVER') && (
        <SummaryModal
          gameState={gameState}
          tiles={tiles}
          onPlayAgain={() => {
            if (gameState.isOnline) {
              setGameState(null);
            } else {
              handleStartSolo(
                lastSoloConfig.botCount,
                lastSoloConfig.difficulty,
                lastSoloConfig.rounds
              );
            }
          }}
          onBackToLobby={() => setGameState(null)}
        />
      )}

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
