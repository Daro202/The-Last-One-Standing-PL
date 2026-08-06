// ── Types ─────────────────────────────────────────────────────────────────────

export type RoundName = 'WARM UP' | 'SURVIVAL' | 'MANDATORY' | 'BATTLE';

export interface Question {
  id: number;
  text: string;
  answer: string;
  type: 'TRUE_FALSE' | 'OPEN';
  round: RoundName;
  category: string;
  difficulty?: string;
}

export interface Player {
  id: number;
  name: string;
  avatarId: number;
  points: number;
  lives: number;
  active: boolean;
}

export interface Avatar {
  id: number;
  emoji: string;
  label: string;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

/** Points awarded for a correct answer, keyed by round name. Single source of truth. */
export const ROUND_POINTS: Record<RoundName, number> = {
  'WARM UP':   1,
  'SURVIVAL':  2,
  'MANDATORY': 3,
  'BATTLE':    5,
};

// ── Rounds ────────────────────────────────────────────────────────────────────

export const ROUNDS: { id: number; name: RoundName; description: string }[] = [
  { id: 1, name: 'WARM UP',   description: 'TRUE / FALSE — correct answer: +1 point' },
  { id: 2, name: 'SURVIVAL',  description: 'TRUE / FALSE — correct answer: +2 points' },
  { id: 3, name: 'MANDATORY', description: 'Open questions — correct answer: +3 points' },
  { id: 4, name: 'BATTLE',    description: 'Open questions — correct answer: +5 points' },
];

// ── Avatars ───────────────────────────────────────────────────────────────────

export const AVATARS: Avatar[] = [
  { id:  1, emoji: '🦁', label: 'Lion'    },
  { id:  2, emoji: '🐯', label: 'Tiger'   },
  { id:  3, emoji: '🦊', label: 'Fox'     },
  { id:  4, emoji: '🐺', label: 'Wolf'    },
  { id:  5, emoji: '🦝', label: 'Raccoon' },
  { id:  6, emoji: '🐻', label: 'Bear'    },
  { id:  7, emoji: '🦄', label: 'Unicorn' },
  { id:  8, emoji: '🐲', label: 'Dragon'  },
  { id:  9, emoji: '🦅', label: 'Eagle'   },
  { id: 10, emoji: '🦈', label: 'Shark'   },
  { id: 11, emoji: '🦉', label: 'Owl'     },
  { id: 12, emoji: '🤖', label: 'Robot'   },
];

export const DEFAULT_LIVES = 2;

// ── Initial players ───────────────────────────────────────────────────────────

export const INITIAL_PLAYERS: Player[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Player ${i + 1}`,
  avatarId: (i % AVATARS.length) + 1,
  points: 0,
  lives: DEFAULT_LIVES,
  active: true,
}));
