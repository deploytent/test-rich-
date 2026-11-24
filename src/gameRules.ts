import type {
  CurriculumMode,
  GameState,
  Player,
  PropertyGroup,
  PropertyState,
  TileConfig,
  TokenColor,
} from './types';

export const STARTING_CASH = 20000;
export const START_PASS_BONUS = 3000;
export const MODE_BONUS_AMOUNT = 2000;
export const QUIZ_REWARD = 1500;
export const QUIZ_PENALTY = 1000;
export const LAB_BAIL_COST = 1500;
export const WARP_COST = 1000;
export const TAX_AMOUNT = 2000;
export const GROUP_MONOPOLY_BONUS = 500;

export const COLOR_META: Record<
  TokenColor,
  { label: string; hex: string; ring: string; bgClass: string; textClass: string }
> = {
  red: {
    label: 'สีแดง',
    hex: '#EF4444',
    ring: 'ring-red-400',
    bgClass: 'bg-red-500',
    textClass: 'text-red-400',
  },
  blue: {
    label: 'สีน้ำเงิน',
    hex: '#3B82F6',
    ring: 'ring-blue-400',
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-400',
  },
  green: {
    label: 'สีเขียว',
    hex: '#10B981',
    ring: 'ring-emerald-400',
    bgClass: 'bg-emerald-500',
    textClass: 'text-emerald-400',
  },
  yellow: {
    label: 'สีเหลือง',
    hex: '#F59E0B',
    ring: 'ring-amber-400',
    bgClass: 'bg-amber-400',
    textClass: 'text-amber-300',
  },
};

/**
 * Generate a 6-character alphanumeric room code excluding ambiguous chars: O, 0, I, 1
 */
export function generateRoomCode(rng: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(rng() * alphabet.length);
    code += alphabet[idx];
  }
  return code;
}

/**
 * Calculate live frequency stats and Mode (ฐานนิยม) for dice rolls 1..6.
 * Mode bonus activates from Round 3 onwards when at least 1 roll exists.
 */
export interface DiceStatRow {
  face: number;
  count: number;
  relativePercent: number;
  isMode: boolean;
}

export function computeDiceStats(
  diceCounts: Record<number, number>,
  currentRound: number
): {
  totalRolls: number;
  maxCount: number;
  modeFaces: number[];
  modeActive: boolean;
  rows: DiceStatRow[];
} {
  let totalRolls = 0;
  let maxCount = 0;
  for (let face = 1; face <= 6; face++) {
    const c = diceCounts[face] ?? 0;
    totalRolls += c;
    if (c > maxCount) maxCount = c;
  }

  const modeActive = currentRound >= 3 && maxCount > 0;
  const modeFaces: number[] = [];
  if (maxCount > 0) {
    for (let face = 1; face <= 6; face++) {
      if ((diceCounts[face] ?? 0) === maxCount) {
        modeFaces.push(face);
      }
    }
  }

  const rows: DiceStatRow[] = [];
  for (let face = 1; face <= 6; face++) {
    const count = diceCounts[face] ?? 0;
    const relativePercent = totalRolls > 0 ? (count / totalRolls) * 100 : 0;
    rows.push({
      face,
      count,
      relativePercent,
      isMode: modeActive && count === maxCount,
    });
  }

  return {
    totalRolls,
    maxCount,
    modeFaces,
    modeActive,
    rows,
  };
}

/**
 * Check if a player owns all property tiles in a given color group.
 */
export function hasGroupMonopoly(
  ownerId: string,
  group: PropertyGroup | undefined,
  tiles: TileConfig[],
  properties: Record<number, PropertyState>
): boolean {
  if (!group || group === 'utility') return false;
  const groupTiles = tiles.filter((t) => t.group === group);
  if (groupTiles.length === 0) return false;
  return groupTiles.every((t) => properties[t.id]?.ownerId === ownerId);
}

/**
 * Compute exact rent for landing on an owned tile.
 */
export function calculateRent(
  tile: TileConfig,
  propState: PropertyState,
  diceRoll: number,
  tiles: TileConfig[],
  properties: Record<number, PropertyState>
): number {
  if (!propState.ownerId) return 0;
  if (tile.type === 'utility') {
    return diceRoll * 200;
  }
  const base = tile.baseRent ?? 0;
  const monopoly = hasGroupMonopoly(propState.ownerId, tile.group, tiles, properties)
    ? GROUP_MONOPOLY_BONUS
    : 0;
  const multiplier = propState.level === 2 ? 3 : propState.level === 1 ? 2 : 1;
  return (base + monopoly) * multiplier;
}

/**
 * Compute total investment value of a property (buy price + level upgrades)
 */
export function getPropertyTotalValue(tile: TileConfig, propState: PropertyState): number {
  const basePrice = tile.price ?? 0;
  return basePrice * (1 + propState.level);
}

