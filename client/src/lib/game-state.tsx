import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

const CHANNEL_NAME = '1_of_10_game_channel';

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem('game_state');
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch (e) {
      console.error("Failed to load game state", e);
      return INITIAL_STATE;
    }
  });

  // Sync with BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    
    channel.onmessage = (event) => {
      if (event.data && event.data.type === 'SYNC') {
        setState(event.data.payload);
      }
      if (event.data && event.data.type === 'CONFETTI') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    };

    return () => channel.close();
  }, []);

  // Persist state
  useEffect(() => {
    localStorage.setItem('game_state', JSON.stringify(state));
  }, [state]);

  const broadcast = (newState: GameState) => {
    setState(newState);
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: 'SYNC', payload: newState });
    channel.close();
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
    broadcast({ ...state, status: 'ANSWER_REVEALED' });
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: 'CONFETTI' });
    channel.close();
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
