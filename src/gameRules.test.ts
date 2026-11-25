import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceBoardPosition,
  calculateNetWorth,
  calculateRent,
  changePlayerColorInRoom,
  computeDiceStats,
  createEmptyDiceCounts,
  evaluateGameEnd,
  findNextTurn,
  generateRoomCode,
  getBoardTileCoordinates,
  getDiscountedPrice,
  getSellToBankValue,
  getStepPath,
  getTakeoverCost,
  GROUP_MONOPOLY_BONUS,
  hasGroupMonopoly,
  pickAvailableTokenColor,
  pickRandomAvailableColor,
  pickRandomPlayerName,
  RANDOM_PLAYER_NAMES,
  stepVisualPosition,
} from './gameRules';
import type { GameState, Player, PropertyState, TileConfig } from './types';

const sampleTiles: TileConfig[] = [
  { id: 1, name: 'จุดเริ่มต้น', shortName: 'เริ่มต้น', type: 'start', description: '' },
  {
    id: 2,
    name: 'สำมะโนประชากร',
    shortName: 'สำมะโน',
    type: 'property',
    group: 'green',
    price: 2000,
    baseRent: 500,
    description: '',
  },
  {
    id: 4,
    name: 'แบบสอบถามตลาด',
    shortName: 'แบบสอบถาม',
    type: 'property',
    group: 'green',
    price: 2500,
    baseRent: 700,
    description: '',
  },
  {
    id: 7,
    name: 'ศูนย์ข้อมูลสถิติแห่งชาติ',
    shortName: 'ศูนย์ข้อมูลฯ',
    type: 'utility',
    group: 'utility',
    price: 3500,
    description: '',
  },
];

test('generateRoomCode excludes ambiguous chars O, 0, I, 1 and has length 6', () => {
  for (let i = 0; i < 50; i++) {
    const code = generateRoomCode();
    assert.equal(code.length, 6);
    assert.equal(/[O0I1]/.test(code), false);
  }
});

test('computeDiceStats calculates relative frequencies and activates Mode from Round 3', () => {
  const counts = { 1: 1, 2: 4, 3: 2, 4: 1, 5: 2, 6: 0 };
  const round2 = computeDiceStats(counts, 2);
  assert.equal(round2.totalRolls, 10);
  assert.equal(round2.modeActive, false);
  assert.equal(round2.rows[1].isMode, false);
  assert.equal(round2.rows[1].relativePercent, 40);

  const round3 = computeDiceStats(counts, 3);
  assert.equal(round3.modeActive, true);
  assert.deepEqual(round3.modeFaces, [2]);
  assert.equal(round3.rows[1].isMode, true);
  assert.equal(round3.rows[0].isMode, false);
});

test('calculateRent applies group monopoly bonus and upgrade level multipliers', () => {
  const props: Record<number, PropertyState> = {
    2: { ownerId: 'p1', level: 0 },
    4: { ownerId: 'p2', level: 0 },
    7: { ownerId: 'p1', level: 0 },
  };

  assert.equal(hasGroupMonopoly('p1', 'green', sampleTiles, props), false);
  assert.equal(calculateRent(sampleTiles[1], props[2], 4, sampleTiles, props), 500);

  // Give p1 both green tiles -> monopoly +500
  props[4] = { ownerId: 'p1', level: 1 };
  assert.equal(hasGroupMonopoly('p1', 'green', sampleTiles, props), true);
  assert.equal(
    calculateRent(sampleTiles[1], props[2], 4, sampleTiles, props),
    500 + GROUP_MONOPOLY_BONUS
  );
  // Tile 4 at level 1 -> 2x (700 + 500) = 2400
  assert.equal(
    calculateRent(sampleTiles[2], props[4], 4, sampleTiles, props),
    (700 + GROUP_MONOPOLY_BONUS) * 2
  );
  // Utility rent = dice * 200
  assert.equal(calculateRent(sampleTiles[3], props[7], 6, sampleTiles, props), 1200);
});

test('property takeover and liquidation math', () => {
  const tile = sampleTiles[1]; // price 2000
  assert.equal(getTakeoverCost(tile, { ownerId: 'p1', level: 0 }), 4000);
  assert.equal(getTakeoverCost(tile, { ownerId: 'p1', level: 1 }), 8000);
  assert.equal(getSellToBankValue(tile, { ownerId: 'p1', level: 1 }), 2000);
});

