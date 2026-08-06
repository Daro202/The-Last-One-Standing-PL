import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Player, Question, INITIAL_PLAYERS, ROUNDS, ROUND_POINTS, DEFAULT_LIVES } from './mock-data';
import { parseExcelBuffer } from './excel-loader';
import confetti from 'canvas-confetti';

// ── State shape ───────────────────────────────────────────────────────────────

export interface GameState {
  roundId: number;
  currentQuestion: Question | null;
  status: 'WAITING' | 'READING' | 'ANSWER_REVEALED';
  questionScored: boolean;          // prevents double-scoring same question
  players: Player[];
  questions: Question[];            // all loaded questions (flat)
  categories: string[];             // discovered from loaded questions
  selectedCategory: string | null;  // null = All Categories
  currentPlayerId: number | null;
  usedQuestionIds: number[];        // global — never repeats during a game
  gameOver: boolean;
  winnerId: number | null;
  questionsSource: 'default' | 'manual' | 'none';
}

export interface GameContextType extends GameState {
  setRound: (id: number) => void;
  setQuestion: (id: number) => void;
  drawQuestion: () => void;
  revealAnswer: () => void;
  markCorrect: () => void;
  markWrong: () => void;
  setCurrentPlayer: (id: number) => void;
  nextPlayer: () => void;
  setCategory: (cat: string | null) => void;
  updatePlayer: (id: number, updates: Partial<Player>) => void;
  resetGame: () => void;
  broadcast: (state: GameState) => void;
  importQuestions: (questions: Question[], categories: string[]) => void;
  importPlayers: (players: Player[]) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNextActiveId(players: Player[], fromId: number | null): number | null {
  const active = players.filter(p => p.active);
  if (active.length === 0) return null;
  if (fromId === null) return active[0].id;
  const idx = active.findIndex(p => p.id === fromId);
  return active[(idx + 1) % active.length]?.id ?? null;
}

// ── State migration from previous format ──────────────────────────────────────

function migrateState(parsed: Record<string, unknown>): GameState {
  // Migrate players: add avatarId, replace status string with active boolean
  let players: Player[] = ((parsed.players as Player[] | undefined) ?? INITIAL_PLAYERS).map(
    (p: Record<string, unknown>, i: number) => ({
      id: (p.id as number) ?? i + 1,
      name: (p.name as string) ?? `Player ${i + 1}`,
      avatarId: (p.avatarId as number) ?? ((i % 12) + 1),
      points: (p.points as number) ?? 0,
      lives: (p.lives as number) ?? DEFAULT_LIVES,
      active: p.active !== undefined
        ? Boolean(p.active)
        : (p.status === 'ACTIVE' || p.status === undefined),
    })
  );

  // Migrate questions from old dynamicQuestions Record<string, OldQuestion[]>
  let questions: Question[] = (parsed.questions as Question[]) ?? [];
  let categories: string[] = (parsed.categories as string[]) ?? [];
  let questionsSource = (parsed.questionsSource as GameState['questionsSource']) ?? 'none';

  if (!questions.length && parsed.dynamicQuestions) {
    const roundMap: Record<string, string> = {
      '1': 'WARM UP', '2': 'SURVIVAL', '3': 'MANDATORY', '4': 'BATTLE',
    };
    const dynQ = parsed.dynamicQuestions as Record<string, Record<string, unknown>[]>;
    Object.entries(dynQ).forEach(([rId, qs]) => {
      const rName = roundMap[rId] ?? `Round ${rId}`;
      qs.forEach((q) => {
        questions.push({
          id: q.id as number,
          text: q.text as string,
          answer: q.answer as string,
          type: (q.type === 'YES_NO' ? 'TRUE_FALSE' : (q.type ?? 'OPEN')) as 'TRUE_FALSE' | 'OPEN',
          round: rName as Question['round'],
          category: (q.category as string) ?? 'General',
          difficulty: q.difficulty as string | undefined,
        });
      });
    });
    if (questions.length) questionsSource = 'default';
    categories = [...new Set(questions.map(q => q.category))].sort();
  }

  // Migrate usedQuestionIds from old Record<string, number[]> to flat number[]
  let usedQuestionIds: number[] = [];
  const raw = parsed.usedQuestionIds;
  if (Array.isArray(raw)) {
    usedQuestionIds = raw as number[];
  } else if (raw && typeof raw === 'object') {
    Object.values(raw as Record<string, number[]>).forEach(ids =>
      ids.forEach(id => { if (!usedQuestionIds.includes(id)) usedQuestionIds.push(id); })
    );
  }

  const active = players.filter(p => p.active);

  return {
    roundId: (parsed.roundId as number) ?? 1,
    currentQuestion: (parsed.currentQuestion as Question | null) ?? null,
    status: (parsed.status as GameState['status']) ?? 'WAITING',
    questionScored: (parsed.questionScored as boolean) ?? false,
    players,
    questions,
    categories,
    selectedCategory: (parsed.selectedCategory as string | null) ?? null,
    currentPlayerId: (parsed.currentPlayerId as number | null) ?? active[0]?.id ?? null,
    usedQuestionIds,
    gameOver: (parsed.gameOver as boolean) ?? false,
    winnerId: (parsed.winnerId as number | null) ?? null,
    questionsSource,
  };
}

// ── Initial state ─────────────────────────────────────────────────────────────

const INITIAL_STATE: GameState = {
  roundId: 1,
  currentQuestion: null,
  status: 'WAITING',
  questionScored: false,
  players: INITIAL_PLAYERS,
  questions: [],
  categories: [],
  selectedCategory: null,
  currentPlayerId: INITIAL_PLAYERS[0]?.id ?? null,
  usedQuestionIds: [],
  gameOver: false,
  winnerId: null,
  questionsSource: 'none',
};

// ── Context ───────────────────────────────────────────────────────────────────

const GameContext = createContext<GameContextType | undefined>(undefined);
const CHANNEL_NAME = 'last_standing_broadcast_v2';

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem('game_state');
      if (saved) return migrateState(JSON.parse(saved));
    } catch { /* ignore */ }
    return INITIAL_STATE;
  });

  const stateRef = useRef(state);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    stateRef.current = state;
    localStorage.setItem('game_state', JSON.stringify(state));
  }, [state]);

  // BroadcastChannel setup
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC')         setState(event.data.payload);
      if (event.data?.type === 'REQUEST_SYNC') channel.postMessage({ type: 'SYNC', payload: stateRef.current });
      if (event.data?.type === 'CONFETTI')     confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'game_state' && e.newValue) {
        try { setState(JSON.parse(e.newValue)); } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handleStorage);
    channel.postMessage({ type: 'REQUEST_SYNC' });

    return () => { channel.close(); window.removeEventListener('storage', handleStorage); };
  }, []);

  // Auto-load default Excel on first launch
  useEffect(() => {
    if (stateRef.current.questionsSource !== 'none') return;
    fetch('/data/quiz_questions.xlsx')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
      .then(buf => {
        const { questions, categories, errors } = parseExcelBuffer(buf);
        if (errors.length) console.warn('[Auto-load] Excel errors:', errors);
        if (questions.length) {
          setState(prev => {
            if (prev.questionsSource !== 'none') return prev;
            const next: GameState = { ...prev, questions, categories, questionsSource: 'default' };
            localStorage.setItem('game_state', JSON.stringify(next));
            channelRef.current?.postMessage({ type: 'SYNC', payload: next });
            return next;
          });
        }
      })
      .catch(err => console.warn('[Auto-load] Default questions not found:', err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Core broadcast helper ──────────────────────────────────────────────────

  const broadcast = (newState: GameState) => {
    setState(newState);
    channelRef.current?.postMessage({ type: 'SYNC', payload: newState });
    localStorage.setItem('game_state', JSON.stringify(newState));
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const setRound = (id: number) => {
    const active = state.players.filter(p => p.active);
    broadcast({
      ...state,
      roundId: id,
      currentQuestion: null,
      status: 'WAITING',
      questionScored: false,
      currentPlayerId: active[0]?.id ?? null,
    });
  };

  const setQuestion = (id: number) => {
    const question = state.questions.find(q => q.id === id) ?? null;
    if (!question) return;
    const used = state.usedQuestionIds.includes(id)
      ? state.usedQuestionIds
      : [...state.usedQuestionIds, id];
    broadcast({ ...state, currentQuestion: question, status: 'READING', questionScored: false, usedQuestionIds: used });
  };

  const drawQuestion = () => {
    const roundName = ROUNDS.find(r => r.id === state.roundId)?.name ?? 'WARM UP';
    const eligible = state.questions.filter(q =>
      q.round === roundName &&
      (!state.selectedCategory || q.category === state.selectedCategory) &&
      !state.usedQuestionIds.includes(q.id)
    );
    if (!eligible.length) return;
    const q = eligible[Math.floor(Math.random() * eligible.length)];
    broadcast({
      ...state,
      currentQuestion: q,
      status: 'READING',
      questionScored: false,
      usedQuestionIds: [...state.usedQuestionIds, q.id],
    });
  };

  const revealAnswer = () => {
    const next: GameState = { ...state, status: 'ANSWER_REVEALED' };
    setState(next);
    channelRef.current?.postMessage({ type: 'SYNC', payload: next });
    channelRef.current?.postMessage({ type: 'CONFETTI' });
    localStorage.setItem('game_state', JSON.stringify(next));
  };

  const markCorrect = () => {
    if (!state.currentPlayerId || !state.currentQuestion || state.questionScored || state.gameOver) return;
    const roundName = ROUNDS.find(r => r.id === state.roundId)?.name ?? 'WARM UP';
    const pts = ROUND_POINTS[roundName] ?? 1;
    const newPlayers = state.players.map(p =>
      p.id === state.currentPlayerId ? { ...p, points: p.points + pts } : p
    );
    const nextId = getNextActiveId(newPlayers, state.currentPlayerId);
    broadcast({ ...state, players: newPlayers, currentPlayerId: nextId, questionScored: true });
  };

  const markWrong = () => {
    if (!state.currentPlayerId || !state.currentQuestion || state.questionScored || state.gameOver) return;
    const newPlayers = state.players.map(p => {
      if (p.id !== state.currentPlayerId) return p;
      const newLives = Math.max(0, p.lives - 1);
      return { ...p, lives: newLives, active: newLives > 0 };
    });
    const active = newPlayers.filter(p => p.active);
    if (active.length <= 1) {
      const winner = active[0] ?? null;
      if (winner) {
        confetti({ particleCount: 250, spread: 130, origin: { y: 0.5 } });
        channelRef.current?.postMessage({ type: 'CONFETTI' });
      }
      broadcast({
        ...state,
        players: newPlayers,
        questionScored: true,
        gameOver: true,
        winnerId: winner?.id ?? null,
        currentPlayerId: winner?.id ?? null,
      });
      return;
    }
    const nextId = getNextActiveId(newPlayers, state.currentPlayerId);
    broadcast({ ...state, players: newPlayers, currentPlayerId: nextId, questionScored: true });
  };

  const setCurrentPlayer = (id: number) => broadcast({ ...state, currentPlayerId: id });

  const nextPlayer = () => {
    const nextId = getNextActiveId(state.players, state.currentPlayerId);
    broadcast({ ...state, currentPlayerId: nextId });
  };

  const setCategory = (cat: string | null) => broadcast({ ...state, selectedCategory: cat });

  const updatePlayer = (id: number, updates: Partial<Player>) => {
    const newPlayers = state.players.map(p => p.id === id ? { ...p, ...updates } : p);
    broadcast({ ...state, players: newPlayers });
  };

  const resetGame = () => {
    // Use functional setState so we always get the LATEST state, not a closure snapshot.
    // This prevents stale-closure bugs where questions/questionsSource from a previous
    // render (e.g. old migrated Polish questions) would get spread into the reset state
    // instead of the currently imported Excel set.
    setState(prev => {
      const resetPlayers = prev.players.map(p => ({
        ...p, points: 0, lives: DEFAULT_LIVES, active: true,
      }));
      const active = resetPlayers.filter(p => p.active);
      const next: GameState = {
        // Preserve everything from the latest state — especially:
        //   questions, categories, questionsSource (loaded Excel set)
        //   player names and avatarIds
        ...prev,
        // Reset only gameplay fields
        players: resetPlayers,
        currentQuestion: null,
        status: 'WAITING',
        questionScored: false,
        usedQuestionIds: [],
        gameOver: false,
        winnerId: null,
        currentPlayerId: active[0]?.id ?? null,
        roundId: 1,
        selectedCategory: null,
      };
      localStorage.setItem('game_state', JSON.stringify(next));
      channelRef.current?.postMessage({ type: 'SYNC', payload: next });
      return next;
    });
  };

  const importQuestions = (newQuestions: Question[], newCategories: string[]) => {
    broadcast({
      ...state,
      questions: newQuestions,
      categories: newCategories,
      currentQuestion: null,
      status: 'WAITING',
      questionScored: false,
      questionsSource: 'manual',
      usedQuestionIds: [],
      selectedCategory: null,
    });
  };

  const importPlayers = (newPlayers: Player[]) => {
    const active = newPlayers.filter(p => p.active);
    broadcast({
      ...state,
      players: newPlayers,
      currentPlayerId: active[0]?.id ?? null,
      gameOver: false,
      winnerId: null,
    });
  };

  return (
    <GameContext.Provider value={{
      ...state,
      setRound, setQuestion, drawQuestion, revealAnswer,
      markCorrect, markWrong, setCurrentPlayer, nextPlayer, setCategory,
      updatePlayer, resetGame, broadcast, importQuestions, importPlayers,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
