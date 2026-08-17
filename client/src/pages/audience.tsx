import { useState, useEffect, useRef } from "react";
import { useGame } from "@/lib/game-state";
import { ROUNDS } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { Arena } from "@/components/arena/Arena";

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:        "#0A0A0B",
  warmWhite: "#F1EEE8",
  bronze:    "#C7B18E",
  muted:     "#8A7865",
  dim:       "#3A3A3E",
};

const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif" };
const sans:  React.CSSProperties = { fontFamily: "'Inter', system-ui, sans-serif" };

const ROUND_DIVIDER: Record<string, number> = {
  "WARM UP": 0.14, "SURVIVAL": 0.10, "MANDATORY": 0.07, "BATTLE": 0.05,
};

// ── Join screen ───────────────────────────────────────────────────────────────

function JoinScreen({ onJoin, wsConnected, wsError }: {
  onJoin: (code: string) => void;
  wsConnected: boolean;
  wsError: string | null;
}) {
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // If server returns error, surface it
  useEffect(() => {
    if (wsError) setLocalError(wsError);
  }, [wsError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length !== 4 || !/^\d{4}$/.test(trimmed)) {
      setLocalError('Enter the 4-digit room code shown on the admin screen.');
      return;
    }
    setLocalError('');
    onJoin(trimmed);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#08080C",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
        padding: 40,
      }}
    >
      {/* Ambient centre glow */}
      <div aria-hidden style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(199,177,142,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Title */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={{
          ...serif,
          color: C.muted,
          fontSize: "clamp(13px, 1.4vw, 20px)",
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}>
          The Last One Standing
        </p>
        <h1 style={{
          ...serif,
          color: C.warmWhite,
          fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
          fontWeight: 600,
          letterSpacing: "0.04em",
          lineHeight: 1,
        }}>
          Join Game
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        width: "100%",
        maxWidth: 380,
      }}>
        <div style={{ width: "100%", textAlign: "center" }}>
          <label style={{
            ...sans,
            display: "block",
            color: C.muted,
            fontSize: 11,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}>
            Room Code
          </label>

          {/* 4-digit input — theatrical large style */}
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={code}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 4);
              setCode(v);
              setLocalError('');
            }}
            placeholder="0000"
            style={{
              ...sans,
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: localError
                ? "1px solid rgba(220,80,80,0.60)"
                : "1px solid rgba(199,177,142,0.25)",
              borderRadius: 4,
              color: C.warmWhite,
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 700,
              letterSpacing: "0.5em",
              padding: "16px 24px",
              textAlign: "center",
              outline: "none",
              caretColor: C.bronze,
              transition: "border-color 0.2s",
            }}
            onFocus={e => (e.target.style.borderColor = "rgba(199,177,142,0.55)")}
            onBlur={e => (e.target.style.borderColor = localError
              ? "rgba(220,80,80,0.60)"
              : "rgba(199,177,142,0.25)"
            )}
          />

          {localError && (
            <p style={{
              ...sans,
              color: "rgba(220,100,100,0.85)",
              fontSize: 12,
              letterSpacing: "0.06em",
              marginTop: 10,
            }}>
              {localError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={code.length !== 4 || !wsConnected}
          style={{
            ...sans,
            width: "100%",
            padding: "14px 24px",
            background: code.length === 4 && wsConnected
              ? "linear-gradient(135deg, rgba(199,177,142,0.18) 0%, rgba(199,177,142,0.10) 100%)"
              : "rgba(255,255,255,0.04)",
            border: code.length === 4 && wsConnected
              ? "1px solid rgba(199,177,142,0.40)"
              : "1px solid rgba(255,255,255,0.08)",
            borderRadius: 4,
            color: code.length === 4 && wsConnected ? C.warmWhite : "rgba(255,255,255,0.25)",
            fontSize: "clamp(13px, 1.2vw, 16px)",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            cursor: code.length === 4 && wsConnected ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}
        >
          {!wsConnected ? "Connecting…" : "Join"}
        </button>
      </form>

      {/* Connection status dot */}
      <div style={{
        position: "absolute",
        bottom: 28,
        right: 32,
        display: "flex",
        alignItems: "center",
        gap: 8,
        zIndex: 1,
      }}>
        <div style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: wsConnected ? "#4ADE80" : "#6B7280",
          boxShadow: wsConnected ? "0 0 8px rgba(74,222,128,0.6)" : "none",
          transition: "all 0.5s",
        }} />
        <span style={{
          ...sans,
          color: "rgba(255,255,255,0.25)",
          fontSize: 10,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}>
          {wsConnected ? "connected" : "connecting…"}
        </span>
      </div>
    </div>
  );
}

// ── Timer countdown hook ──────────────────────────────────────────────────────

function useTimerDisplay(timerActive: boolean, timerSeconds: number, timerStartedAt: number | null) {
  const [display, setDisplay] = useState(timerSeconds);

  useEffect(() => {
    if (!timerActive || timerStartedAt === null) {
      setDisplay(timerSeconds);
      return;
    }
    const tick = () => {
      setDisplay(Math.max(0, timerSeconds - Math.floor((Date.now() - timerStartedAt) / 1000)));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timerActive, timerSeconds, timerStartedAt]);

  return display;
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function AudienceView() {
  const {
    roundId, currentQuestion, status, players,
    currentPlayerId, usedQuestionIds, questions,
    selectedCategory, gameOver, winnerId,
    timerActive, timerSeconds, timerStartedAt,
    roomJoined, wsConnected, wsError, joinRoom,
  } = useGame();

  const timeLeft = useTimerDisplay(timerActive, timerSeconds, timerStartedAt);

  const currentRound  = ROUNDS.find(r => r.id === roundId);
  const roundName     = currentRound?.name ?? "WARM UP";
  const activePlayers = players.filter(p => p.active);
  const winner        = players.find(p => p.id === winnerId) ?? null;

  const roundQuestions = questions.filter(q => q.round === roundName);
  const questionNumber = currentQuestion
    ? usedQuestionIds.indexOf(currentQuestion.id) + 1
    : 0;
  const totalQ = roundQuestions.length;

  const dividerAlpha = ROUND_DIVIDER[roundName] ?? 0.10;

  // ── Join screen — shown until audience joins a room ──────────────────────
  if (!roomJoined) {
    return <JoinScreen onJoin={joinRoom} wsConnected={wsConnected} wsError={wsError} />;
  }

  // ── Main audience view ───────────────────────────────────────────────────
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          1 · HEADER — 10 vh
      ══════════════════════════════════════════════════════════════════ */}
      <header
        style={{
          flexShrink: 0,
          height: "10vh",
          minHeight: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: "clamp(24px, 3vw, 56px)",
          paddingRight: "clamp(24px, 3vw, 56px)",
          borderBottom: `1px solid rgba(255,255,255,${dividerAlpha})`,
          transition: "border-color 1s ease",
        }}
      >
        {/* Left: title + round */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
          <span style={{
            ...serif,
            color: "#9A8E7E",
            fontSize: "clamp(17px, 1.6vw, 26px)",
            fontWeight: 600,
            letterSpacing: "0.20em",
            textTransform: "uppercase",
          }}>
            The Last One Standing
          </span>
          <span style={{
            display: "inline-block",
            width: 1,
            height: 18,
            background: "rgba(255,255,255,0.18)",
            verticalAlign: "middle",
          }} />
          <span style={{
            ...serif,
            color: C.warmWhite,
            fontSize: "clamp(17px, 1.6vw, 26px)",
            fontStyle: "italic",
            letterSpacing: "0.06em",
          }}>
            {roundName}
          </span>
        </div>

        {/* Centre: question number */}
        <AnimatePresence mode="wait">
          {currentQuestion && questionNumber > 0 && (
            <motion.p
              key={questionNumber}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              style={{
                ...sans,
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                color: C.muted,
                fontSize: "clamp(11px, 1vw, 14px)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Question {questionNumber}{totalQ > 0 ? ` · ${totalQ}` : ""}
              {selectedCategory ? ` · ${selectedCategory}` : ""}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Right: active count */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "#DCC080",
            boxShadow: "0 0 10px rgba(220,192,128,0.8)",
          }} />
          <span style={{
            ...sans,
            color: C.warmWhite,
            fontSize: "clamp(16px, 1.5vw, 22px)",
            fontWeight: 600,
            letterSpacing: "0.06em",
          }}>
            {activePlayers.length}{" "}
            <span style={{ opacity: 0.55, fontWeight: 400 }}>standing</span>
          </span>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          2 · QUESTION AREA — 35 vh
      ══════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          flexShrink: 0,
          height: "35vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 clamp(40px, 6vw, 120px)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Timer overlay (top-right of question area) ── */}
        <AnimatePresence>
          {(timerActive || timeLeft !== timerSeconds) && currentQuestion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                position: "absolute",
                top: "12%",
                right: "clamp(40px, 5vw, 100px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <span style={{
                ...sans,
                fontSize: "clamp(2rem, 4vw, 4.5rem)",
                fontWeight: 800,
                fontVariantNumeric: "tabular-nums",
                color: timeLeft <= 5 && timerActive
                  ? "#EF4444"
                  : timeLeft <= 10
                  ? "#F97316"
                  : "rgba(199,177,142,0.70)",
                lineHeight: 1,
                transition: "color 0.3s",
                textShadow: timeLeft <= 5 && timerActive
                  ? "0 0 20px rgba(239,68,68,0.4)"
                  : "none",
              }}>
                {timeLeft}
              </span>
              <span style={{
                ...sans,
                fontSize: 9,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "rgba(138,120,101,0.40)",
                marginTop: 2,
              }}>
                sec
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">

          {/* ── Game Over ── */}
          {gameOver ? (
            <motion.div
              key="gameover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              style={{ textAlign: "center" }}
            >
              <div aria-hidden style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "50%",
                height: "100%",
                background: "radial-gradient(ellipse at 50% 0%, rgba(199,177,142,0.10) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                style={{
                  ...serif, color: C.muted,
                  fontSize: "clamp(0.85rem, 1.2vw, 1.1rem)",
                  letterSpacing: "0.32em", textTransform: "uppercase", marginBottom: 16,
                }}
              >
                The Last One Standing
              </motion.p>
              {winner && (
                <>
                  <motion.h2
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.9 }}
                    style={{
                      ...sans, color: C.warmWhite,
                      fontSize: "clamp(3rem, 6.5vw, 5.5rem)",
                      fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 16,
                    }}
                  >
                    {winner.name}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.8 }}
                    style={{
                      ...sans, color: C.bronze,
                      fontSize: "clamp(1.1rem, 2vw, 1.8rem)",
                      fontWeight: 500, letterSpacing: "0.12em",
                    }}
                  >
                    {winner.points} points
                  </motion.p>
                </>
              )}
            </motion.div>

          ) : !currentQuestion ? (
            /* ── Waiting ── */
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              style={{ textAlign: "center" }}
            >
              <h2 style={{
                ...serif,
                color: "rgba(241,238,232,0.08)",
                fontSize: "clamp(2.8rem, 5.5vw, 5rem)",
                fontWeight: 500, letterSpacing: "0.03em", lineHeight: 1.1, userSelect: "none",
              }}>
                Waiting for question
              </h2>
              <p style={{
                ...sans,
                color: "rgba(138,120,101,0.28)",
                fontSize: "clamp(10px, 1vw, 13px)",
                letterSpacing: "0.28em", textTransform: "uppercase", marginTop: 18,
              }}>
                Host is preparing
              </p>
            </motion.div>

          ) : (
            /* ── Question ── */
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                width: "100%",
                maxWidth: 1100,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0,
              }}
            >
              <p style={{
                ...sans, color: C.muted,
                fontSize: "clamp(10px, 0.9vw, 13px)",
                letterSpacing: "0.24em", textTransform: "uppercase",
                marginBottom: "clamp(14px, 2vh, 24px)", opacity: 0.8,
              }}>
                {currentQuestion.type === "TRUE_FALSE" ? "Prawda · Fałsz" : "Pytanie otwarte"}
              </p>

              <h2 style={{
                ...sans, color: C.warmWhite,
                fontSize: "clamp(1.8rem, 3vw, 3.2rem)",
                fontWeight: 600, lineHeight: 1.3,
                textAlign: "center", letterSpacing: "-0.01em", maxWidth: 1050,
              }}>
                {currentQuestion.text}
              </h2>

              {currentQuestion.type === "TRUE_FALSE" && status !== "ANSWER_REVEALED" && (
                <div style={{
                  display: "flex",
                  gap: "clamp(20px, 3vw, 48px)",
                  marginTop: "clamp(20px, 3vh, 36px)",
                }}>
                  {["Prawda", "Fałsz"].map(opt => (
                    <div key={opt} style={{
                      padding: "10px 40px",
                      border: "1px solid rgba(138,120,101,0.25)",
                      color: "rgba(241,238,232,0.20)",
                      fontSize: "clamp(1.1rem, 1.5vw, 1.5rem)",
                      fontWeight: 600, letterSpacing: "0.14em",
                      ...sans, userSelect: "none",
                    }}>
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {/* Answer reveal */}
              <AnimatePresence>
                {status === "ANSWER_REVEALED" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{
                      marginTop: "clamp(14px, 2.5vh, 28px)",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                    }}
                  >
                    <div style={{
                      width: 48, height: 1,
                      background: "linear-gradient(90deg, transparent, rgba(199,177,142,0.5), transparent)",
                    }} />
                    <p style={{
                      ...sans, color: C.bronze,
                      fontSize: "clamp(1.4rem, 2.4vw, 2.6rem)",
                      fontWeight: 600, letterSpacing: "0.04em", textAlign: "center",
                    }}>
                      {currentQuestion.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3 · PLAYER ARENA — 55 vh
      ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          flexShrink: 0,
          height: "55vh",
          minHeight: 380,
          position: "relative",
          borderTop: `1px solid rgba(255,255,255,${dividerAlpha * 0.7})`,
          overflow: "visible",
          transition: "border-color 1s ease",
        }}
      >
        <Arena
          players={players}
          currentPlayerId={currentPlayerId}
          roundName={roundName}
        />
      </div>
    </div>
  );
}