test('advanceBoardPosition wraps 16 tiles and detects passing Start', () => {
  assert.deepEqual(advanceBoardPosition(1, 5), { newPos: 6, passedStart: false });
  assert.deepEqual(advanceBoardPosition(14, 3), { newPos: 1, passedStart: true });
  assert.deepEqual(advanceBoardPosition(15, 4), { newPos: 3, passedStart: true });
});

test('findNextTurn skips bankrupt players and increments round on wrap', () => {
  const players: Player[] = [
    { id: 'p1', name: 'A', color: 'red', isBot: false, position: 1, cash: 5000, inLab: false, labTurns: 0, bankrupt: false, quizCorrect: 0, quizTotal: 0, modeBonusesEarned: 0 },
    { id: 'p2', name: 'B', color: 'blue', isBot: true, position: 1, cash: 0, inLab: false, labTurns: 0, bankrupt: true, quizCorrect: 0, quizTotal: 0, modeBonusesEarned: 0 },
    { id: 'p3', name: 'C', color: 'green', isBot: true, position: 1, cash: 6000, inLab: false, labTurns: 0, bankrupt: false, quizCorrect: 0, quizTotal: 0, modeBonusesEarned: 0 },
  ];

  assert.deepEqual(findNextTurn(players, 0, 1), { nextTurnIndex: 2, nextRound: 1 });
  assert.deepEqual(findNextTurn(players, 2, 1), { nextTurnIndex: 0, nextRound: 2 });
});

import {
  generateDynamicBuyDiscountPuzzle,
  generateDynamicUpgradeChallenge,
  getBoardTiles,
  pickQuizQuestionWithHistory,
  QUIZ_QUESTIONS,
} from './gameData';

test('evaluateGameEnd detects last standing and net worth victory after max rounds', () => {
  const players: Player[] = [
    { id: 'p1', name: 'A', color: 'red', isBot: false, position: 1, cash: 5000, inLab: false, labTurns: 0, bankrupt: false, quizCorrect: 0, quizTotal: 0, modeBonusesEarned: 0 },
    { id: 'p2', name: 'B', color: 'blue', isBot: true, position: 1, cash: 7000, inLab: false, labTurns: 0, bankrupt: false, quizCorrect: 0, quizTotal: 0, modeBonusesEarned: 0 },
  ];
  const props: Record<number, PropertyState> = {
    2: { ownerId: 'p1', level: 1 }, // total value = 2000 * 2 = 4000 -> p1 net worth = 9000
  };
  assert.equal(calculateNetWorth(players[0], sampleTiles, props), 9000);
  const endRes = evaluateGameEnd(
    { players, properties: props, currentRound: 11, maxRounds: 10 },
    sampleTiles
  );
  assert.equal(endRes.ended, true);
  assert.equal(endRes.winnerId, 'p1');
  assert.equal(endRes.reason, 'rounds_completed');
});

test('all 3 board modes have 16 tiles and 50+ valid quizzes (25 Mode 1 + 25 Mode 2)', () => {
  for (const mode of ['mode1', 'mode2', 'mode3'] as const) {
    const modeTiles = getBoardTiles(mode);
    assert.equal(modeTiles.length, 16);
    assert.deepEqual(
      modeTiles.map((t) => t.id),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    );
  }
  assert.equal(getDiscountedPrice(2000), 1600);
  assert.equal(getDiscountedPrice(4500), 3600);
  assert.ok(QUIZ_QUESTIONS.length >= 50);
  const mode1Qs = QUIZ_QUESTIONS.filter((q) => q.mode === 'mode1');
  const mode2Qs = QUIZ_QUESTIONS.filter((q) => q.mode === 'mode2');
  assert.ok(mode1Qs.length >= 25);
  assert.ok(mode2Qs.length >= 25);

  for (const q of QUIZ_QUESTIONS) {
    assert.equal(q.options.length, 4);
    assert.ok(q.correctIndex >= 0 && q.correctIndex <= 3);
    assert.ok(q.explanation.length > 5);
  }
});

