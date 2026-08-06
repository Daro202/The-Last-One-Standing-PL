import { useGame } from "@/lib/game-state";
import { ROUNDS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

export default function AudienceView() {
  const { roundId, currentQuestion, status, players, currentPlayerId, usedQuestionIds, dynamicQuestions, gameOver, winnerId } = useGame();

  const currentRound = ROUNDS.find(r => r.id === roundId);
  const activePlayers = players.filter(p => p.status === 'ACTIVE');
  const currentPlayer = players.find(p => p.id === currentPlayerId) ?? null;
  const winner = players.find(p => p.id === winnerId) ?? null;

  const roundKey = roundId.toString();
  const roundQuestions = dynamicQuestions?.[roundKey] ?? [];
  const usedIds = usedQuestionIds?.[roundKey] ?? [];
  const questionNumber = currentQuestion ? usedIds.indexOf(currentQuestion.id) + 1 : 0;
  const totalQuestions = roundQuestions.length;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden font-display">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black animate-pulse" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex justify-between items-center p-6 md:p-10 border-b border-white/10 bg-black/50 backdrop-blur-md">
        {/* Left: player count + round */}
        <div className="flex items-center gap-5">
          <div className="bg-primary text-black font-black text-xl md:text-3xl px-4 py-2 rounded transform -skew-x-12 shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
            {activePlayers.length} LEFT
          </div>
          <h1 className="text-3xl md:text-4xl uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
            {currentRound?.name}
          </h1>
        </div>

        {/* Right: LIVE badge */}
        <div className="text-xl md:text-2xl font-mono text-primary animate-pulse">LIVE</div>
      </header>

      {/* ── Current player bar ────────────────────────────────────────────── */}
      <AnimatePresence>
        {!gameOver && currentPlayer && (
          <motion.div
            key={currentPlayer.id}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="relative z-10 flex items-center justify-between px-8 md:px-14 py-4 bg-white/5 border-b border-white/10 backdrop-blur"
          >
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-0.5">Now answering</p>
              <p className="text-2xl md:text-3xl font-black">{currentPlayer.name}</p>
            </div>
            <div className="flex items-center gap-6 font-mono text-lg md:text-xl">
              <span className="text-green-400 font-bold">{currentPlayer.points} pts</span>
              <span className="flex items-center gap-1 text-red-400">
                {Array.from({ length: currentPlayer.lives }).map((_, i) => (
                  <Heart key={i} className="w-5 h-5 md:w-6 md:h-6 fill-red-400 text-red-400" />
                ))}
                {currentPlayer.lives === 0 && <span className="text-red-500">0</span>}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 relative z-10 flex items-center justify-center p-10 md:p-20 text-center">
        <AnimatePresence mode="wait">

          {/* Game over */}
          {gameOver ? (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <h2 className="text-7xl md:text-9xl font-black text-accent drop-shadow-[0_0_40px_hsl(var(--accent)/0.8)]">
                THE LAST STANDING
              </h2>
              {winner && (
                <p className="text-4xl md:text-6xl font-bold text-white">
                  🏆 {winner.name}
                </p>
              )}
            </motion.div>
          ) : !currentQuestion ? (
            /* Waiting */
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="space-y-6"
            >
              <h2 className="text-6xl md:text-8xl font-black text-white/20 tracking-tighter animate-pulse">
                WAITING FOR QUESTION
              </h2>
              <p className="text-white/10 font-mono uppercase tracking-widest text-sm">
                Host is preparing the next question…
              </p>
            </motion.div>
          ) : (
            /* Question */
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="w-full max-w-6xl space-y-12"
            >
              {/* Question number */}
              {questionNumber > 0 && (
                <p className="text-sm font-mono text-white/30 uppercase tracking-widest">
                  Question {questionNumber} / {totalQuestions}
                </p>
              )}

              {/* Question text */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-xl opacity-50" />
                <h2 className="relative text-5xl md:text-7xl font-medium leading-tight drop-shadow-2xl">
                  {currentQuestion.text}
                </h2>
              </div>

              {/* TRUE/FALSE hint */}
              {currentQuestion.type === 'TRUE_FALSE' && status !== 'ANSWER_REVEALED' && (
                <div className="flex justify-center gap-8">
                  {['TRUE', 'FALSE'].map(opt => (
                    <div
                      key={opt}
                      className="px-10 py-4 rounded-2xl border-2 border-white/20 text-3xl font-black text-white/40 tracking-wider"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {/* Answer — only after reveal */}
              <div className="h-40 flex items-center justify-center">
                <AnimatePresence>
                  {status === 'ANSWER_REVEALED' && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="bg-accent text-accent-foreground px-12 py-6 rounded-2xl shadow-[0_0_50px_hsl(var(--accent)/0.6)]"
                    >
                      <span className="text-6xl md:text-8xl font-black tracking-wide">
                        {currentQuestion.answer}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="relative z-10 p-6 border-t border-white/10 bg-black/80 backdrop-blur">
        <div className="flex items-center justify-between">
          <p className="text-lg md:text-xl text-muted-foreground font-ui tracking-[0.2em]">
            {currentRound?.description}
          </p>
          {/* Scoreboard strip */}
          <div className="hidden md:flex items-center gap-4 flex-wrap justify-end">
            {activePlayers.map(p => (
              <div
                key={p.id}
                className={cn(
                  "text-sm font-mono px-3 py-1 rounded-lg border",
                  p.id === currentPlayerId
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-white/5 border-white/10 text-white/60"
                )}
              >
                <span className="font-bold">{p.name}</span>
                <span className="ml-2 text-green-400">{p.points}pt</span>
                <span className="ml-1 text-red-400 flex-inline items-center">
                  {Array.from({ length: p.lives }).map((_, i) => '♥').join('')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
