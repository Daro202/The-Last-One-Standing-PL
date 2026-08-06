import { useGame } from "@/lib/game-state";
import { ROUNDS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, Eye, RotateCcw, Skull, Tv, Upload, Download, Check, Heart, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import * as XLSX from "xlsx";

export default function AdminPanel() {
  const {
    roundId, currentQuestion, status, players, dynamicQuestions,
    currentPlayerId, usedQuestionIds, gameOver, winnerId,
    setRound, setQuestion, revealAnswer,
    markCorrect, markWrong, setCurrentPlayer, nextPlayer,
    updatePlayer, resetGame, importQuestions, importPlayers,
  } = useGame();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Excel import ──────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) { alert("File is empty."); return; }

        if (data[0].question_text || data[0].text) {
          const questions = data.map((row, idx) => ({
            id: parseInt(row.question_id || row.id || idx + 1),
            text: String(row.question_text || row.text),
            answer: String(row.correct_answer || row.answer),
            type: (['TRUE_FALSE', 'OPEN', 'YES_NO'].includes(String(row.question_type || row.type || '').toUpperCase())
              ? String(row.question_type || row.type).toUpperCase().replace('YES_NO', 'TRUE_FALSE')
              : 'OPEN') as 'TRUE_FALSE' | 'OPEN',
            plant: row.plant ? String(row.plant) : undefined,
            location: row.location ? String(row.location) : undefined,
          }));
          importQuestions(questions);
          alert(`Imported ${questions.length} questions into ${ROUNDS.find(r => r.id === roundId)?.name}.`);
        } else if (data[0].name) {
          const newPlayers = data.map((row, idx) => ({
            id: row.player_id || row.id || idx + 1,
            name: String(row.name),
            points: Number(row.points) || 0,
            lives: Number(row.lives) || 2,
            status: (row.status === 'ELIMINATED' ? 'ELIMINATED' : 'ACTIVE') as 'ACTIVE' | 'ELIMINATED',
          }));
          importPlayers(newPlayers);
          alert(`Imported ${newPlayers.length} players.`);
        } else {
          alert("Unrecognised format. Columns must include 'text'/'question_text' for questions or 'name' for players.");
        }
      } catch (err) {
        console.error(err);
        alert("Error parsing Excel file.");
      }
    };
    reader.readAsBinaryString(file);
    // reset so the same file can be re-imported
    e.target.value = '';
  };

  const handleExportPlayers = () => {
    const ws = XLSX.utils.json_to_sheet(players);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Players");
    XLSX.writeFile(wb, "quiz_results.xlsx");
  };

  const handleExportQuestions = () => {
    const allQuestions = Object.entries(dynamicQuestions).flatMap(([rId, questions]) =>
      questions.map(q => ({
        round: ROUNDS.find(r => r.id === parseInt(rId))?.name || `Round ${rId}`,
        ...q,
      }))
    );
    const ws = XLSX.utils.json_to_sheet(allQuestions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "quiz_questions.xlsx");
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const currentPlayer = players.find(p => p.id === currentPlayerId) ?? null;
  const winner = players.find(p => p.id === winnerId) ?? null;
  const activePlayers = players.filter(p => p.status === 'ACTIVE');
  const roundKey = roundId.toString();
  const roundQuestions = dynamicQuestions?.[roundKey] ?? [];
  const usedIds = usedQuestionIds?.[roundKey] ?? [];
  const remainingCount = roundQuestions.filter(q => !usedIds.includes(q.id)).length;

  return (
    <div className="min-h-screen bg-background text-foreground grid grid-cols-[300px_1fr_350px] gap-0 h-screen overflow-hidden">

      {/* ── LEFT: Navigation & Questions ─────────────────────────────────── */}
      <div className="border-r border-border bg-card/50 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-border shrink-0">
          <h2 className="font-bold text-lg tracking-wider text-primary uppercase">Game Controls</h2>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 mb-2 border-primary/50 text-primary hover:bg-primary/10"
            onClick={() => window.open('/audience', '_blank', 'location=yes,height=1080,width=1920,scrollbars=yes,status=yes')}
          >
            <Tv className="w-4 h-4 mr-2" /> Open Projector View
          </Button>
          <Button variant="destructive" size="sm" className="w-full" onClick={resetGame}>
            <RotateCcw className="w-4 h-4 mr-2" /> Reset Game
          </Button>

          <div className="mt-4 pt-4 border-t border-border">
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleFileUpload} />
            <Button variant="secondary" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Import Excel (.xlsx)
            </Button>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button variant="outline" size="xs" onClick={handleExportPlayers}>
                <Download className="w-3 h-3 mr-1" /> Players
              </Button>
              <Button variant="outline" size="xs" onClick={handleExportQuestions}>
                <Download className="w-3 h-3 mr-1" /> Questions
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-6">
            {ROUNDS.map((round) => (
              <div key={round.id} className="space-y-2">
                <Button
                  variant={roundId === round.id ? "secondary" : "ghost"}
                  className="w-full justify-start font-bold uppercase"
                  onClick={() => setRound(round.id)}
                >
                  {round.name}
                </Button>

                {roundId === round.id && (
                  <div className="pl-2 space-y-1">
                    <div className="text-xs text-muted-foreground font-mono mb-2 px-1">
                      {remainingCount} of {roundQuestions.length} remaining
                    </div>
                    {roundQuestions.map((q) => {
                      const used = usedIds.includes(q.id);
                      return (
                        <Button
                          key={q.id}
                          variant={currentQuestion?.id === q.id ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "w-full justify-start text-xs h-auto py-2.5 px-3 whitespace-normal text-left transition-all",
                            currentQuestion?.id === q.id
                              ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                              : used
                                ? "opacity-40 line-through hover:bg-primary/10 hover:border-primary/50"
                                : "hover:bg-primary/10 hover:border-primary/50"
                          )}
                          onClick={() => setQuestion(q.id)}
                        >
                          <div className="flex items-start gap-2">
                            <span className={cn(
                              "font-mono opacity-70 shrink-0 mt-0.5",
                              currentQuestion?.id === q.id ? "text-primary-foreground" : "text-primary"
                            )}>
                              #{q.id}
                            </span>
                            <span className="font-medium line-clamp-2 leading-relaxed">{q.text}</span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CENTER: Live Control ──────────────────────────────────────────── */}
      <div className="flex flex-col h-full bg-background p-8 gap-6 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black uppercase text-foreground/80">
            {ROUNDS.find(r => r.id === roundId)?.name}
          </h1>
          <Badge variant="outline" className="text-xl py-1 px-4 border-primary text-primary">
            {status}
          </Badge>
        </div>

        {/* Game-over banner */}
        {gameOver && (
          <div className="rounded-xl bg-accent/20 border border-accent p-6 text-center">
            <p className="text-2xl font-black uppercase text-accent">
              🏆 {winner ? `${winner.name} wins!` : 'Game Over'}
            </p>
          </div>
        )}

        {/* Current player strip */}
        {!gameOver && currentPlayer && (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/30">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Current Player</p>
              <p className="text-2xl font-black">{currentPlayer.name}</p>
            </div>
            <div className="flex items-center gap-3 text-lg font-mono">
              <span className="text-green-400">Pts: {currentPlayer.points}</span>
              <span className="text-red-400 flex items-center gap-1">
                {Array.from({ length: currentPlayer.lives }).map((_, i) => (
                  <Heart key={i} className="w-5 h-5 fill-red-400 text-red-400" />
                ))}
                {currentPlayer.lives === 0 && '—'}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={nextPlayer} className="shrink-0">
              <ChevronRight className="w-4 h-4 mr-1" /> Skip
            </Button>
          </div>
        )}

        {/* Question card */}
        <Card className="flex-1 flex flex-col justify-center border-primary/20 bg-card/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardContent className="p-12 space-y-8 text-center">
            {currentQuestion ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-3">
                    <h3 className="text-muted-foreground uppercase tracking-widest text-sm">Question</h3>
                    <Badge variant="outline" className="text-xs">{currentQuestion.type}</Badge>
                    {currentQuestion.plant && (
                      <Badge variant="secondary" className="text-xs">🌱 {currentQuestion.plant}</Badge>
                    )}
                    {currentQuestion.location && (
                      <Badge variant="secondary" className="text-xs">📍 {currentQuestion.location}</Badge>
                    )}
                  </div>
                  <p className="text-4xl md:text-5xl font-bold leading-tight">{currentQuestion.text}</p>
                </div>

                {/* Answer — always visible to host */}
                <div className="pt-6 border-t border-border/50 space-y-4">
                  <div>
                    <h3 className="text-muted-foreground uppercase tracking-widest text-sm mb-1">Answer (host only)</h3>
                    <p className="text-4xl font-black text-accent">{currentQuestion.answer}</p>
                  </div>

                  {/* Reveal + scoring buttons */}
                  <div className="flex flex-wrap justify-center gap-4 pt-2">
                    {status !== 'ANSWER_REVEALED' && (
                      <Button
                        size="lg"
                        className="text-lg px-8 py-6 bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={revealAnswer}
                      >
                        <Eye className="w-5 h-5 mr-2" /> Reveal to Audience
                      </Button>
                    )}
                    <Button
                      size="lg"
                      className="text-lg px-8 py-6 bg-green-600 hover:bg-green-500 text-white"
                      onClick={markCorrect}
                      disabled={!currentPlayerId}
                    >
                      <Check className="w-5 h-5 mr-2" /> Correct
                    </Button>
                    <Button
                      size="lg"
                      className="text-lg px-8 py-6 bg-red-700 hover:bg-red-600 text-white"
                      onClick={markWrong}
                      disabled={!currentPlayerId}
                    >
                      <X className="w-5 h-5 mr-2" /> Wrong
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-xl italic">
                Select a question from the sidebar to begin.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Round rules */}
        <div className="p-4 rounded-xl bg-muted/20 border border-border">
          <h4 className="font-bold text-muted-foreground uppercase text-xs mb-1">Round Rules</h4>
          <p className="text-base">{ROUNDS.find(r => r.id === roundId)?.description}</p>
        </div>
      </div>

      {/* ── RIGHT: Players ────────────────────────────────────────────────── */}
      <div className="border-l border-border bg-card/50 flex flex-col h-full">
        <div className="p-4 border-b border-border bg-card z-10">
          <h2 className="font-bold text-lg tracking-wider text-primary flex items-center justify-between">
            PLAYERS
            <Badge variant="secondary">{activePlayers.length} Active</Badge>
          </h2>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {players.map((player) => {
              const isCurrent = player.id === currentPlayerId;
              return (
                <div
                  key={player.id}
                  className={cn(
                    "p-3 rounded-lg border flex items-center justify-between transition-all cursor-pointer",
                    player.status === 'ELIMINATED'
                      ? "bg-destructive/10 border-destructive/20 opacity-60 grayscale"
                      : isCurrent
                        ? "bg-primary/15 border-primary shadow-[0_0_8px_hsl(var(--primary)/0.3)]"
                        : "bg-card border-border hover:border-primary/50"
                  )}
                  onClick={() => player.status === 'ACTIVE' && setCurrentPlayer(player.id)}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="font-bold flex items-center gap-2 flex-wrap">
                      {isCurrent && player.status === 'ACTIVE' && (
                        <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                      )}
                      <span className="truncate">{player.name}</span>
                      {player.status === 'ELIMINATED' && <Skull className="w-4 h-4 text-destructive shrink-0" />}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono flex items-center gap-3">
                      <span className="text-green-400">Pts: {player.points}</span>
                      <span className="text-red-400 flex items-center gap-0.5">
                        {Array.from({ length: player.lives }).map((_, i) => (
                          <Heart key={i} className="w-3 h-3 fill-red-400 text-red-400" />
                        ))}
                        {player.lives === 0 && '0'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {player.status === 'ACTIVE' && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-green-500 hover:text-green-400 hover:bg-green-500/20 border border-green-500/20"
                          onClick={(e) => { e.stopPropagation(); updatePlayer(player.id, { points: player.points + 1 }); }}
                          title="+1 point"
                        >
                          <span className="text-sm font-bold">+1</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 border border-orange-500/20"
                          onClick={(e) => { e.stopPropagation(); updatePlayer(player.id, { lives: Math.max(0, player.lives - 1), status: player.lives <= 1 ? 'ELIMINATED' : 'ACTIVE' }); }}
                          title="-1 life"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-red-500 hover:text-red-400 hover:bg-red-500/20 border border-red-500/20"
                          onClick={(e) => { e.stopPropagation(); updatePlayer(player.id, { status: 'ELIMINATED' }); }}
                          title="Eliminate"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {player.status === 'ELIMINATED' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => { e.stopPropagation(); updatePlayer(player.id, { status: 'ACTIVE', lives: 1 }); }}
                        title="Reactivate"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
