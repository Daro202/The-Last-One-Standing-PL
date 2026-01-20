import { Link } from "wouter";
import { Monitor, Tv, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-12 p-8 text-center bg-background">
      <div className="space-y-4 animate-in fade-in zoom-in duration-500">
        <h1 className="text-6xl md:text-8xl font-black text-primary tracking-tight" 
            style={{ textShadow: '0 0 40px hsl(var(--primary) / 0.5)' }}>
          1 of 10
        </h1>
        <p className="text-xl text-muted-foreground uppercase tracking-widest font-medium">
          Live Quiz System
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-2xl">
        <Link href="/admin">
          <div className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary transition-all cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex flex-col items-center gap-4 relative z-10">
              <Monitor className="w-16 h-16 text-primary" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Host Panel</h2>
                <p className="text-muted-foreground text-sm">Control the game flow, questions, and players.</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/audience">
          <div className="group relative p-8 rounded-2xl bg-card border border-border hover:border-accent transition-all cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex flex-col items-center gap-4 relative z-10">
              <Tv className="w-16 h-16 text-accent" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Audience View</h2>
                <p className="text-muted-foreground text-sm">Display for the big screen / projector.</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="text-xs text-muted-foreground opacity-50 absolute bottom-4">
        PROTOTYPE BUILD v0.1
      </div>
    </div>
  );
}