test('no-repeat shuffle queue exhausts all 25 questions in a mode before repeating', () => {
  for (const mode of ['mode1', 'mode2'] as const) {
    const expectedCount = QUIZ_QUESTIONS.filter((q) => q.mode === mode).length;
    let used: string[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < expectedCount; i++) {
      const res = pickQuizQuestionWithHistory(mode, 'quiz_basic', used);
      assert.equal(seen.has(res.question.id), false, `Repeated ${res.question.id} at step ${i}`);
      seen.add(res.question.id);
      used = res.nextUsedQuestionIds;
    }
    assert.equal(seen.size, expectedCount);

    // Next draw resets only this pool and continues cleanly
    const wrapRes = pickQuizQuestionWithHistory(mode, 'quiz_basic', used);
    assert.equal(wrapRes.nextUsedQuestionIds.length, 1);
    assert.equal(wrapRes.nextUsedQuestionIds[0], wrapRes.question.id);
  }
});

test('dynamic buy-discount and upgrade generators produce valid fresh math puzzles', () => {
  const discPrompts = new Set<string>();
  for (let i = 0; i < 40; i++) {
    const p = generateDynamicBuyDiscountPuzzle();
    discPrompts.add(p.prompt);
    assert.equal(p.options.length, 4);
    assert.equal(new Set(p.options).size, 4);
    assert.ok(p.correctIndex >= 0 && p.correctIndex <= 3);
    assert.ok(p.explanation.length > 5);
  }
  assert.ok(discPrompts.size >= 10);

  const upgPrompts = new Set<string>();
  for (let i = 0; i < 40; i++) {
    const u = generateDynamicUpgradeChallenge();
    upgPrompts.add(u.prompt);
    assert.equal(u.options.length, 4);
    assert.equal(new Set(u.options).size, 4);
    assert.ok(u.correctIndex >= 0 && u.correctIndex <= 3);
    if (u.tableRows && u.totalFreq) {
      const sum = u.tableRows.reduce((acc, r) => acc + r.freq, 0);
      assert.equal(sum, u.totalFreq);
    }
    if (u.pieSlices) {
      const pctSum = u.pieSlices.reduce((acc, s) => acc + s.percent, 0);
      assert.equal(pctSum, 100);
    }
  }
  assert.ok(upgPrompts.size >= 10);
});

import { BOT_DELAYS, getScaledDelay } from './botLogic';

test('bot delays match relaxed pacing and 1x/2x scaling', () => {
  assert.equal(BOT_DELAYS.IDLE_MS, 1200);
  assert.equal(BOT_DELAYS.ROLL_MS, 900);
  assert.equal(BOT_DELAYS.ROLL_REVEAL_MS, 400);
  assert.equal(BOT_DELAYS.STEP_MS, 400);
  assert.equal(BOT_DELAYS.LAND_PAUSE_MS, 1100);
  assert.equal(BOT_DELAYS.QUIZ_ANSWER_MS, 1250);
  assert.equal(BOT_DELAYS.QUIZ_RESULT_MS, 1200);
  assert.equal(getScaledDelay(BOT_DELAYS.IDLE_MS, 1), 1200);
  assert.equal(getScaledDelay(BOT_DELAYS.IDLE_MS, 2), 600);
  assert.equal(getScaledDelay(BOT_DELAYS.STEP_MS, 2), 200);
});

test('getStepPath generates exact tile-by-tile sequence and detects Start crossing', () => {
  assert.deepEqual(getStepPath(15, 3), [
    { pos: 16, passedStart: false },
    { pos: 1, passedStart: true },
    { pos: 2, passedStart: false },
  ]);
  assert.deepEqual(getStepPath(1, 2), [
    { pos: 2, passedStart: false },
    { pos: 3, passedStart: false },
  ]);
});

test('RANDOM_PLAYER_NAMES has 20+ unique names and pickRandomPlayerName selects from them', () => {
  assert.ok(RANDOM_PLAYER_NAMES.length >= 20);
  assert.equal(new Set(RANDOM_PLAYER_NAMES).size, RANDOM_PLAYER_NAMES.length);
  const picked = new Set<string>();
  for (let i = 0; i < RANDOM_PLAYER_NAMES.length; i++) {
    const name = pickRandomPlayerName(() => i / RANDOM_PLAYER_NAMES.length);
    assert.ok(RANDOM_PLAYER_NAMES.includes(name));
    picked.add(name);
  }
  assert.equal(picked.size, RANDOM_PLAYER_NAMES.length);
});

