import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Player, Question, INITIAL_PLAYERS, QUESTIONS, ROUNDS } from './mock-data';
import confetti from 'canvas-confetti';

interface GameState {
  roundId: number;
  currentQuestion: Question | null;
  status: 'WAITING' | 'READING' | 'ANSWER_REVEALED';
  players: Player[];
  message: string;
}

interface GameContextType extends GameState {
  setRound: (id: number) => void;
  setQuestion: (id: number) => void;
  revealAnswer: () => void;
  updatePlayer: (id: number, updates: Partial<Player>) => void;
  resetGame: () => void;
  broadcast: (state: GameState) => void;
}

const INITIAL_STATE: GameState = {
  roundId: 1,
  currentQuestion: null,
  status: 'WAITING',
  players: INITIAL_PLAYERS,
  message: '',
};

const GameContext = createContext<GameContextType | undefined>(undefined);

const CHANNEL_NAME = 'one_of_ten_broadcast_final';

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem('game_state');
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch (e) {
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
      if (event.data && event.data.type === 'SYNC') {
        setState(event.data.payload);
      }
      if (event.data && event.data.type === 'REQUEST_SYNC') {
        channel.postMessage({ type: 'SYNC', payload: stateRef.current });
      }
      if (event.data && event.data.type === 'CONFETTI') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    };

    channel.onmessage = handleMessage;

    // Reliability Fallback: Sync via LocalStorage event (works across tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'game_state' && e.newValue) {
        setState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);

    // Initial sync request
    channel.postMessage({ type: 'REQUEST_SYNC' });

    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const broadcast = (newState: GameState) => {
    setState(newState);
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'SYNC', payload: newState });
    }
    // Storage event doesn't fire in the same tab, but it will in others
    localStorage.setItem('game_state', JSON.stringify(newState));
  };

  const setRound = (id: number) => {
    broadcast({ ...state, roundId: id, currentQuestion: null, status: 'WAITING', message: `ROUND ${id}` });
  };

  const setQuestion = (id: number) => {
    const roundQuestions = QUESTIONS[state.roundId.toString()] || [];
    const question = roundQuestions.find(q => q.id === id) || null;
    broadcast({ ...state, currentQuestion: question, status: 'READING', message: '' });
  };

  const revealAnswer = () => {
    const newState: GameState = { ...state, status: 'ANSWER_REVEALED' };
    setState(newState);
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'SYNC', payload: newState });
      channelRef.current.postMessage({ type: 'CONFETTI' });
    }
    localStorage.setItem('game_state', JSON.stringify(newState));
  };

  const updatePlayer = (id: number, updates: Partial<Player>) => {
    const newPlayers = state.players.map(p => p.id === id ? { ...p, ...updates } : p);
    broadcast({ ...state, players: newPlayers });
  };

  const resetGame = () => {
    broadcast(INITIAL_STATE);
  };

  return (
    <GameContext.Provider value={{ ...state, setRound, setQuestion, revealAnswer, updatePlayer, resetGame, broadcast }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
}
