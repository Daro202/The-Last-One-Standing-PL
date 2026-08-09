import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Player, Question, INITIAL_PLAYERS, ROUNDS, ROUND_POINTS, DEFAULT_LIVES } from './mock-data';
import { parseExcelBuffer } from './excel-loader';
import confetti from 'canvas-confetti';
import { playFanfare, playWrong, playReveal, playQuestionNarration, stopQuestionNarration } from './arena-audio';

// ── State shape ───────────────────────────────────────────────────────────────

export interface GameState {
  roundId: number;
  currentQuestion: Question | null;
  status: 'WAITING' | 'READING' | 'ANSWER_REVEALED';
  questionScored: boolean;
  players: Player[];
  questions: Question[];
  categories: string[];
  selectedCategory: string | null;
  currentPlayerId: number | null;
  usedQuestionIds: number[];
  gameOver: boolean;
  winnerId: number | null;
  questionsSource: 'default' | 'manual' | 'none';
  // ── Timer ──────────────────────────────────────────────────────────────────
  timerActive: boolean;
  timerSeconds: number;         // total duration configured
  timerStartedAt: number | null; // epoch ms when timer last started
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
  // ── Timer actions ──────────────────────────────────────────────────────────
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: (seconds?: number) => void;
  // ── Socket / room ──────────────────────────────────────────────────────────
  roomCode: string | null;
  roomJoined: boolean;
  wsConnected: boolean;
  wsError: string | null;
  joinRoom: (code: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNextActiveId(players: Player[], fromId: number | null): number | null {
  const active = players.filter(p => p.active);
  if (active.length === 0) return null;
  if (fromId === null) return active[0].id;
  const idx = active.findIndex(p => p.id === fromId);
  return active[(idx + 1) % active.length]?.id ?? null;
}

// ── State migration ───────────────────────────────────────────────────────────

function migrateState(parsed: Record<string, unknown>): GameState {
  const rawPlayers = (
    (parsed.players as unknown[] | undefined) ?? (INITIAL_PLAYERS as unknown[])
  ) as Array<Record<string, unknown>>;
  let players: Player[] = rawPlayers.map((p, i: number) => ({
    id: (p['id'] as number) ?? i + 1,
    name: (p['name'] as string) ?? `Player ${i + 1}`,
    avatarId: (p['avatarId'] as number) ?? ((i % 12) + 1),
    points: (p['points'] as number) ?? 0,
    lives: (p['lives'] as number) ?? DEFAULT_LIVES,
    active: p['active'] !== undefined
      ? Boolean(p['active'])
      : (p['status'] === 'ACTIVE' || p['status'] === undefined),
  }));

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
    categories = Array.from(new Set(questions.map(q => q.category))).sort();
  }

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
    timerActive: (parsed.timerActive as boolean) ?? false,
    timerSeconds: (parsed.timerSeconds as number) ?? 30,
    timerStartedAt: (parsed.timerStartedAt as number | null) ?? null,
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
  timerActive: false,
  timerSeconds: 30,
  timerStartedAt: null,
};

// ── Context ───────────────────────────────────────────────────────────────────

const GameContext = createContext<GameContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEY_STATE      = 'game_state';
const STORAGE_KEY_ADMIN      = 'last_standing_room';        // localStorage  (admin)
const STORAGE_KEY_AUDIENCE   = 'last_standing_room';        // sessionStorage (audience)
const STORAGE_KEY_OWNER_TOKEN = 'last_standing_owner_token'; // localStorage  (admin only)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATE);
      if (saved) return migrateState(JSON.parse(saved));
    } catch { /* ignore */ }
    return INITIAL_STATE;
  });

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
    localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
  }, [state]);

  // ── Role detection ─────────────────────────────────────────────────────────
  const isAdminPage = typeof window !== 'undefined' && window.location.pathname.includes('/admin');

  // ── WebSocket refs ─────────────────────────────────────────────────────────
  const wsRef              = useRef<WebSocket | null>(null);
  const roomCodeRef        = useRef<string | null>(null);
  const isRoomCreatorRef   = useRef(false);
  const reconnectDelayRef  = useRef(1000);
  const reconnectTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef         = useRef(true);
  // Resilience: keep-alive ping + a watchdog that re-drives the room handshake
  // if the socket opens but ROOM_CREATED/ROOM_JOINED never lands (e.g. the
  // reply is dropped by a proxy). Without this the UI sticks on "connecting…".
  const heartbeatRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const joinWatchdogRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const roomEstablishedRef = useRef(false);
  const handshakeTriesRef  = useRef(0);

  // ── WebSocket state ────────────────────────────────────────────────────────
  const [roomCode,   setRoomCode]   = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return isAdminPage
      ? localStorage.getItem(STORAGE_KEY_ADMIN) ?? null
      : sessionStorage.getItem(STORAGE_KEY_AUDIENCE) ?? null;
  });
  const [roomJoined,  setRoomJoined]  = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError,     setWsError]     = useState<string | null>(null);

  // Keep roomCodeRef in sync
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);

  // ── WS push helper ─────────────────────────────────────────────────────────
  const pushState = (newState: GameState) => {
    const ws   = wsRef.current;
    const code = roomCodeRef.current;
    if (ws?.readyState === WebSocket.OPEN && code && isRoomCreatorRef.current) {
      ws.send(JSON.stringify({ type: 'STATE_UPDATE', roomCode: code, state: newState }));
    }
  };

  const sendEffect = (
    effect: 'CONFETTI' | 'FANFARE' | 'WRONG' | 'READ_QUESTION' | 'REVEAL',
    payload?: { questionId?: number | string },
  ) => {
    // Play locally on the admin page.
    // The server excludes the sender from EFFECT fan-out, so without this
    // the admin would hear no audio feedback after removing BroadcastChannel.
    // CONFETTI is handled separately at call sites (preserving animation params),
    // so only FANFARE and WRONG need the local fallback here.
    if (effect === 'FANFARE') playFanfare();
    if (effect === 'WRONG')   playWrong();
    if (effect === 'REVEAL')  playReveal();
    // NOTE: READ_QUESTION is deliberately NOT played locally. Host and audience
    // are usually in the same room, so playing it on both devices sounds like
    // an echo. Only the audience screen narrates the question.
    // Fan out to audience via WebSocket
    const ws   = wsRef.current;
    const code = roomCodeRef.current;
    if (ws?.readyState === WebSocket.OPEN && code && isRoomCreatorRef.current) {
      ws.send(JSON.stringify({ type: 'EFFECT', roomCode: code, effect, ...payload }));
    }
  };

  // ── WebSocket connect / reconnect ──────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      if (!mountedRef.current) return;
      if (wsRef.current?.readyState === WebSocket.OPEN ||
          wsRef.current?.readyState === WebSocket.CONNECTING) return;

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws    = new WebSocket(`${proto}//${window.location.host}/ws`);
      wsRef.current = ws;

      // (Re)drives the room handshake for the current role. Safe to call
      // repeatedly: admin re-creates/re-joins, audience re-joins only if it
      // already has a code. The server always answers ROOM_* or ERROR, so the
      // watchdog below stops as soon as the room is actually established.
      const sendHandshake = () => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const storedCode = isAdminPage
          ? localStorage.getItem(STORAGE_KEY_ADMIN)
          : sessionStorage.getItem(STORAGE_KEY_AUDIENCE);

        if (storedCode) {
          // Try to rejoin the room we were in. Admin includes the
          // server-issued owner token so the server can restore creator
          // authority without a fresh CREATE_ROOM.
          const ownerToken = isAdminPage
            ? (localStorage.getItem(STORAGE_KEY_OWNER_TOKEN) ?? '')
            : '';
          ws.send(JSON.stringify({ type: 'JOIN_ROOM', roomCode: storedCode, ownerToken }));
        } else if (isAdminPage) {
          // Admin with no stored code: create a fresh room
          ws.send(JSON.stringify({ type: 'CREATE_ROOM', state: stateRef.current }));
        }
        // Audience with no stored code: wait for joinRoom() to be called
      };

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }
        setWsConnected(true);
        setWsError(null);
        reconnectDelayRef.current = 1000;
        roomEstablishedRef.current = false;
        handshakeTriesRef.current = 0;

        sendHandshake();

        // Keep-alive: some proxies (incl. Replit's preview) cull idle sockets.
        // The server replies PONG, which we simply ignore.
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        heartbeatRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 25000);

        // Watchdog: if the socket is open but the room never comes up, the
        // socket may be "open but dead" (round-trips silently dropped by the
        // proxy) — resending on it does nothing, which is the "green wifi +
        // connecting… forever" state. So: retry the handshake once, and if it
        // still hasn't landed, force-close the socket. onclose then reconnects
        // with a fresh, live socket — the same recovery a manual refresh gives,
        // but automatic.
        if (joinWatchdogRef.current) clearInterval(joinWatchdogRef.current);
        joinWatchdogRef.current = setInterval(() => {
          if (roomEstablishedRef.current) {
            if (joinWatchdogRef.current) clearInterval(joinWatchdogRef.current);
            joinWatchdogRef.current = null;
            return;
          }
          handshakeTriesRef.current += 1;
          if (handshakeTriesRef.current >= 2) {
            // Two tries (~6s) with no room → drop this socket and get a new one.
            handshakeTriesRef.current = 0;
            try { ws.close(); } catch { /* onclose handles reconnect */ }
            return;
          }
          sendHandshake();
        }, 3000);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        let msg: Record<string, unknown>;
        try { msg = JSON.parse(event.data as string) as Record<string, unknown>; }
        catch { return; }

        switch (msg.type) {
          case 'ROOM_CREATED': {
            isRoomCreatorRef.current = true;
            roomEstablishedRef.current = true;
            const code = msg.roomCode as string;
            const ownerToken = String(msg.ownerToken ?? '');
            roomCodeRef.current = code;
            setRoomCode(code);
            setRoomJoined(true);
            localStorage.setItem(STORAGE_KEY_ADMIN, code);
            // Store the server-issued owner token so we can prove creator
            // identity after a WebSocket reconnect.
            if (ownerToken) localStorage.setItem(STORAGE_KEY_OWNER_TOKEN, ownerToken);
            break;
          }
          case 'ROOM_JOINED': {
            roomEstablishedRef.current = true;
            const code = msg.roomCode as string;
            roomCodeRef.current = code;
            setRoomCode(code);
            setRoomJoined(true);
            if (isAdminPage) {
              // Admin rejoined their own room — push current local state to update server
              isRoomCreatorRef.current = true;
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'STATE_UPDATE', roomCode: code, state: stateRef.current }));
              }
            } else {
              // Audience: apply the server's authoritative state
              const serverState = migrateState(msg.state as Record<string, unknown>);
              setState(serverState);
              localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(serverState));
              sessionStorage.setItem(STORAGE_KEY_AUDIENCE, code);
            }
            break;
          }
          case 'SYNC': {
            // Only audience clients receive this (server excludes sender)
            const serverState = migrateState(msg.state as Record<string, unknown>);
            setState(serverState);
            localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(serverState));
            break;
          }
          case 'EFFECT': {
            const eff = msg.effect as string;
            if (eff === 'CONFETTI') confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            if (eff === 'FANFARE')  playFanfare();
            if (eff === 'WRONG')    playWrong();
            if (eff === 'REVEAL')   playReveal();
            if (eff === 'READ_QUESTION' && msg.questionId !== undefined) {
              playQuestionNarration(msg.questionId as number | string);
            }
            break;
          }
          case 'ERROR': {
            const errMsg = msg.message as string;
            console.warn('[WS] Server error:', errMsg);
            setWsError(errMsg);
            if (isAdminPage) {
              // Room not found (server restarted) — create a fresh room
              localStorage.removeItem(STORAGE_KEY_ADMIN);
              roomCodeRef.current = null;
              setRoomCode(null);
              setRoomJoined(false);
              isRoomCreatorRef.current = false;
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'CREATE_ROOM', state: stateRef.current }));
              }
            } else {
              // Audience: stored room code is stale — clear it, show join screen again
              sessionStorage.removeItem(STORAGE_KEY_AUDIENCE);
              roomCodeRef.current = null;
              setRoomCode(null);
              setRoomJoined(false);
            }
            break;
          }
        }
      };

      ws.onclose = () => {
        roomEstablishedRef.current = false;
        if (heartbeatRef.current)    { clearInterval(heartbeatRef.current);    heartbeatRef.current = null; }
        if (joinWatchdogRef.current) { clearInterval(joinWatchdogRef.current); joinWatchdogRef.current = null; }
        if (!mountedRef.current) return;
        setWsConnected(false);
        setRoomJoined(false);
        wsRef.current = null;
        // Exponential back-off, max 5 s
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 1.5, 5000);
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        setWsError('WebSocket connection error');
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (heartbeatRef.current)    clearInterval(heartbeatRef.current);
      if (joinWatchdogRef.current) clearInterval(joinWatchdogRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect loop on intentional unmount
        wsRef.current.close();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-load questions ────────────────────────────────────────────────────
  // Priority: 1) server-persisted store (cross-device)
  //           2) static xlsx bundled with the app (single-device fallback)
  useEffect(() => {
    if (stateRef.current.questionsSource !== 'none') return;

    const applyQuestions = (questions: Question[], categories: string[], source: GameState['questionsSource']) => {
      setState(prev => {
        if (prev.questionsSource !== 'none') return prev;
        const next: GameState = { ...prev, questions, categories, questionsSource: source };
        localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(next));
        pushState(next);
        return next;
      });
    };

    // 1. Try server store
    fetch('/api/data')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data: { questions: Question[]; categories: string[] }) => {
        if (!data.questions?.length) throw new Error('Server store empty');
        console.log(`[Auto-load] Loaded ${data.questions.length} questions from server store`);
        applyQuestions(data.questions, data.categories ?? [], 'default');
      })
      .catch(() => {
        // 2. Fall back to the static xlsx bundled with the app
        fetch('/data/The_Last_Standing_Questions_EN.xlsx')
          .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
          .then(buf => {
            const { questions, categories, errors } = parseExcelBuffer(buf);
            if (errors.length) console.warn('[Auto-load] Excel errors:', errors);
            if (questions.length) applyQuestions(questions, categories, 'default');
          })
          .catch(err => console.warn('[Auto-load] Default questions not found:', err));
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Core broadcast ─────────────────────────────────────────────────────────

  const broadcast = (newState: GameState) => {
    setState(newState);
    localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(newState));
    pushState(newState);
  };

  // ── joinRoom (called by audience join screen) ──────────────────────────────

  const joinRoom = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || trimmed.length !== 4) return;
    sessionStorage.setItem(STORAGE_KEY_AUDIENCE, trimmed);
    roomCodeRef.current = trimmed;
    setRoomCode(trimmed);
    setWsError(null);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'JOIN_ROOM', roomCode: trimmed }));
    }
  };

  // ── Game actions ───────────────────────────────────────────────────────────

  const setRound = (id: number) => {
    const active = state.players.filter(p => p.active);
    broadcast({
      ...state,
      roundId: id,
      currentQuestion: null,
      status: 'WAITING',
      questionScored: false,
      timerActive: false,
      timerStartedAt: null,
      currentPlayerId: active[0]?.id ?? null,
    });
  };

  const setQuestion = (id: number) => {
    const question = state.questions.find(q => q.id === id) ?? null;
    if (!question) return;
    const used = state.usedQuestionIds.includes(id)
      ? state.usedQuestionIds
      : [...state.usedQuestionIds, id];
    broadcast({
      ...state,
      currentQuestion: question,
      status: 'READING',
      questionScored: false,
      usedQuestionIds: used,
      timerActive: false,
      timerStartedAt: null,
    });
    // Read the question aloud shortly after it appears on screen.
    stopQuestionNarration();
    window.setTimeout(() => sendEffect('READ_QUESTION', { questionId: id }), 1000);
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
      timerActive: false,
      timerStartedAt: null,
    });
    // Read the question aloud shortly after it appears on screen.
    stopQuestionNarration();
    window.setTimeout(() => sendEffect('READ_QUESTION', { questionId: q.id }), 1000);
  };

  const revealAnswer = () => {
    // Pause timer when revealing
    const timerSeconds = state.timerActive && state.timerStartedAt
      ? Math.max(0, state.timerSeconds - Math.floor((Date.now() - state.timerStartedAt) / 1000))
      : state.timerSeconds;
    const next: GameState = {
      ...state,
      status: 'ANSWER_REVEALED',
      timerActive: false,
      timerStartedAt: null,
      timerSeconds,
    };
    broadcast(next);
    sendEffect('CONFETTI');
    sendEffect('REVEAL');
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
    sendEffect('FANFARE');
  };

  const markWrong = () => {
    if (!state.currentPlayerId || !state.currentQuestion || state.questionScored || state.gameOver) return;
    sendEffect('WRONG');
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
        sendEffect('CONFETTI');
      }
      broadcast({
        ...state,
        players: newPlayers,
        questionScored: true,
        gameOver: true,
        winnerId: winner?.id ?? null,
        currentPlayerId: winner?.id ?? null,
        timerActive: false,
        timerStartedAt: null,
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
    setState(prev => {
      const resetPlayers = prev.players.map(p => ({
        ...p, points: 0, lives: DEFAULT_LIVES, active: true,
      }));
      const active = resetPlayers.filter(p => p.active);
      const next: GameState = {
        ...prev,
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
        timerActive: false,
        timerSeconds: 30,
        timerStartedAt: null,
      };
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(next));
      pushState(next);
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
    // Persist to server so every device gets these questions on next load
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: newQuestions, categories: newCategories }),
    })
      .then(r => r.json())
      .then((d: { ok: boolean; count: number }) =>
        console.log(`[Persist] Saved ${d.count} questions to server`),
      )
      .catch(err => console.warn('[Persist] Failed to save questions to server:', err));
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

  // ── Timer actions ──────────────────────────────────────────────────────────

  const startTimer = () => {
    broadcast({ ...state, timerActive: true, timerStartedAt: Date.now() });
  };

  const pauseTimer = () => {
    const remaining = state.timerActive && state.timerStartedAt
      ? Math.max(0, state.timerSeconds - Math.floor((Date.now() - state.timerStartedAt) / 1000))
      : state.timerSeconds;
    broadcast({ ...state, timerActive: false, timerStartedAt: null, timerSeconds: remaining });
  };

  const resetTimer = (seconds = 30) => {
    broadcast({ ...state, timerActive: false, timerStartedAt: null, timerSeconds: seconds });
  };

  // ── Context value ──────────────────────────────────────────────────────────

  return (
    <GameContext.Provider value={{
      ...state,
      setRound, setQuestion, drawQuestion, revealAnswer,
      markCorrect, markWrong, setCurrentPlayer, nextPlayer, setCategory,
      updatePlayer, resetGame, broadcast, importQuestions, importPlayers,
      startTimer, pauseTimer, resetTimer,
      roomCode, roomJoined, wsConnected, wsError, joinRoom,
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
