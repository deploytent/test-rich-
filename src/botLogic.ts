import type { BotDifficulty, GameState, Player, TileConfig } from './types';
import { getSellToBankValue } from './gameRules';

export type GameSpeed = 1 | 2;

export const BOT_DELAYS = {
  IDLE_MS: 1200,
  ROLL_MS: 900,
  ROLL_REVEAL_MS: 400,
  STEP_MS: 400,
  LAND_PAUSE_MS: 1100,
  QUIZ_ANSWER_MS: 1250,
  QUIZ_RESULT_MS: 1200,
} as const;

export function getScaledDelay(baseMs: number, speed: GameSpeed): number {
  return Math.max(60, Math.round(baseMs / speed));
}

export const BOT_NAMES = ['บอทพายอาร์', 'บอทซิกมา', 'บอทควอไทล์', 'บอทเดลต้า'];

export function getBotQuizAccuracy(difficulty: BotDifficulty = 'rookie'): number {
  return difficulty === 'professor' ? 0.85 : 0.5;
}

export function pickBotQuizAnswer(
  correctIndex: number,
  difficulty: BotDifficulty = 'rookie'
): number {
  const acc = getBotQuizAccuracy(difficulty);
  if (Math.random() < acc) {
    return correctIndex;
  }
  const wrongIndices = [0, 1, 2, 3].filter((i) => i !== correctIndex);
  return wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
}

export function shouldBotBuyProperty(bot: Player, price: number): boolean {
  return bot.cash - price >= 2500;
}

export function shouldBotUpgradeProperty(bot: Player, price: number): boolean {
  return bot.cash >= 4000 && bot.cash - price >= 2000;
}

export function shouldBotTakeover(bot: Player, takeoverCost: number): boolean {
  return bot.cash - takeoverCost >= 3500;
}

export function shouldBotPayLabBail(bot: Player): boolean {
  return bot.cash >= 4500;
}

/**
 * Choose best warp tile for bot: prefers unowned affordable property, or own property to upgrade, or Start (1).
 */
export function pickBotWarpDestination(
  bot: Player,
  state: GameState,
  tiles: TileConfig[]
): number {
  const unownedAffordable = tiles.filter(
    (t) =>
      (t.type === 'property' || t.type === 'utility') &&
      !state.properties[t.id]?.ownerId &&
      bot.cash - (t.price ?? 0) >= 2500
  );
  if (unownedAffordable.length > 0) {
    // Pick highest priced affordable property
    unownedAffordable.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    return unownedAffordable[0].id;
  }
  const ownUpgradeable = tiles.filter(
    (t) =>
      t.type === 'property' &&
      state.properties[t.id]?.ownerId === bot.id &&
      (state.properties[t.id]?.level ?? 0) < 2 &&
      bot.cash >= 4000
  );
  if (ownUpgradeable.length > 0) {
    return ownUpgradeable[0].id;
  }
  return 1; // Start (+3,000)
}

/**
 * Pick lowest-value property for bot to liquidate when cash < 0.
 */
export function pickBotPropertyToSell(
  bot: Player,
  state: GameState,
  tiles: TileConfig[]
): number | null {
  const owned = tiles.filter((t) => state.properties[t.id]?.ownerId === bot.id);
  if (owned.length === 0) return null;
  owned.sort((a, b) => {
    const valA = getSellToBankValue(a, state.properties[a.id]);
    const valB = getSellToBankValue(b, state.properties[b.id]);
    return valA - valB;
  });
  return owned[0].id;
}

export function getBotGreeting(difficulty: BotDifficulty = 'rookie'): string {
  if (difficulty === 'professor') {
    return 'วิเคราะห์ความน่าจะเป็นพร้อมแล้ว มาประชันสถิติกัน!';
  }
  return 'เพิ่งเริ่มเรียนสถิติเหมือนกัน ขอทอยเต๋าสนุกๆ นะ!';
}
