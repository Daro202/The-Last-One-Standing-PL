import { useState, useEffect, useRef } from "react";
import { useGame } from "@/lib/game-state";
import { ROUNDS, AVATARS, DEFAULT_LIVES, ROUND_POINTS } from "@/lib/mock-data";
import { parseExcelBinaryString } from "@/lib/excel-loader";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  X, Eye, RotateCcw, Skull, Tv, Upload, Download,
  Check, Heart, ChevronRight, Pencil, Shuffle,
  Timer, Play, Pause, RefreshCw, Wifi, WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

// ── Avatar helpers ────────────────────────────────────────────────────────────

function avatarEmoji(id: number): string {
  return AVATARS.find(a => a.id === id)?.emoji ?? '👤';
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const {
    roundId, currentQuestion, status, questionScored,
    players, questions, categories, selectedCategory,
    currentPlayerId, usedQuestionIds, gameOver, winnerId, questionsSource,
    setRound, setQuestion, drawQuestion, revealAnswer,
    markCorrect, markWrong, setCurrentPlayer, nextPlayer, setCategory,
    updatePlayer, resetGame, importQuestions, importPlayers,
    startTimer, pauseTimer, resetTimer,
    timerActive, timerSeconds, timerStartedAt,
    roomCode, wsConnected,
  } = useGame();

  // Local UI state
  const [confirmReset, setConfirmReset] = useState(false);
  // Mobile only: three columns don't fit a phone screen, so below the `lg`
  // breakpoint we show one panel at a time via a bottom tab bar.
  const [mobileTab, setMobileTab] = useState<'controls' | 'question' | 'players'>('question');
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatarId, setEditAvatarId] = useState(1);
  const [timerDuration, setTimerDuration] = useState(30);
  const [timerDisplay, setTimerDisplay] = useState(timerSeconds);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live timer countdown — updates every 500 ms while the timer is running
  useEffect(() => {
    if (!timerActive || timerStartedAt === null) {
      setTimerDisplay(timerSeconds);
      return;
    }
    const tick = () => {
      setTimerDisplay(Math.max(0, timerSeconds - Math.floor((Date.now() - timerStartedAt) / 1000)));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timerActive, timerSeconds, timerStartedAt]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const currentRound = ROUNDS.find(r => r.id === roundId);
  const roundName = currentRound?.name ?? 'WARM UP';
  const currentPlayer = players.find(p => p.id === currentPlayerId) ?? null;
  const winner = players.find(p => p.id === winnerId) ?? null;
  const activePlayers = players.filter(p => p.active);

  const roundQuestions = questions.filter(q => q.round === roundName);
  const eligibleQuestions = roundQuestions.filter(q =>
    (!selectedCategory || q.category === selectedCategory) &&
    !usedQuestionIds.includes(q.id)
  );
  const remainingCount = eligibleQuestions.length;
  const loading = questionsSource === 'none';

  // ── Excel import ───────────────────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result as string;
      const { questions: qs, categories: cats, errors, warnings } = parseExcelBinaryString(bstr);
      if (warnings.length) console.warn('Import warnings:', warnings);
      if (errors.length) {
        alert(`Import errors:\n\n${errors.join('\n')}`);
        if (!qs.length) return;
      }
      importQuestions(qs, cats);
      alert(`Imported ${qs.length} questions across ${cats.length} categories.`);
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // ── Excel export ───────────────────────────────────────────────────────────

  const handleExportPlayers = () => {
    const data = players.map(p => ({
      ID: p.id, Name: p.name, AvatarId: p.avatarId,
      Points: p.points, Lives: p.lives, Active: p.active ? 1 : 0,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Players');
    XLSX.writeFile(wb, 'quiz_results.xlsx');
  };

  const handleExportQuestions = () => {
    const data = questions.map(q => ({
      ID: q.id, ROUND: q.round, CATEGORY: q.category, TYPE: q.type,
      QUESTION: q.text, CORRECT_ANSWER: q.answer,
      DIFFICULTY: q.difficulty ?? '', ACTIVE: 1,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, 'quiz_questions.xlsx');
  };

  // ── Player edit helpers ────────────────────────────────────────────────────

  const startEdit = (id: number, name: string, avatarId: number) => {
    setEditingPlayerId(id);
    setEditName(name);
    setEditAvatarId(avatarId);
  };

  const saveEdit = () => {
    if (editingPlayerId !== null) {
      updatePlayer(editingPlayerId, {
        name: editName.trim() || `Player ${editingPlayerId}`,
        avatarId: editAvatarId,
      });
    }
    setEditingPlayerId(null);
  };

  const cancelEdit = () => setEditingPlayerId(null);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col lg:grid lg:grid-cols-[300px_1fr_360px] h-dvh overflow-hidden pb-14 lg:pb-0">

      {/* ══ LEFT: Controls & Questions ═══════════════════════════════════════ */}
      <div className={cn(
        "border-r border-border bg-card/50 flex-col h-full min-h-0 overflow-hidden",
        mobileTab === 'controls' ? 'flex' : 'hidden', 'lg:flex'
      )}>
        <div className="p-4 border-b border-border shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg tracking-wider text-primary uppercase">Game Controls</h2>
            {wsConnected
              ? <Wifi className="w-4 h-4 text-green-500 shrink-0" />
              : <WifiOff className="w-4 h-4 text-muted-foreground shrink-0 animate-pulse" />
            }
          </div>

          {/* Room code badge */}
          <div className={cn(
            "rounded-lg border px-3 py-2 flex items-center justify-between gap-2",
            roomCode ? "bg-primary/10 border-primary/40" : "bg-muted/20 border-border"
          )}>
            <div className="flex items-center gap-2">
              <Tv className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Room code</span>
            </div>
            {roomCode
              ? <span className="font-mono font-black text-xl text-primary tracking-widest">{roomCode}</span>
              : <span className="text-xs text-muted-foreground italic">connecting…</span>
            }
          </div>

          <Button
            variant="outline" size="sm" className="w-full border-primary/50 text-primary hover:bg-primary/10"
            onClick={() => window.open('/audience', '_blank', 'width=1920,height=1080')}
          >
            <Tv className="w-4 h-4 mr-2" /> Open Projector View
          </Button>

          {/* Reset with confirmation */}
          {confirmReset ? (
            <div className="rounded-lg bg-destructive/10 border border-destructive/40 p-3 space-y-2">
              <p className="text-sm text-destructive font-semibold">Reset game? Player names and avatars will be kept.</p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="flex-1"
                  onClick={() => { resetGame(); setConfirmReset(false); }}>
                  Confirm
                </Button>
                <Button size="sm" variant="outline" className="flex-1"
                  onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="destructive" size="sm" className="w-full"
              onClick={() => setConfirmReset(true)}>
              <RotateCcw className="w-4 h-4 mr-2" /> Reset Game
            </Button>
          )}

          {/* Import / Export */}
          <div className="pt-2 border-t border-border space-y-2">
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleFileUpload} />
            <Button variant="secondary" size="sm" className="w-full"
              onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Import Excel (.xlsx)
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPlayers}>
                <Download className="w-3 h-3 mr-1" /> Players
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportQuestions}>
                <Download className="w-3 h-3 mr-1" /> Questions
              </Button>
            </div>
          </div>
        </div>

        {/* Round selector + category + draw */}
        <div className="p-4 border-b border-border space-y-3 shrink-0">
          <div className="grid grid-cols-2 gap-1">
            {ROUNDS.map(r => (
              <Button key={r.id}
                variant={roundId === r.id ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full text-xs font-bold uppercase"
                onClick={() => setRound(r.id)}
              >
                {r.name}
              </Button>
            ))}
          </div>

          {/* Category filter */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Category</label>
            <select
              className="w-full rounded-md border border-border bg-background text-foreground text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              value={selectedCategory ?? ''}
              onChange={e => setCategory(e.target.value || null)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Draw button + count */}
          <div className="flex items-center gap-2">
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              size="sm"
              onClick={drawQuestion}
              disabled={loading || remainingCount === 0 || gameOver}
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Draw Question
            </Button>
            <span className={cn(
              "text-xs font-mono shrink-0",
              remainingCount === 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {loading ? '…' : `${remainingCount} left`}
            </span>
          </div>

          {!loading && remainingCount === 0 && (
            <p className="text-xs text-destructive text-center">
              No unused questions for this round{selectedCategory ? ` / ${selectedCategory}` : ''}.
            </p>
          )}
        </div>

        {/* Question list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground italic">Loading questions…</div>
          ) : roundQuestions.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground italic">No questions for this round.</div>
          ) : (
            <div className="p-3 space-y-1">
              {roundQuestions.map(q => {
                const used = usedQuestionIds.includes(q.id);
                const isCurrent = currentQuestion?.id === q.id;
                const inFilter = !selectedCategory || q.category === selectedCategory;
                return (
                  <button
                    key={q.id}
                    className={cn(
                      "w-full text-left rounded-lg border px-3 py-2 text-xs transition-all",
                      isCurrent
                        ? "bg-primary text-primary-foreground border-primary"
                        : used
                          ? "opacity-30 line-through border-border text-muted-foreground"
                          : inFilter
                            ? "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                            : "bg-card border-border opacity-50"
                    )}
                    onClick={() => !gameOver && setQuestion(q.id)}
                  >
                    <div className="flex items-start gap-1.5">
                      <span className="font-mono text-primary shrink-0 opacity-70">#{q.id}</span>
                      <span className="line-clamp-2 leading-relaxed">{q.text}</span>
                    </div>
                    <div className="flex gap-1 mt-0.5">
                      <span className="opacity-50">{q.category}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ CENTER: Live Control ══════════════════════════════════════════════ */}
      <div className={cn(
        "flex-col h-full min-h-0 bg-background p-4 lg:p-8 gap-6 overflow-y-auto",
        mobileTab === 'question' ? 'flex' : 'hidden', 'lg:flex'
      )}>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black uppercase text-foreground/80">{roundName}</h1>
          <div className="flex items-center gap-3">
            {selectedCategory && (
              <Badge variant="outline" className="text-sm border-primary/50 text-primary">
                {selectedCategory}
              </Badge>
            )}
            <Badge variant="outline" className="text-xl py-1 px-4 border-primary text-primary">
              {status}
            </Badge>
          </div>
        </div>

        {/* Game over banner */}
        {gameOver && (
          <div className="rounded-xl bg-accent/20 border border-accent p-6 text-center">
            <p className="text-2xl font-black uppercase text-accent">
              🏆 {winner ? `${winner.name} wins the game!` : 'Game Over'}
            </p>
          </div>
        )}

        {/* Current player strip */}
        {!gameOver && (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/30 min-h-[72px]">
            {currentPlayer ? (
              <>
                <span className="text-4xl">{avatarEmoji(currentPlayer.avatarId)}</span>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Current Player</p>
                  <p className="text-2xl font-black">{currentPlayer.name}</p>
                </div>
                <div className="flex items-center gap-4 font-mono text-lg">
                  <span className="text-green-400 font-bold">{currentPlayer.points} pts</span>
                  <span className="flex items-center gap-0.5 text-red-400">
                    {Array.from({ length: currentPlayer.lives }).map((_, i) => (
                      <Heart key={i} className="w-5 h-5 fill-red-400 text-red-400" />
                    ))}
                    {currentPlayer.lives === 0 && <span>0</span>}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={nextPlayer} className="shrink-0">
                  <ChevronRight className="w-4 h-4 mr-1" /> Skip
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground italic text-sm">No active player selected.</p>
            )}
          </div>
        )}

        {/* Timer controls */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/20 border border-border">
          <Timer className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            className="rounded border border-border bg-background text-foreground text-xs px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary w-20"
            value={timerDuration}
            onChange={e => { const s = Number(e.target.value); setTimerDuration(s); resetTimer(s); }}
            disabled={timerActive}
          >
            {[10, 15, 20, 30, 45, 60, 90].map(s => (
              <option key={s} value={s}>{s}s</option>
            ))}
          </select>
          <span className={cn(
            "font-mono font-black text-xl w-12 text-center tabular-nums",
            timerDisplay <= 5 && timerActive ? "text-red-500 animate-pulse"
              : timerDisplay <= 10 ? "text-orange-400" : "text-primary"
          )}>
            {timerDisplay}
          </span>
          {timerActive ? (
            <Button size="sm" variant="outline" className="gap-1.5 border-orange-500/50 text-orange-400 hover:bg-orange-500/10" onClick={pauseTimer}>
              <Pause className="w-3.5 h-3.5" /> Pause
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5 border-green-500/50 text-green-400 hover:bg-green-500/10"
              onClick={startTimer} disabled={gameOver || !currentQuestion}>
              <Play className="w-3.5 h-3.5" /> Start
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground px-2"
            onClick={() => { resetTimer(timerDuration); setTimerDisplay(timerDuration); }}
            title="Reset timer">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Question card */}
        <Card className="flex-1 flex flex-col justify-center border-primary/20 bg-card/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardContent className="p-10 space-y-8 text-center">
            {currentQuestion ? (
              <>
                {/* Question meta */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Badge variant="outline" className="text-xs">{currentQuestion.type}</Badge>
                  <Badge variant="secondary" className="text-xs">{currentQuestion.category}</Badge>
                  {currentQuestion.difficulty && (
                    <Badge variant="outline" className="text-xs opacity-60">{currentQuestion.difficulty}</Badge>
                  )}
                  {questionScored && (
                    <Badge className="text-xs bg-green-700 text-white">SCORED</Badge>
                  )}
                </div>

                {/* Question text — shrinks on narrow screens so full text always fits */}
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight">{currentQuestion.text}</p>

                {/* Answer — always visible to host */}
                <div className="pt-6 border-t border-border/50 space-y-5">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Answer (host only)</p>
                    <p className="text-4xl font-black text-accent">{currentQuestion.answer}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap justify-center gap-3 pt-1">
                    {status !== 'ANSWER_REVEALED' && (
                      <Button size="lg"
                        className="text-base px-7 py-5 bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={revealAnswer}>
                        <Eye className="w-5 h-5 mr-2" /> Reveal to Audience
                      </Button>
                    )}
                    <Button size="lg"
                      className="text-base px-7 py-5 bg-green-600 hover:bg-green-500 text-white"
                      onClick={markCorrect}
                      disabled={!currentPlayerId || questionScored || gameOver}>
                      <Check className="w-5 h-5 mr-2" /> Correct
                    </Button>
                    <Button size="lg"
                      className="text-base px-7 py-5 bg-red-700 hover:bg-red-600 text-white"
                      onClick={markWrong}
                      disabled={!currentPlayerId || questionScored || gameOver}>
                      <X className="w-5 h-5 mr-2" /> Wrong
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-xl italic">
                {loading
                  ? 'Loading questions from Excel…'
                  : 'Draw a question or select one from the sidebar.'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Round description */}
        <div className="p-4 rounded-xl bg-muted/20 border border-border">
          <p className="text-sm text-muted-foreground">{currentRound?.description}</p>
        </div>
      </div>

      {/* ══ RIGHT: Players ════════════════════════════════════════════════════ */}
      <div className={cn(
        "border-l border-border bg-card/50 flex-col h-full min-h-0",
        mobileTab === 'players' ? 'flex' : 'hidden', 'lg:flex'
      )}>
        <div className="p-4 border-b border-border bg-card">
          <h2 className="font-bold text-lg tracking-wider text-primary flex items-center justify-between">
            PLAYERS
            <Badge variant="secondary">{activePlayers.length} Active</Badge>
          </h2>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {players.map(player => {
              const isCurrent = player.id === currentPlayerId;
              const isEditing = editingPlayerId === player.id;

              return (
                <div key={player.id}
                  className={cn(
                    "rounded-lg border transition-all",
                    !player.active ? "bg-destructive/10 border-destructive/20 opacity-60"
                      : isCurrent ? "bg-primary/15 border-primary shadow-[0_0_8px_hsl(var(--primary)/0.25)]"
                        : "bg-card border-border"
                  )}
                >
                  {/* Player row */}
                  <div className="flex items-center gap-2 p-2.5 cursor-pointer"
                    onClick={() => player.active && !isEditing && setCurrentPlayer(player.id)}>
                    {/* Avatar */}
                    <span className="text-2xl shrink-0">{avatarEmoji(player.avatarId)}</span>

                    {/* Name + stats */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 font-bold text-sm truncate">
                        {isCurrent && player.active && <ChevronRight className="w-3 h-3 text-primary shrink-0" />}
                        <span className="truncate">{player.name}</span>
                        {!player.active && <Skull className="w-3.5 h-3.5 text-destructive shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
                        <span className="text-green-400">{player.points} pts</span>
                        <span className="text-red-400 flex items-center gap-0.5">
                          {Array.from({ length: player.lives }).map((_, i) => (
                            <Heart key={i} className="w-2.5 h-2.5 fill-red-400 text-red-400" />
                          ))}
                          {player.lives === 0 && '0♥'}
                        </span>
                      </div>
                    </div>

                    {/* Quick controls */}
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      {player.active && !isEditing && (
                        <>
                          <Button size="icon" variant="ghost"
                            className="h-7 w-7 text-green-500 hover:bg-green-500/20 border border-green-500/20"
                            onClick={() => updatePlayer(player.id, { points: player.points + (ROUND_POINTS[roundName] ?? 1) })}
                            title={`+${ROUND_POINTS[roundName] ?? 1} point`}>
                            <span className="text-xs font-bold">+{ROUND_POINTS[roundName] ?? 1}</span>
                          </Button>
                          <Button size="icon" variant="ghost"
                            className="h-7 w-7 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20"
                            onClick={() => updatePlayer(player.id, {
                              lives: Math.max(0, player.lives - 1),
                              active: player.lives > 1,
                            })}
                            title="-1 life">
                            <Heart className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost"
                            className="h-7 w-7 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                            onClick={() => updatePlayer(player.id, { active: false })}
                            title="Eliminate">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      {!player.active && !isEditing && (
                        <Button size="icon" variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => updatePlayer(player.id, { active: true, lives: 1 })}
                          title="Restore">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => isEditing ? cancelEdit() : startEdit(player.id, player.name, player.avatarId)}
                        title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Inline edit section */}
                  {isEditing && (
                    <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
                      <input
                        className="w-full rounded border border-border bg-background text-foreground text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Player name"
                        maxLength={30}
                        autoFocus
                      />
                      {/* Avatar grid */}
                      <div className="grid grid-cols-6 gap-1">
                        {AVATARS.map(a => (
                          <button key={a.id}
                            className={cn(
                              "text-xl p-1 rounded transition-all",
                              editAvatarId === a.id
                                ? "bg-primary/30 ring-1 ring-primary"
                                : "hover:bg-primary/10"
                            )}
                            title={a.label}
                            onClick={() => setEditAvatarId(a.id)}
                          >
                            {a.emoji}
                          </button>
                        ))}
                      </div>
                      {/* Edit actions */}
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={saveEdit}>Save</Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                        <Button size="sm" variant="ghost"
                          className="text-muted-foreground hover:text-foreground"
                          title="Reset player stats"
                          onClick={() => {
                            updatePlayer(player.id, { points: 0, lives: DEFAULT_LIVES, active: true });
                            cancelEdit();
                          }}>
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* ══ MOBILE-ONLY: bottom tab bar to switch between the three panels ══ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-14 border-t border-border bg-card flex z-50">
        {([
          { id: 'controls' as const, label: 'Controls' },
          { id: 'question' as const, label: 'Question' },
          { id: 'players' as const, label: 'Players' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={cn(
              "flex-1 text-xs font-bold uppercase tracking-wide transition-colors",
              mobileTab === tab.id ? "text-primary bg-primary/10" : "text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
