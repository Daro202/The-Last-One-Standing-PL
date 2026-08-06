import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Player, Question, INITIAL_PLAYERS, QUESTIONS as STATIC_QUESTIONS, ROUNDS } from './mock-data';
import confetti from 'canvas-confetti';

interface GameState {
  roundId: number;
  currentQuestion: Question | null;
  status: 'WAITING' | 'READING' | 'ANSWER_REVEALED';
  players: Player[];
  message: string;
  dynamicQuestions: Record<string, Question[]>;
  currentPlayerId: number | null;
  usedQuestionIds: Record<string, number[]>;
  gameOver: boolean;
  winnerId: number | null;
}

interface GameContextType extends GameState {
  setRound: (id: number) => void;
  setQuestion: (id: number) => void;
  revealAnswer: () => void;
  markCorrect: () => void;
  markWrong: () => void;
  setCurrentPlayer: (id: number) => void;
  nextPlayer: () => void;
  updatePlayer: (id: number, updates: Partial<Player>) => void;
  resetGame: () => void;
  broadcast: (state: GameState) => void;
  importQuestions: (questions: Question[]) => void;
  importPlayers: (players: Player[]) => void;
}

const INITIAL_STATE: GameState = {
  roundId: 1,
  currentQuestion: null,
  status: 'WAITING',
  players: INITIAL_PLAYERS,
  message: '',
  dynamicQuestions: STATIC_QUESTIONS,
  currentPlayerId: INITIAL_PLAYERS[0]?.id ?? null,
  usedQuestionIds: {},
  gameOver: false,
  winnerId: null,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

const CHANNEL_NAME = 'last_standing_broadcast';

// Returns the next active player id after `fromId`, wrapping around the list
function getNextActiveId(players: Player[], fromId: number | null): number | null {
  const active = players.filter(p => p.status === 'ACTIVE');
  if (active.length === 0) return null;
  if (fromId === null) return active[0].id;
  const currentIdx = active.findIndex(p => p.id === fromId);
  const nextIdx = (currentIdx + 1) % active.length;
  return active[nextIdx]?.id ?? null;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem('game_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.dynamicQuestions) parsed.dynamicQuestions = STATIC_QUESTIONS;
        if (parsed.currentPlayerId === undefined) parsed.currentPlayerId = parsed.players?.[0]?.id ?? null;
        if (!parsed.usedQuestionIds) parsed.usedQuestionIds = {};
        if (parsed.gameOver === undefined) parsed.gameOver = false;
        if (parsed.winnerId === undefined) parsed.winnerId = null;
        // migrate old players without lives
        if (parsed.players) {
          parsed.players = parsed.players.map((p: Player) => ({
            ...p,
            lives: p.lives ?? 2,
          }));
        }
        return parsed;
      }
      return INITIAL_STATE;
    } catch {
      return INITIAL_STATE;
    }
  });

  const stateRef = useRef(state);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    stateRef.current = state;
    localStorage.setItem('game_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC') setState(event.data.payload);
      if (event.data?.type === 'REQUEST_SYNC') channel.postMessage({ type: 'SYNC', payload: stateRef.current });
      if (event.data?.type === 'CONFETTI') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    };

    channel.onmessage = handleMessage;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'game_state' && e.newValue) setState(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorage);
    channel.postMessage({ type: 'REQUEST_SYNC' });

    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const broadcast = (newState: GameState) => {
    setState(newState);
    channelRef.current?.postMessage({ type: 'SYNC', payload: newState });
    localStorage.setItem('game_state', JSON.stringify(newState));
  };

  // ── Round / Question ──────────────────────────────────────────────────────

  const setRound = (id: number) => {
    const active = state.players.filter(p => p.status === 'ACTIVE');
    broadcast({
      ...state,
      roundId: id,
      currentQuestion: null,
      status: 'WAITING',
      message: `${ROUNDS.find(r => r.id === id)?.name ?? 'ROUND ' + id}`,
      currentPlayerId: active[0]?.id ?? null,
    });
  };

  const setQuestion = (id: number) => {
    const roundQuestions = state.dynamicQuestions[state.roundId.toString()] || [];
    const question = roundQuestions.find(q => q.id === id) ?? null;
    // Mark question as used
    const rKey = state.roundId.toString();
    const used = [...(state.usedQuestionIds[rKey] ?? [])];
    if (id && !used.includes(id)) used.push(id);
    broadcast({
      ...state,
      currentQuestion: question,
      status: 'READING',
      message: '',
      usedQuestionIds: { ...state.usedQuestionIds, [rKey]: used },
    });
  };

  const revealAnswer = () => {
    const newState: GameState = { ...state, status: 'ANSWER_REVEALED' };
    setState(newState);
    channelRef.current?.postMessage({ type: 'SYNC', payload: newState });
    channelRef.current?.postMessage({ type: 'CONFETTI' });
    localStorage.setItem('game_state', JSON.stringify(newState));
  };

  // ── Scoring / Lives ───────────────────────────────────────────────────────

  const markCorrect = () => {
    if (!state.currentPlayerId) return;
    const newPlayers = state.players.map(p =>
      p.id === state.currentPlayerId ? { ...p, points: p.points + 1 } : p
    );
    const nextId = getNextActiveId(newPlayers, state.currentPlayerId);
    broadcast({ ...state, players: newPlayers, currentPlayerId: nextId, status: 'WAITING', currentQuestion: null });
  };

  const markWrong = () => {
    if (!state.currentPlayerId) return;
    let newPlayers = state.players.map(p => {
      if (p.id !== state.currentPlayerId) return p;
      const newLives = p.lives - 1;
      return newLives <= 0
        ? { ...p, lives: 0, status: 'ELIMINATED' as const }
        : { ...p, lives: newLives };
    });

    const active = newPlayers.filter(p => p.status === 'ACTIVE');

    // Game over?
    if (active.length <= 1) {
      const winner = active[0] ?? null;
      if (winner) {
        channelRef.current?.postMessage({ type: 'CONFETTI' });
        confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
      }
      broadcast({
        ...state,
        players: newPlayers,
        gameOver: true,
        winnerId: winner?.id ?? null,
        currentPlayerId: winner?.id ?? null,
        status: 'WAITING',
        currentQuestion: null,
      });
      return;
    }

    const nextId = getNextActiveId(newPlayers, state.currentPlayerId);
    broadcast({ ...state, players: newPlayers, currentPlayerId: nextId, status: 'WAITING', currentQuestion: null });
  };

  // ── Player navigation ─────────────────────────────────────────────────────

  const setCurrentPlayer = (id: number) => {
    broadcast({ ...state, currentPlayerId: id });
  };

  const nextPlayer = () => {
    const nextId = getNextActiveId(state.players, state.currentPlayerId);
    broadcast({ ...state, currentPlayerId: nextId });
  };

  // ── Player management ─────────────────────────────────────────────────────

  const updatePlayer = (id: number, updates: Partial<Player>) => {
    const newPlayers = state.players.map(p => p.id === id ? { ...p, ...updates } : p);
    broadcast({ ...state, players: newPlayers });
  };

  const resetGame = () => {
    broadcast(INITIAL_STATE);
  };

  // ── Import / Export ───────────────────────────────────────────────────────

  const importQuestions = (newQuestions: Question[]) => {
    const rId = state.roundId.toString();
    const updatedQuestions = { ...state.dynamicQuestions, [rId]: [...newQuestions].sort((a, b) => a.id - b.id) };
    // Clear used IDs for this round since questions changed
    const updatedUsed = { ...state.usedQuestionIds, [rId]: [] };
    broadcast({ ...state, dynamicQuestions: updatedQuestions, usedQuestionIds: updatedUsed, currentQuestion: null, status: 'WAITING' });
  };

  const importPlayers = (newPlayers: Player[]) => {
    const active = newPlayers.filter(p => p.status === 'ACTIVE');
    broadcast({ ...state, players: newPlayers, currentPlayerId: active[0]?.id ?? null, gameOver: false, winnerId: null });
  };

  return (
    <GameContext.Provider value={{
      ...state,
      setRound,
      setQuestion,
      revealAnswer,
      markCorrect,
      markWrong,
      setCurrentPlayer,
      nextPlayer,
      updatePlayer,
      resetGame,
      broadcast,
      importQuestions,
      importPlayers,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
}
