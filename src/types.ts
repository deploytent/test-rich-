export type TokenColor = 'red' | 'blue' | 'green' | 'yellow';

export type CurriculumMode = 'mode1' | 'mode2' | 'mode3';

export type BotDifficulty = 'rookie' | 'professor';

export type GamePhase =
  | 'IDLE'          // Waiting for current player to roll (or pay/roll out of lab)
  | 'ROLLING'       // Dice rolling animation
  | 'DICE_RESULT'   // Brief pause displaying rolled dice face before movement
  | 'MOVING'        // Token stepping across tiles
  | 'ACTION'        // Player landed and must decide (Buy / Upgrade / Takeover / Warp / Sell Debt)
  | 'QUIZ'          // Quiz modal active (Tiles 3 & 11)
  | 'UPGRADE_TASK'  // Interactive mini-challenge to upgrade owned property
  | 'GAME_OVER';    // Match ended

export type TileType =
  | 'start'
  | 'property'
  | 'utility'
  | 'quiz_basic'
  | 'quiz_visual'
  | 'lab'
  | 'warp'
  | 'go_to_lab'
  | 'tax';

export type PropertyGroup = 'green' | 'sky' | 'orange' | 'red' | 'utility';

export interface TileConfig {
  id: number; // 1 to 16
  name: string;
  shortName: string;
  type: TileType;
  group?: PropertyGroup;
  price?: number;
  baseRent?: number;
  description: string;
}

export interface PropertyState {
  ownerId: string | null;
  level: 0 | 1 | 2; // 0 = base, 1 = 2x rent, 2 = 3x rent
}

export interface Player {
  id: string;
  name: string;
  color: TokenColor;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
  position: number; // 1 to 16
  cash: number;
  inLab: boolean;
  labTurns: number; // 0, 1, 2
  bankrupt: boolean;
  quizCorrect: number;
  quizTotal: number;
  modeBonusesEarned: number;
}

export type ChartSpec =
  | {
      kind: 'bar';
      title: string;
      unit: string;
      items: { label: string; value: number; color: string }[];
    }
  | {
      kind: 'grouped_bar';
      title: string;
      unit: string;
      seriesLabels: [string, string];
      seriesColors: [string, string];
      items: { label: string; values: [number, number] }[];
    }
  | {
      kind: 'pie';
      title: string;
      unit: string;
      items: { label: string; value: number; percent: number; color: string }[];
    }
  | {
      kind: 'pictogram';
      title: string;
      symbolLabel: string;
      unitPerSymbol: number;
      items: { label: string; symbols: number }[];
    }
  | {
      kind: 'table';
      title: string;
      headers: string[];
      rows: string[][];
    };

export interface QuizQuestion {
  id: string;
  mode: 'mode1' | 'mode2';
  category: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  chart?: ChartSpec;
}

export interface UpgradeChallenge {
  id: string;
  kind: 'relative_freq' | 'choose_chart' | 'pie_missing' | 'classify_data' | 'mode_calc';
  title: string;
  prompt: string;
  tableRows?: {
    label: string;
    freq: number;
    relFreqDisplay: string; // e.g., "25%" or "?"
  }[];
  totalFreq?: number;
  pieSlices?: {
    label: string;
    percent: number;
    color: string;
    isMissing?: boolean;
  }[];
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface BuyDiscountPuzzle {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LogEntry {
  id: string;
  round: number;
  message: string;
  tone: 'info' | 'gain' | 'loss' | 'alert' | 'bonus';
}

export interface PendingAction {
  type: 'buy' | 'upgrade_prompt' | 'takeover' | 'warp' | 'sell_for_debt';
  tileId: number;
  amount: number; // price, takeover cost, or debt remaining
  targetOwnerId?: string;
}

export interface ActiveQuizState {
  question: QuizQuestion;
  playerId: string;
  selectedIndex: number | null;
  isResolved: boolean;
  botWillPickAt?: number;
}

export interface GameState {
  roomCode: string | null;
  isOnline: boolean;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  curriculumMode: CurriculumMode;
  maxRounds: 10 | 15 | 20;
  currentRound: number;
  turnIndex: number;
  phase: GamePhase;
  turnStartedAt: number;
  players: Player[];
  properties: Record<number, PropertyState>; // keyed by tileId (1..16)
  diceCounts: Record<number, number>; // keys 1..6 -> count
  totalRolls: number;
  lastDice: number | null;
  speechMessage: string;
  pendingAction: PendingAction | null;
  activeQuiz: ActiveQuizState | null;
  activeUpgradeChallenge: UpgradeChallenge | null;
  usedQuestionIds: string[];
  logs: LogEntry[];
  winnerId: string | null;
  endReason: 'rounds_completed' | 'last_standing' | null;
}

export interface MoneyPopup {
  id: string;
  playerId: string;
  amount: number;
}

