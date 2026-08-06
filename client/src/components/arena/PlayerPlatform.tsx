import { motion } from "framer-motion";
import { Player } from "@/lib/mock-data";
import { PlayerFigurine } from "./PlayerFigurine";
import { LifeCore } from "./LifeCore";

interface PlayerPlatformProps {
  player: Player;
  isCurrent: boolean;
  floorGlow: number;
}

/**
 * One complete player unit — bust + pedestal — sized responsively.
 * The parent column controls width; we fill 100% of it.
 * Current player is scaled up 25% via CSS transform (preserves layout).
 */
export function PlayerPlatform({ player, isCurrent, floorGlow }: PlayerPlatformProps) {
  const isEliminated = !player.active;

  return (
    <motion.div
      layout="position"
      animate={{
        opacity: isEliminated ? 0.45 : 1,
        y: isCurrent ? -10 : 0,
        scale: isCurrent ? 1.24 : 1,
      }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        transformOrigin: "center bottom",
        width: "100%",
      }}
    >
      {/* ── Overhead light pool — soft radial, current player only ── */}
      {isCurrent && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-35%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "280%",
            paddingBottom: "280%",   // square aspect ratio trick
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(199,177,142,0.10) 0%, rgba(199,177,142,0.04) 45%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      {/* ── Bust wrapper — controls the display size via parent column width ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "88%",
          filter: isCurrent
            ? "drop-shadow(0 0 14px rgba(199,177,142,0.28)) drop-shadow(0 0 5px rgba(199,177,142,0.16))"
            : isEliminated
            ? "brightness(0.50) grayscale(0.75)"
            : "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
          transition: "filter 0.6s ease",
        }}
      >
        <PlayerFigurine
          playerId={player.id}
          isCurrent={isCurrent}
          isEliminated={isEliminated}
        />
      </div>

      {/* ── Floor glow strip under the bust ── */}
      <div
        aria-hidden
        style={{
          width: "110%",
          height: 10,
          marginTop: -2,
          background: `radial-gradient(ellipse 80% 100% at center, rgba(199,177,142,${
            isCurrent ? floorGlow * 1.7 : floorGlow * 0.7
          }) 0%, transparent 100%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Pedestal ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "95%",
          background: isEliminated
            ? "linear-gradient(180deg, #181820 0%, #0E0E14 100%)"
            : isCurrent
            ? "linear-gradient(180deg, #2E2E3C 0%, #1C1C28 100%)"
            : "linear-gradient(180deg, #222230 0%, #141420 100%)",
          borderTop: isCurrent
            ? "1px solid rgba(199,177,142,0.40)"
            : isEliminated
            ? "1px solid rgba(255,255,255,0.03)"
            : "1px solid rgba(255,255,255,0.08)",
          borderLeft:  isCurrent ? "1px solid rgba(199,177,142,0.12)" : "none",
          borderRight: isCurrent ? "1px solid rgba(199,177,142,0.12)" : "none",
          borderBottom: "none",
          borderRadius: "1px 1px 0 0",
          boxShadow: isCurrent
            ? "0 6px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(199,177,142,0.14)"
            : "0 4px 20px rgba(0,0,0,0.65)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(5px, 0.7vh, 9px)",
          padding: "clamp(8px, 1.2vh, 14px) 8px clamp(10px, 1.4vh, 16px)",
        }}
      >
        {/* Name */}
        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "clamp(10px, 1.05vw, 16px)",
            fontWeight: isCurrent ? 700 : 500,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: isEliminated ? "#3A3A3E" : isCurrent ? "#F1EEE8" : "#9A8878",
            textAlign: "center",
            width: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1,
            paddingLeft: 4,
            paddingRight: 4,
          }}
        >
          {player.name}
        </p>

        {/* Life cores */}
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(10px, 1.2vw, 20px)" }}>
          <LifeCore active={!isEliminated && player.lives >= 1} size={16} />
          <LifeCore active={!isEliminated && player.lives >= 2} size={16} />
        </div>

        {/* Score */}
        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "clamp(14px, 1.5vw, 22px)",
            fontWeight: 700,
            letterSpacing: "0.02em",
            color: isEliminated ? "#28282C" : isCurrent ? "#C7B18E" : "#5A5048",
            lineHeight: 1,
          }}
        >
          {player.points}
          <span
            style={{
              fontSize: "0.5em",
              fontWeight: 400,
              marginLeft: 3,
              opacity: 0.55,
              letterSpacing: "0.08em",
            }}
          >
            pts
          </span>
        </p>

        {/* Eliminated label */}
        {isEliminated && (
          <p
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "clamp(7px, 0.65vw, 9px)",
              fontWeight: 500,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#32323A",
              marginTop: -2,
            }}
          >
            eliminated
          </p>
        )}
      </div>

      {/* Pedestal base — shadow strip */}
      <div
        style={{
          width: "calc(95% + 6px)",
          height: 5,
          background: "linear-gradient(180deg, #0C0C12 0%, #06060C 100%)",
          borderRadius: "0 0 3px 3px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.8)",
          zIndex: 1,
        }}
      />
    </motion.div>
  );
}
