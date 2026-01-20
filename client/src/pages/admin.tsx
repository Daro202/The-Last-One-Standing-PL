import { useGame } from "@/lib/game-state";
import { ROUNDS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, Eye, RotateCcw, Skull, Tv, Upload, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import * as XLSX from "xlsx";

export default function AdminPanel() {
  const { 
    roundId, currentQuestion, status, players, dynamicQuestions,
    setRound, setQuestion, revealAnswer, updatePlayer, resetGame, importQuestions, importPlayers 
  } = useGame();

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        
        if (data.length > 0) {
          // Check if it's questions or players based on columns
          if (data[0].question_text || data[0].text) {
            const questions = data.map((row, idx) => ({
              id: row.question_id || row.id || idx + 100,
              text: row.question_text || row.text,
              answer: String(row.correct_answer || row.answer),
              type: row.question_type || row.type || 'OPEN'
            }));
            importQuestions(questions);
            alert(`Imported ${questions.length} questions!`);
          } else if (data[0].name) {
            const players = data.map((row, idx) => ({
              id: row.player_id || row.id || idx + 1,
              name: row.name,
              points: row.points || 0,
              status: row.status || 'ACTIVE'
            }));
            importPlayers(players);
            alert(`Imported ${players.length} players!`);
          }
        }
      } catch (err) {
        console.error(err);
        alert("Error parsing Excel file");
      }
    };
    reader.readAsBinaryString(file);
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
        ...q
      }))
    );
    const ws = XLSX.utils.json_to_sheet(allQuestions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "quiz_questions.xlsx");
  };

  return (
    <div className="min-h-screen bg-background text-foreground grid grid-cols-[300px_1fr_350px] gap-0 h-screen overflow-hidden">
      
      {/* LEFT: Navigation & Questions */}
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
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full"
            onClick={resetGame}
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Reset Game
          </Button>
          
          <div className="mt-4 pt-4 border-t border-border">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload}
            />
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
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
                    {(dynamicQuestions[round.id.toString()] || [])?.map((q) => (
                      <Button
                        key={q.id}
                        variant={currentQuestion?.id === q.id ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "w-full justify-start text-xs h-auto py-2.5 px-3 whitespace-normal text-left transition-all",
                          currentQuestion?.id === q.id 
                            ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]" 
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
                          <span className="font-medium line-clamp-2 leading-relaxed">
                            {q.text}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER: Live Control */}
      <div className="flex flex-col h-full bg-background p-8 gap-8 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black uppercase text-foreground/80">
            {ROUNDS.find(r => r.id === roundId)?.name}
          </h1>
          <Badge variant="outline" className="text-xl py-1 px-4 border-primary text-primary">
            {status}
          </Badge>
        </div>

        <Card className="flex-1 flex flex-col justify-center border-primary/20 bg-card/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardContent className="p-12 space-y-8 text-center">
            {currentQuestion ? (
              <>
                <div className="space-y-4">
                  <h3 className="text-muted-foreground uppercase tracking-widest text-sm">Current Question</h3>
                  <p className="text-4xl md:text-5xl font-bold leading-tight">
                    {currentQuestion.text}
                  </p>
                </div>
                
                <div className="pt-8 border-t border-border/50">
                  {status === 'ANSWER_REVEALED' ? (
                     <div className="animate-in zoom-in duration-300">
                       <h3 className="text-muted-foreground uppercase tracking-widest text-sm mb-2">Answer</h3>
                       <p className="text-6xl font-black text-accent">{currentQuestion.answer}</p>
                     </div>
                  ) : (
                    <Button 
                      size="lg" 
                      className="text-xl px-12 py-8 bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={revealAnswer}
                    >
                      <Eye className="w-6 h-6 mr-2" /> REVEAL ANSWER
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-xl italic">
                Select a question from the sidebar to begin.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="p-6 rounded-xl bg-muted/20 border border-border">
          <h4 className="font-bold text-muted-foreground uppercase text-xs mb-2">Round Rules</h4>
          <p className="text-lg">{ROUNDS.find(r => r.id === roundId)?.description}</p>
        </div>
      </div>

      {/* RIGHT: Players */}
      <div className="border-l border-border bg-card/50 flex flex-col h-full">
        <div className="p-4 border-b border-border bg-card z-10">
          <h2 className="font-bold text-lg tracking-wider text-primary flex items-center justify-between">
            PLAYERS 
            <Badge variant="secondary">{players.filter(p => p.status === 'ACTIVE').length} Active</Badge>
          </h2>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {players.map((player) => (
              <div 
                key={player.id} 
                className={cn(
                  "p-3 rounded-lg border flex items-center justify-between transition-all",
                  player.status === 'ELIMINATED' 
                    ? "bg-destructive/10 border-destructive/20 opacity-60 grayscale" 
                    : "bg-card border-border hover:border-primary/50"
                )}
              >
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    {player.name}
                    {player.status === 'ELIMINATED' && <Skull className="w-4 h-4 text-destructive" />}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    Points: {player.points}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {player.status === 'ACTIVE' && (
                    <>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-10 w-10 text-green-500 hover:text-green-400 hover:bg-green-500/20 border border-green-500/20"
                        onClick={() => updatePlayer(player.id, { points: player.points + 1 })}
                      >
                        <span className="text-lg font-bold">+1</span>
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-10 w-10 text-red-500 hover:text-red-400 hover:bg-red-500/20 border border-red-500/20 ml-2"
                        onClick={() => updatePlayer(player.id, { status: 'ELIMINATED' })}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </>
                  )}
                  {player.status === 'ELIMINATED' && (
                     <Button 
                     size="icon" 
                     variant="ghost" 
                     className="h-8 w-8 text-muted-foreground hover:text-primary"
                     onClick={() => updatePlayer(player.id, { status: 'ACTIVE' })}
                   >
                     <RotateCcw className="w-4 h-4" />
                   </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