test('pickAvailableTokenColor, pickRandomAvailableColor, and changePlayerColorInRoom prevent duplicate colors', () => {
  const players: Player[] = [
    { id: 'p1', name: 'หัวหน้า', color: 'red', isBot: false, position: 1, cash: 20000, inLab: false, labTurns: 0, bankrupt: false, quizCorrect: 0, quizTotal: 0, modeBonusesEarned: 0 },
    { id: 'p2', name: 'บอท 1', color: 'blue', isBot: true, position: 1, cash: 20000, inLab: false, labTurns: 0, bankrupt: false, quizCorrect: 0, quizTotal: 0, modeBonusesEarned: 0 },
  ];

  // Auto-switch colliding preferred color 'red' -> 'green'
  assert.equal(pickAvailableTokenColor(players, 'red'), 'green');
  assert.equal(pickAvailableTokenColor(players, 'yellow'), 'yellow');

  // Random bot color picks ONLY among ['green', 'yellow']
  assert.equal(pickRandomAvailableColor(players, () => 0), 'green');
  assert.equal(pickRandomAvailableColor(players, () => 0.99), 'yellow');

  const fullPlayers: Player[] = [
    ...players,
    { id: 'p3', name: 'P3', color: 'green', isBot: false, position: 1, cash: 20000, inLab: false, labTurns: 0, bankrupt: false, quizCorrect: 0, quizTotal: 0, modeBonusesEarned: 0 },
    { id: 'p4', name: 'P4', color: 'yellow', isBot: true, position: 1, cash: 20000, inLab: false, labTurns: 0, bankrupt: false, quizCorrect: 0, quizTotal: 0, modeBonusesEarned: 0 },
  ];
  assert.equal(pickRandomAvailableColor(fullPlayers), null);

  const mockRoom: GameState = {
    roomCode: 'ABC234',
    isOnline: true,
    hostId: 'p1',
    status: 'waiting',
    curriculumMode: 'mode1',
    maxRounds: 15,
    currentRound: 1,
    turnIndex: 0,
    phase: 'IDLE',
    turnStartedAt: 0,
    players,
    properties: {},
    diceCounts: createEmptyDiceCounts(),
    totalRolls: 0,
    lastDice: null,
    speechMessage: '',
    pendingAction: null,
    activeQuiz: null,
    activeUpgradeChallenge: null,
    usedQuestionIds: [],
    logs: [],
    winnerId: null,
    endReason: null,
  };

  // p1 cannot take p2's blue color
  const blocked = changePlayerColorInRoom(mockRoom, 'p1', 'blue');
  assert.equal(blocked.changed, false);
  assert.ok(blocked.reason?.includes('บอท 1'));
  assert.equal(blocked.state.players[0].color, 'red');

  // p1 can switch to free yellow color
  const allowed = changePlayerColorInRoom(mockRoom, 'p1', 'yellow');
  assert.equal(allowed.changed, true);
  assert.equal(allowed.state.players[0].color, 'yellow');
});

test('getBoardTileCoordinates maps all 16 perimeter tiles and stepVisualPosition wraps cleanly', () => {
  assert.deepEqual(getBoardTileCoordinates(1), { row: 0, col: 0, leftPct: 10, topPct: 10 });
  assert.deepEqual(getBoardTileCoordinates(5), { row: 0, col: 4, leftPct: 90, topPct: 10 });
  assert.deepEqual(getBoardTileCoordinates(9), { row: 4, col: 4, leftPct: 90, topPct: 90 });
  assert.deepEqual(getBoardTileCoordinates(13), { row: 4, col: 0, leftPct: 10, topPct: 90 });
  assert.deepEqual(getBoardTileCoordinates(16), { row: 1, col: 0, leftPct: 10, topPct: 30 });

  assert.equal(stepVisualPosition(1), 2);
  assert.equal(stepVisualPosition(15), 16);
  assert.equal(stepVisualPosition(16), 1);
});




