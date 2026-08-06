import { useGame } from "@/lib/game-state";
import { ROUNDS } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { Arena } from "@/components/arena/Arena";

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:        "#050506",
  graphite:  "#171719",
  metal:     "#242426",
  warmWhite: "#F1EEE8",
  bronze:    "#8A7865",
  accent:    "#C7B18E",
  dim:       "#39393C",
};

// Round-level atmosphere: background darkening + header accent
const ROUND_ATM: Record<string, { overlay: number; dividerOpacity: number }> = {
  "WARM UP":   { overlay: 0.00, dividerOpacity: 0.12 },
  "SURVIVAL":  { overlay: 0.03, dividerOpacity: 0.09 },
  "MANDATORY": { overlay: 0.06, dividerOpacity: 0.07 },
  "BATTLE":    { overlay: 0.10, dividerOpacity: 0.05 },
};

// ── Fonts ─────────────────────────────────────────────────────────────────────

const serifStyle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
};
const sansStyle: React.CSSProperties = {
  fontFamily: "'Inter', system-ui, sans-serif",
};

// ── Main component ────────────────────────────────────────────────────────────

export default function AudienceView() {
  const {
    roundId, currentQuestion, status, players,
    currentPlayerId, usedQuestionIds, questions,
    selectedCategory, gameOver, winnerId,
  } = useGame();

  const currentRound   = ROUNDS.find(r => r.id === roundId);
  const roundName      = currentRound?.name ?? "WARM UP";
  const activePlayers  = players.filter(p => p.active);
  const winner         = players.find(p => p.id === winnerId) ?? null;

  const roundQuestions = questions.filter(q => q.round === roundName);
  const questionNumber = currentQuestion
    ? (usedQuestionIds.indexOf(currentQuestion.id) + 1)
    : 0;
  const totalQuestions = roundQuestions.length;

  const atm = ROUND_ATM[roundName] ?? ROUND_ATM["WARM UP"];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Round atmosphere overlay ──────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(0,0,0,${atm.overlay})`,
          transition: "background 1.2s ease",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header
        style={{
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
          height: 54,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 40,
          paddingRight: 40,
          borderBottom: `0.5px solid rgba(255,255,255,${atm.dividerOpacity})`,
          background: "rgba(5,5,6,0.7)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Left: branding */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
          <span
            style={{
              ...serifStyle,
              color: C.bronze,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            The Last Standing
          </span>

          <span
            style={{
              width: 1,
              height: 14,
              background: C.dim,
              display: "inline-block",
              verticalAlign: "middle",
            }}
          />

          <span
            style={{
              ...serifStyle,
              color: C.warmWhite,
              fontSize: 13,
              fontStyle: "italic",
              letterSpacing: "0.08em",
              opacity: 0.85,
            }}
          >
            {roundName}
          </span>
        </div>

        {/* Centre: question counter */}
        <AnimatePresence mode="wait">
          {currentQuestion && questionNumber > 0 && (
            <motion.span
              key={questionNumber}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              style={{
                ...sansStyle,
                color: C.bronze,
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              Question {questionNumber}
              {totalQuestions > 0 ? ` · ${totalQuestions}` : ""}
              {selectedCategory ? ` · ${selectedCategory}` : ""}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Right: active count */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: C.accent,
              boxShadow: `0 0 6px ${C.accent}`,
              animation: "none",
            }}
          />
          <span
            style={{
              ...sansStyle,
              color: C.warmWhite,
              fontSize: 12,
              letterSpacing: "0.1em",
              opacity: 0.7,
            }}
          >
            {activePlayers.length} standing
          </span>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 80px 20px",
          overflow: "hidden",
        }}
      >
        <AnimatePresence mode="wait">

          {/* ── Game over ────────────────────────────────────────────────── */}
          {gameOver ? (
            <motion.div
              key="gameover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              style={{ textAlign: "center" }}
            >
              {/* Ceremonial top glow */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 400,
                  height: 200,
                  background: "radial-gradient(ellipse at 50% 0%, rgba(199,177,142,0.12) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                style={{
                  ...serifStyle,
                  color: C.bronze,
                  fontSize: "clamp(0.9rem, 1.2vw, 1.1rem)",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                The Last Standing
              </motion.p>

              {winner && (
                <>
                  <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.9 }}
                    style={{
                      ...sansStyle,
                      color: C.warmWhite,
                      fontSize: "clamp(3.5rem, 7vw, 6rem)",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                      marginBottom: 20,
                    }}
                  >
                    {winner.name}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    style={{
                      ...sansStyle,
                      color: C.accent,
                      fontSize: "clamp(1.2rem, 2vw, 1.8rem)",
                      fontWeight: 500,
                      letterSpacing: "0.12em",
                    }}
                  >
                    {winner.points} points
                  </motion.p>
                </>
              )}
            </motion.div>

          ) : !currentQuestion ? (
            /* ── Waiting ─────────────────────────────────────────────────── */
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{ textAlign: "center" }}
            >
              <h2
                style={{
                  ...serifStyle,
                  color: "rgba(241,238,232,0.07)",
                  fontSize: "clamp(3rem, 6vw, 5.5rem)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  lineHeight: 1.1,
                  userSelect: "none",
                }}
              >
                Waiting for question
              </h2>
              <p
                style={{
                  ...sansStyle,
                  color: "rgba(138,120,101,0.25)",
                  fontSize: 11,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  marginTop: 20,
                }}
              >
                Host is preparing
              </p>
            </motion.div>

          ) : (
            /* ── Question ────────────────────────────────────────────────── */
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              style={{
                width: "100%",
                maxWidth: 1100,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0,
              }}
            >
              {/* Question type label */}
              <p
                style={{
                  ...sansStyle,
                  color: C.bronze,
                  fontSize: 11,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  marginBottom: 28,
                  opacity: 0.75,
                }}
              >
                {currentQuestion.type === "TRUE_FALSE" ? "True · False" : "Open question"}
              </p>

              {/* Question text — primary element */}
              <h2
                style={{
                  ...sansStyle,
                  color: C.warmWhite,
                  fontSize: "clamp(1.9rem, 3.2vw, 3.4rem)",
                  fontWeight: 600,
                  lineHeight: 1.28,
                  textAlign: "center",
                  letterSpacing: "-0.01em",
                  maxWidth: 980,
                }}
              >
                {currentQuestion.text}
              </h2>

              {/* TRUE / FALSE options — shown before reveal */}
              {currentQuestion.type === "TRUE_FALSE" && status !== "ANSWER_REVEALED" && (
                <div
                  style={{
                    display: "flex",
                    gap: 40,
                    marginTop: 44,
                  }}
                >
                  {["True", "False"].map(opt => (
                    <div
                      key={opt}
                      style={{
                        padding: "12px 48px",
                        border: `1px solid rgba(138,120,101,0.28)`,
                        color: "rgba(241,238,232,0.22)",
                        fontSize: "1.4rem",
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        fontFamily: "'Inter', sans-serif",
                        userSelect: "none",
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {/* Answer reveal */}
              <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AnimatePresence>
                  {status === "ANSWER_REVEALED" && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      style={{
                        padding: "18px 64px",
                        background: "rgba(199,177,142,0.06)",
                        border: `1px solid rgba(199,177,142,0.35)`,
                        color: C.accent,
                        fontSize: "clamp(1.8rem, 3vw, 3rem)",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        fontFamily: "'Inter', sans-serif",
                        textAlign: "center",
                        boxShadow: "0 0 40px rgba(199,177,142,0.06)",
                      }}
                    >
                      {currentQuestion.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Arena ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
          overflow: "visible",
        }}
      >
        {/* Subtle top separator — fades in from the arena */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: 1,
            background: `linear-gradient(90deg,
              transparent 0%,
              rgba(138,120,101,${atm.dividerOpacity * 0.8}) 30%,
              rgba(138,120,101,${atm.dividerOpacity * 0.8}) 70%,
              transparent 100%
            )`,
            transition: "background 1.2s ease",
            pointerEvents: "none",
          }}
        />

        <Arena
          players={players}
          currentPlayerId={currentPlayerId}
          roundName={roundName}
        />
      </div>
    </div>
  );
}
