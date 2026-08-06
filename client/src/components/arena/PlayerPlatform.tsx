import { motion } from "framer-motion";
import { Player } from "@/lib/mock-data";
import { PlayerFigurine } from "./PlayerFigurine";
import { LifeCore } from "./LifeCore";
import { Spotlight } from "./Spotlight";

interface PlayerPlatformProps {
  player: Player;
  isCurrent: boolean;
  spotIntensity: number;
  coneWidth: number;
}

/**
 * One player's column: spotlight (if current), abstract figurine,
 * metallic platform with life cores, name, and score.
 */
export function PlayerPlatform({ player, isCurrent, spotIntensity, coneWidth }: PlayerPlatformProps) {
  const isEliminated = !player.active;

  return (
    <motion.div
      layout
      animate={{
        opacity: isEliminated ? 0.38 : 1,
        y: isCurrent ? -7 : 0,
        scale: isCurrent ? 1.04 : 1,
      }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        cursor: "default",
      }}
    >
      {/* Spotlight cone — only for current player */}
      {isCurrent && (
        <Spotlight intensity={spotIntensity} coneWidth={coneWidth} />
      )}

      {/* Figurine */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <PlayerFigurine
          playerId={player.id}
          isCurrent={isCurrent}
          isEliminated={isEliminated}
        />
      </div>

      {/* Platform: main face with life cores */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: isCurrent ? 62 : 54,
          height: 12,
          background: isEliminated
            ? "linear-gradient(180deg, #222224 0%, #161618 100%)"
            : isCurrent
            ? "linear-gradient(180deg, #3C3C40 0%, #28282C 100%)"
            : "linear-gradient(180deg, #2E2E32 0%, #1E1E22 100%)",
          borderRadius: "2px 2px 0 0",
          borderTop: isCurrent
            ? "0.5px solid rgba(199,177,142,0.3)"
            : "0.5px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: isCurrent
            ? "0 0 14px rgba(199,177,142,0.1), 0 2px 8px rgba(0,0,0,0.6)"
            : "0 2px 8px rgba(0,0,0,0.5)",
        }}
      >
        <LifeCore active={!isEliminated && player.lives >= 1} />
        <LifeCore active={!isEliminated && player.lives >= 2} />
      </div>

      {/* Platform base — shadow depth */}
      <div
        style={{
          width: isCurrent ? 66 : 58,
          height: 5,
          background: "linear-gradient(180deg, #141416 0%, #0C0C0E 100%)",
          borderRadius: "0 0 3px 3px",
          boxShadow: "0 3px 10px rgba(0,0,0,0.7)",
          position: "relative",
          zIndex: 1,
        }}
      />

      {/* Name */}
      <p
        style={{
          marginTop: 6,
          fontSize: 10,
          fontFamily: "Inter, sans-serif",
          fontWeight: isCurrent ? 600 : 400,
          letterSpacing: "0.06em",
          color: isEliminated
            ? "#3C3C3F"
            : isCurrent
            ? "#F1EEE8"
            : "#706860",
          textAlign: "center",
          maxWidth: 72,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textDecoration: isEliminated ? "line-through" : "none",
          textDecorationColor: "#39393C",
          position: "relative",
          zIndex: 1,
        }}
      >
        {player.name}
      </p>

      {/* Points */}
      <p
        style={{
          marginTop: 2,
          fontSize: 10,
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
          letterSpacing: "0.08em",
          color: isEliminated
            ? "#2E2E31"
            : isCurrent
            ? "#C7B18E"
            : "#4E4640",
          position: "relative",
          zIndex: 1,
        }}
      >
        {player.points} pts
      </p>
    </motion.div>
  );
}
