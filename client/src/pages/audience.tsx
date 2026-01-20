import { useGame } from "@/lib/game-state";
import { ROUNDS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function AudienceView() {
  const { roundId, currentQuestion, status, players } = useGame();
  
  const currentRound = ROUNDS.find(r => r.id === roundId);
  const activePlayers = players.filter(p => p.status === 'ACTIVE');

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden font-display">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black animate-pulse" />
      
      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-8 md:p-12 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="bg-primary text-black font-black text-2xl md:text-4xl px-4 py-2 rounded transform -skew-x-12 shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
            {activePlayers.length} PLAYERS
          </div>
          <h1 className="text-4xl md:text-5xl uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
            {currentRound?.name}
          </h1>
        </div>
        <div className="text-2xl md:text-3xl font-mono text-primary animate-pulse">
          LIVE
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex items-center justify-center p-12 md:p-24 text-center">
        <AnimatePresence mode="wait">
          {!currentQuestion ? (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="space-y-8"
            >
              <h2 className="text-6xl md:text-8xl font-black text-white/20 tracking-tighter animate-pulse">
                WAITING FOR QUESTION
              </h2>
              <p className="text-white/10 font-mono mt-4 uppercase tracking-widest text-sm">
                Waiting for host to select next question...
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="w-full max-w-6xl space-y-12"
            >
              {/* Question Text */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-xl opacity-50" />
                <h2 className="relative text-5xl md:text-8xl font-medium leading-tight drop-shadow-2xl">
                  {currentQuestion.text}
                </h2>
              </div>

              {/* Answer Section */}
              <div className="h-48 flex items-center justify-center">
                <AnimatePresence>
                  {status === 'ANSWER_REVEALED' && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="bg-accent text-accent-foreground px-12 py-6 rounded-2xl transform shadow-[0_0_50px_hsl(var(--accent)/0.6)]"
                    >
                      <span className="text-6xl md:text-9xl font-black tracking-wide">
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

      {/* Footer / Status Bar */}
      <footer className="relative z-10 p-8 border-t border-white/10 bg-black/80 backdrop-blur text-center">
        <p className="text-xl md:text-2xl text-muted-foreground font-ui tracking-[0.2em]">
          {currentRound?.description}
        </p>
      </footer>
    </div>
  );
}
