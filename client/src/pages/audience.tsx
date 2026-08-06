import { useGame } from "@/lib/game-state";
import { ROUNDS, AVATARS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

function avatarEmoji(id: number): string {
  return AVATARS.find(a => a.id === id)?.emoji ?? '👤';
}

export default function AudienceView() {
  const {
    roundId, currentQuestion, status, players,
    currentPlayerId, usedQuestionIds, questions,
    selectedCategory, gameOver, winnerId,
  } = useGame();

  const currentRound = ROUNDS.find(r => r.id === roundId);
  const activePlayers = players.filter(p => p.active);
  const currentPlayer = players.find(p => p.id === currentPlayerId) ?? null;
  const winner = players.find(p => p.id === winnerId) ?? null;

  const roundName = currentRound?.name ?? '';
  const roundQuestions = questions.filter(q => q.round === roundName);
  const questionNumber = currentQuestion
    ? usedQuestionIds.indexOf(currentQuestion.id) + 1
    : 0;
  const totalQuestions = roundQuestions.length;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden font-display">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex justify-between items-center px-8 py-5 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Game title */}
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
            THE LAST STANDING
          </h1>
          {/* Round badge */}
          <span className="bg-primary/20 border border-primary/40 text-primary font-bold text-sm px-3 py-1 rounded-full uppercase tracking-wider">
            {currentRound?.name}
          </span>
          {/* Category badge */}
          {selectedCategory && (
            <span className="bg-white/10 border border-white/20 text-white/70 text-sm px-3 py-1 rounded-full">
              {selectedCategory}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-primary text-black font-black text-lg md:text-2xl px-4 py-1.5 rounded transform -skew-x-12 shadow-[0_0_16px_hsl(var(--primary)/0.5)]">
            {activePlayers.length} LEFT
          </div>
          <div className="text-lg md:text-xl font-mono text-primary animate-pulse">LIVE</div>
        </div>
      </header>

      {/* ── Current player bar ────────────────────────────────────────────── */}
      <AnimatePresence>
        {!gameOver && currentPlayer && (
          <motion.div
            key={currentPlayer.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="relative z-10 flex items-center gap-5 px-8 md:px-14 py-4 bg-white/5 border-b border-white/10 backdrop-blur"
          >
            <span className="text-5xl md:text-6xl">{avatarEmoji(currentPlayer.avatarId)}</span>
            <div className="flex-1">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-0.5">Now answering</p>
              <p className="text-3xl md:text-4xl font-black">{currentPlayer.name}</p>
            </div>
            <div className="flex items-center gap-6 font-mono text-xl md:text-2xl">
              <span className="text-green-400 font-bold">{currentPlayer.points} pts</span>
              <span className="flex items-center gap-1 text-red-400">
                {Array.from({ length: currentPlayer.lives }).map((_, i) => (
                  <Heart key={i} className="w-6 h-6 md:w-7 md:h-7 fill-red-400 text-red-400" />
                ))}
                {currentPlayer.lives === 0 && <span className="text-red-500">0</span>}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 relative z-10 flex items-center justify-center px-10 md:px-24 py-12 text-center">
        <AnimatePresence mode="wait">

          {/* Game over */}
          {gameOver ? (
            <motion.div key="gameover"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-10"
            >
              <h2 className="text-6xl md:text-9xl font-black text-accent drop-shadow-[0_0_40px_hsl(var(--accent)/0.8)] uppercase">
                The Last Standing
              </h2>
              {winner && (
                <div className="space-y-4">
                  <span className="text-6xl md:text-8xl">{avatarEmoji(winner.avatarId)}</span>
                  <p className="text-4xl md:text-6xl font-bold text-white">{winner.name}</p>
                  <p className="text-2xl text-green-400 font-mono">{winner.points} points</p>
                </div>
              )}
            </motion.div>

          ) : !currentQuestion ? (
            /* Waiting */
            <motion.div key="waiting"
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
            <motion.div key={currentQuestion.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="w-full max-w-6xl space-y-10"
            >
              {/* Question number + type */}
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {questionNumber > 0 && (
                  <span className="text-sm font-mono text-white/30 uppercase tracking-widest">
                    Question {questionNumber}{totalQuestions > 0 ? ` / ${totalQuestions}` : ''}
                  </span>
                )}
                <span className="text-xs font-mono bg-white/10 border border-white/20 px-3 py-1 rounded-full text-white/50 uppercase tracking-wider">
                  {currentQuestion.type === 'TRUE_FALSE' ? 'True / False' : 'Open Question'}
                </span>
                {currentQuestion.category && (
                  <span className="text-xs bg-primary/20 border border-primary/30 text-primary px-3 py-1 rounded-full uppercase tracking-wider">
                    {currentQuestion.category}
                  </span>
                )}
              </div>

              {/* Question text */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-xl opacity-50" />
                <h2 className="relative text-4xl md:text-7xl font-medium leading-tight drop-shadow-2xl">
                  {currentQuestion.text}
                </h2>
              </div>

              {/* TRUE/FALSE option pills (hidden until revealed) */}
              {currentQuestion.type === 'TRUE_FALSE' && status !== 'ANSWER_REVEALED' && (
                <div className="flex justify-center gap-8">
                  {['TRUE', 'FALSE'].map(opt => (
                    <div key={opt}
                      className="px-10 py-4 rounded-2xl border-2 border-white/20 text-3xl font-black text-white/40 tracking-wider">
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {/* Answer — only after host reveals */}
              <div className="h-36 flex items-center justify-center">
                <AnimatePresence>
                  {status === 'ANSWER_REVEALED' && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', bounce: 0.5 }}
                      className="bg-accent text-accent-foreground px-12 py-6 rounded-2xl shadow-[0_0_50px_hsl(var(--accent)/0.6)]"
                    >
                      <span className="text-5xl md:text-8xl font-black tracking-wide">
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

      {/* ── Footer: scoreboard + round description ────────────────────────── */}
      <footer className="relative z-10 border-t border-white/10 bg-black/80 backdrop-blur">
        {/* All players mini scoreboard */}
        <div className="px-6 py-3 flex items-center gap-3 flex-wrap justify-center border-b border-white/5">
          {players.map(p => (
            <div key={p.id}
              className={cn(
                "flex items-center gap-1.5 text-sm font-mono px-3 py-1.5 rounded-lg border",
                !p.active
                  ? "opacity-25 bg-white/5 border-white/10 line-through"
                  : p.id === currentPlayerId
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-white/5 border-white/10 text-white/70"
              )}
            >
              <span className="text-base">{avatarEmoji(p.avatarId)}</span>
              <span className="font-bold">{p.name}</span>
              <span className="text-green-400">{p.points}pt</span>
              <span className="text-red-400">
                {Array.from({ length: p.lives }).map(() => '♥').join('') || '—'}
              </span>
            </div>
          ))}
        </div>
        {/* Round description */}
        <div className="px-6 py-3 text-center">
          <p className="text-base md:text-lg text-muted-foreground tracking-[0.15em]">
            {currentRound?.description}
          </p>
        </div>
      </footer>
    </div>
  );
}