/**
 * Compute 20% discounted buy price when player solves a quick buy puzzle
 */
export function getDiscountedPrice(price: number): number {
  return Math.round(price * 0.8);
}

/**
 * Compute takeover price: 2x total value (only allowed for non-Level 2 properties)
 */
export function getTakeoverCost(tile: TileConfig, propState: PropertyState): number {
  return getPropertyTotalValue(tile, propState) * 2;
}

/**
 * Compute liquidation (sell to bank) price: 50% of total value
 */
export function getSellToBankValue(tile: TileConfig, propState: PropertyState): number {
  return Math.floor(getPropertyTotalValue(tile, propState) * 0.5);
}

/**
 * Calculate Net Worth = Cash + sum of owned property total values
 */
export function calculateNetWorth(
  player: Player,
  tiles: TileConfig[],
  properties: Record<number, PropertyState>
): number {
  let propertyWealth = 0;
  for (const tile of tiles) {
    const state = properties[tile.id];
    if (state && state.ownerId === player.id) {
      propertyWealth += getPropertyTotalValue(tile, state);
    }
  }
  return player.cash + propertyWealth;
}

/**
 * Step movement around the 16-tile board and detect if Start (Tile 1) was passed or landed on.
 */
export function advanceBoardPosition(
  currentPos: number,
  steps: number
): { newPos: number; passedStart: boolean } {
  const zeroIndexed = currentPos - 1;
  const rawNext = zeroIndexed + steps;
  const passedStart = rawNext >= 16;
  const newPos = (rawNext % 16) + 1;
  return { newPos, passedStart };
}

/**
 * Generate the sequence of individual tiles visited step-by-step for hop animations.
 */
export function getStepPath(
  currentPos: number,
  steps: number
): Array<{ pos: number; passedStart: boolean }> {
  const path: Array<{ pos: number; passedStart: boolean }> = [];
  let pos = currentPos;
  for (let i = 0; i < steps; i++) {
    const nextPos = (pos % 16) + 1;
    path.push({
      pos: nextPos,
      passedStart: nextPos === 1,
    });
    pos = nextPos;
  }
  return path;
}

/**
 * Find next active (non-bankrupt) player index and whether a new round starts.
 */
export function findNextTurn(
  players: Player[],
  currentTurnIndex: number,
  currentRound: number
): { nextTurnIndex: number; nextRound: number } {
  const total = players.length;
  for (let offset = 1; offset <= total; offset++) {
    const candidateIdx = (currentTurnIndex + offset) % total;
    if (!players[candidateIdx].bankrupt) {
      const wrappedRound = currentTurnIndex + offset >= total ? currentRound + 1 : currentRound;
      return { nextTurnIndex: candidateIdx, nextRound: wrappedRound };
    }
  }
  return { nextTurnIndex: currentTurnIndex, nextRound: currentRound };
}

/**
 * Determine winner if game reaches end condition (last standing or max rounds exceeded).
 */
export function evaluateGameEnd(
  state: Pick<GameState, 'players' | 'properties' | 'currentRound' | 'maxRounds'>,
  tiles: TileConfig[]
): {
  ended: boolean;
  winnerId: string | null;
  reason: 'last_standing' | 'rounds_completed' | null;
} {
  const activePlayers = state.players.filter((p) => !p.bankrupt);
  if (activePlayers.length === 1) {
    return {
      ended: true,
      winnerId: activePlayers[0].id,
      reason: 'last_standing',
    };
  }
  if (activePlayers.length === 0) {
    return {
      ended: true,
      winnerId: state.players[0]?.id ?? null,
      reason: 'last_standing',
    };
  }
  if (state.currentRound > state.maxRounds) {
    const ranked = [...activePlayers].sort(
      (a, b) =>
        calculateNetWorth(b, tiles, state.properties) -
        calculateNetWorth(a, tiles, state.properties)
    );
    return {
      ended: true,
      winnerId: ranked[0]?.id ?? null,
      reason: 'rounds_completed',
    };
  }
  return { ended: false, winnerId: null, reason: null };
}

export function createInitialProperties(tiles: TileConfig[]): Record<number, PropertyState> {
  const props: Record<number, PropertyState> = {};
  for (const tile of tiles) {
    if (tile.type === 'property' || tile.type === 'utility') {
      props[tile.id] = { ownerId: null, level: 0 };
    }
  }
  return props;
}

export function createEmptyDiceCounts(): Record<number, number> {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
}

export function getModeLabel(mode: CurriculumMode): string {
  switch (mode) {
    case 'mode1':
      return 'โหมด 1: ความหมายของสถิติศาสตร์และข้อมูล';
    case 'mode2':
      return 'โหมด 2: การวิเคราะห์และนำเสนอข้อมูลเชิงคุณภาพ';
    case 'mode3':
    default:
      return 'โหมด 3: โหมดผสมผสาน (All-in-One)';
  }
}
