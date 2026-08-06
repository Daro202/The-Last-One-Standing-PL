import { Player } from "@/lib/mock-data";
import { PlayerPlatform } from "./PlayerPlatform";

// ── Round atmosphere ─────────────────────────────────────────────────────────

interface RoundTheme {
  bgDarken: number;
  floorGlow: number;
  floorLine: number;
}

const ROUND_THEMES: Record<string, RoundTheme> = {
  "WARM UP":   { bgDarken: 0.00, floorGlow: 0.14, floorLine: 0.18 },
  "SURVIVAL":  { bgDarken: 0.03, floorGlow: 0.10, floorLine: 0.13 },
  "MANDATORY": { bgDarken: 0.07, floorGlow: 0.07, floorLine: 0.09 },
  "BATTLE":    { bgDarken: 0.12, floorGlow: 0.05, floorLine: 0.06 },
};

// ── Very gentle arc (centre dips slightly) ───────────────────────────────────

function arcOffset(i: number, total: number): number {
  const t = i / Math.max(total - 1, 1);
  return Math.round(16 * 4 * t * (1 - t)); // max ~16 px at centre
}

// ── Component ────────────────────────────────────────────────────────────────

interface ArenaProps {
  players: Player[];
  currentPlayerId: number | null;
  roundName: string;
}

export function Arena({ players, currentPlayerId, roundName }: ArenaProps) {
  const theme = ROUND_THEMES[roundName] ?? ROUND_THEMES["WARM UP"];
  const n = players.length || 1;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        background: `rgba(0,0,0,${theme.bgDarken})`,
        transition: "background 1.2s ease",
        overflow: "visible",
      }}
    >
      {/* Stage floor line */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 22,
          left: "3%",
          right: "3%",
          height: 1,
          background: `linear-gradient(90deg,
            transparent 0%,
            rgba(199,177,142,${theme.floorLine}) 18%,
            rgba(199,177,142,${theme.floorLine * 1.5}) 50%,
            rgba(199,177,142,${theme.floorLine}) 82%,
            transparent 100%
          )`,
          transition: "background 1.2s ease",
          pointerEvents: "none",
        }}
      />

      {/* ── Player row — each column is exactly 1/n of the total width ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",   // all pedestals bottom-align
          width: "100%",
          paddingBottom: 28,
          paddingTop: 20,
          paddingLeft: 8,
          paddingRight: 8,
          overflow: "visible",
          boxSizing: "border-box",
        }}
      >
        {players.map((player, i) => (
          <div
            key={player.id}
            style={{
              // Equal columns that fill the row exactly — no overflow
              flex: `0 0 ${100 / n}%`,
              width: `${100 / n}%`,
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
              // Gentle arc: centre columns pushed down
              transform: `translateY(${arcOffset(i, n)}px)`,
              transition: "transform 0.3s ease",
              // Contain the bust + pedestal within the column
              overflow: "visible",
              padding: "0 clamp(2px, 0.3vw, 8px)",
              boxSizing: "border-box",
            }}
          >
            <PlayerPlatform
              player={player}
              isCurrent={player.id === currentPlayerId}
              floorGlow={theme.floorGlow}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
