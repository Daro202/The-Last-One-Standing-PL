import { Player } from "@/lib/mock-data";
import { PlayerPlatform } from "./PlayerPlatform";

// ── Round atmosphere ─────────────────────────────────────────────────────────

interface RoundTheme {
  /** Background overlay opacity — higher = darker room */
  bgDarken: number;
  /** Spotlight cone opacity */
  spotIntensity: number;
  /** Spotlight cone width at base (px) */
  coneWidth: number;
  /** Warm floor glow opacity */
  floorGlow: number;
}

const ROUND_THEMES: Record<string, RoundTheme> = {
  "WARM UP":   { bgDarken: 0.00, spotIntensity: 0.18, coneWidth: 130, floorGlow: 0.18 },
  "SURVIVAL":  { bgDarken: 0.04, spotIntensity: 0.25, coneWidth: 110, floorGlow: 0.12 },
  "MANDATORY": { bgDarken: 0.08, spotIntensity: 0.22, coneWidth: 100, floorGlow: 0.08 },
  "BATTLE":    { bgDarken: 0.13, spotIntensity: 0.35, coneWidth: 88,  floorGlow: 0.05 },
};

// ── Arc geometry ─────────────────────────────────────────────────────────────

/**
 * Parabolic arc offset (px, downward) so center players sit slightly lower —
 * the "bowl" of the amphitheatre viewed from the front.
 */
function arcOffset(i: number, total: number): number {
  const t = i / (total - 1);                 // 0 → 1
  return Math.round(36 * 4 * t * (1 - t));  // peaks at center ≈ 36 px
}

// ── Component ────────────────────────────────────────────────────────────────

interface ArenaProps {
  players: Player[];
  currentPlayerId: number | null;
  roundName: string;
}

/**
 * Shallow amphitheatre arena — all players arranged in a parabolic arc,
 * current player spotlit and slightly elevated.
 */
export function Arena({ players, currentPlayerId, roundName }: ArenaProps) {
  const theme = ROUND_THEMES[roundName] ?? ROUND_THEMES["WARM UP"];
  const n = players.length || 1;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        // Extra dark overlay on top of arena per round
        background: `rgba(5,5,6,${theme.bgDarken})`,
      }}
    >
      {/* Floor ambient glow — warm bronze line at arena base */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 60,
          left: "8%",
          right: "8%",
          height: 1,
          background: `linear-gradient(90deg,
            transparent 0%,
            rgba(199,177,142,${theme.floorGlow}) 25%,
            rgba(199,177,142,${theme.floorGlow * 1.4}) 50%,
            rgba(199,177,142,${theme.floorGlow}) 75%,
            transparent 100%
          )`,
          pointerEvents: "none",
        }}
      />

      {/* Player row — flex, top-aligned so arc pushes center columns down */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: 160,   // spotlight column extends into this space
          paddingBottom: 40, // room for arc overhang + labels
          overflow: "visible",
        }}
      >
        {players.map((player, i) => (
          <div
            key={player.id}
            style={{
              width: `${100 / n}%`,
              maxWidth: 180,
              display: "flex",
              justifyContent: "center",
              marginTop: arcOffset(i, n),
              // Each column is the spotlight anchor
              position: "relative",
            }}
          >
            {/* Spotlight lives in paddingTop space — extends 160px above figurine */}
            <div
              style={{
                position: "absolute",
                top: -160,
                left: 0,
                right: 0,
                height: 160,
                overflow: "visible",
                pointerEvents: "none",
              }}
            >
              {player.id === currentPlayerId && (
                // Re-render Spotlight here so it sits in the padding area
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: theme.coneWidth + 40,
                    height: "100%",
                    background: [
                      `linear-gradient(180deg,`,
                      `  rgba(199,177,142,0) 0%,`,
                      `  rgba(199,177,142,${(theme.spotIntensity * 0.5).toFixed(3)}) 50%,`,
                      `  rgba(199,177,142,${theme.spotIntensity.toFixed(3)}) 100%`,
                      `)`,
                    ].join(""),
                    clipPath: (() => {
                      const hw = theme.coneWidth / 2;
                      const totalW = theme.coneWidth + 40;
                      const topPct = Math.round(50 - (hw / totalW) * 60);
                      const botPct = Math.round(50 + (hw / totalW) * 60);
                      return `polygon(${topPct}% 0%, ${botPct}% 0%, 100% 100%, 0% 100%)`;
                    })(),
                    transition: "opacity 0.7s ease",
                  }}
                />
              )}
            </div>

            {/* Player figurine, platform, labels */}
            <PlayerPlatform
              player={player}
              isCurrent={player.id === currentPlayerId}
              spotIntensity={theme.spotIntensity}
              coneWidth={theme.coneWidth}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
