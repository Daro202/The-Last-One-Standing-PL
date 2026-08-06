import { useGame } from "@/lib/game-state";
import { ROUNDS } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { Arena } from "@/components/arena/Arena";

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:        "#0A0A0B",   // deep graphite
  warmWhite: "#F1EEE8",
  bronze:    "#C7B18E",
  muted:     "#8A7865",
  dim:       "#3A3A3E",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
};
const sans: React.CSSProperties = {
  fontFamily: "'Inter', system-ui, sans-serif",
};

// Round-level header divider opacity
const ROUND_DIVIDER: Record<string, number> = {
  "WARM UP": 0.14, "SURVIVAL": 0.10, "MANDATORY": 0.07, "BATTLE": 0.05,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AudienceView() {
  const {
    roundId, currentQuestion, status, players,
    currentPlayerId, usedQuestionIds, questions,
    selectedCategory, gameOver, winnerId,
  } = useGame();

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
          1 · HEADER — 10 % of screen height
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
          <span
            style={{
              ...serif,
              color: C.muted,
              fontSize: "clamp(13px, 1.2vw, 18px)",
              fontWeight: 500,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
            }}
          >
            The Last Standing
          </span>

          <span
            style={{
              display: "inline-block",
              width: 1,
              height: 14,
              background: C.dim,
              verticalAlign: "middle",
            }}
          />

          <span
            style={{
              ...serif,
              color: C.warmWhite,
              fontSize: "clamp(13px, 1.2vw, 18px)",
              fontStyle: "italic",
              letterSpacing: "0.06em",
              opacity: 0.85,
            }}
          >
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: C.bronze,
              boxShadow: `0 0 8px ${C.bronze}`,
            }}
          />
          <span
            style={{
              ...sans,
              color: C.warmWhite,
              fontSize: "clamp(12px, 1.1vw, 16px)",
              letterSpacing: "0.08em",
              opacity: 0.75,
            }}
          >
            {activePlayers.length} standing
          </span>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          2 · QUESTION AREA — 35 % of screen height
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
        <AnimatePresence mode="wait">

          {/* ── Game Over ─────────────────────────────────────────────── */}
          {gameOver ? (
            <motion.div
              key="gameover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              style={{ textAlign: "center" }}
            >
              {/* Ambient light above winner */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "50%",
                  height: "100%",
                  background:
                    "radial-gradient(ellipse at 50% 0%, rgba(199,177,142,0.10) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                style={{
                  ...serif,
                  color: C.muted,
                  fontSize: "clamp(0.85rem, 1.2vw, 1.1rem)",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                The Last Standing
              </motion.p>

              {winner && (
                <>
                  <motion.h2
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.9 }}
                    style={{
                      ...sans,
                      color: C.warmWhite,
                      fontSize: "clamp(3rem, 6.5vw, 5.5rem)",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                      marginBottom: 16,
                    }}
                  >
                    {winner.name}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.8 }}
                    style={{
                      ...sans,
                      color: C.bronze,
                      fontSize: "clamp(1.1rem, 2vw, 1.8rem)",
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
            /* ── Waiting ────────────────────────────────────────────── */
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              style={{ textAlign: "center" }}
            >
              <h2
                style={{
                  ...serif,
                  color: `rgba(241,238,232,0.08)`,
                  fontSize: "clamp(2.8rem, 5.5vw, 5rem)",
                  fontWeight: 500,
                  letterSpacing: "0.03em",
                  lineHeight: 1.1,
                  userSelect: "none",
                }}
              >
                Waiting for question
              </h2>
              <p
                style={{
                  ...sans,
                  color: `rgba(138,120,101,0.28)`,
                  fontSize: "clamp(10px, 1vw, 13px)",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  marginTop: 18,
                }}
              >
                Host is preparing
              </p>
            </motion.div>

          ) : (
            /* ── Question ────────────────────────────────────────────── */
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
              {/* Type label */}
              <p
                style={{
                  ...sans,
                  color: C.muted,
                  fontSize: "clamp(10px, 0.9vw, 13px)",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  marginBottom: "clamp(14px, 2vh, 24px)",
                  opacity: 0.8,
                }}
              >
                {currentQuestion.type === "TRUE_FALSE" ? "True · False" : "Open question"}
              </p>

              {/* ── Question text — dominant element ── */}
              <h2
                style={{
                  ...sans,
                  color: C.warmWhite,
                  fontSize: "clamp(1.8rem, 3vw, 3.2rem)",
                  fontWeight: 600,
                  lineHeight: 1.3,
                  textAlign: "center",
                  letterSpacing: "-0.01em",
                  maxWidth: 1050,
                }}
              >
                {currentQuestion.text}
              </h2>

              {/* True / False options — visible before reveal, restrained */}
              {currentQuestion.type === "TRUE_FALSE" && status !== "ANSWER_REVEALED" && (
                <div
                  style={{
                    display: "flex",
                    gap: "clamp(20px, 3vw, 48px)",
                    marginTop: "clamp(20px, 3vh, 36px)",
                  }}
                >
                  {["True", "False"].map(opt => (
                    <div
                      key={opt}
                      style={{
                        padding: "10px 40px",
                        border: "1px solid rgba(138,120,101,0.25)",
                        color: "rgba(241,238,232,0.20)",
                        fontSize: "clamp(1.1rem, 1.5vw, 1.5rem)",
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        ...sans,
                        userSelect: "none",
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Answer reveal — inline bronze text, no border box ── */}
              <AnimatePresence>
                {status === "ANSWER_REVEALED" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{
                      marginTop: "clamp(14px, 2.5vh, 28px)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    {/* Thin separator */}
                    <div
                      style={{
                        width: 48,
                        height: 1,
                        background: `linear-gradient(90deg, transparent, rgba(199,177,142,0.5), transparent)`,
                      }}
                    />
                    {/* Answer — secondary to question, no box */}
                    <p
                      style={{
                        ...sans,
                        color: C.bronze,
                        fontSize: "clamp(1.4rem, 2.4vw, 2.6rem)",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        textAlign: "center",
                      }}
                    >
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
          3 · PLAYER ARENA — 50 % of screen height
      ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          flexShrink: 0,
          height: "55vh",    // slight extra so arena fills to bottom at 1080p
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
