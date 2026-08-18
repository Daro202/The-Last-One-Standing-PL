import { motion } from "framer-motion";
import { Player } from "@/lib/mock-data";
import { PlayerFigurine } from "./PlayerFigurine";
import { LifeCore } from "./LifeCore";

interface PlayerPlatformProps {
  player: Player;
  isCurrent: boolean;
  floorGlow: number;
}

export function PlayerPlatform({ player, isCurrent, floorGlow }: PlayerPlatformProps) {
  const isEliminated = !player.active;

  return (
    <motion.div
      layout="position"
      animate={{
        opacity: isEliminated ? 0.38 : 1,
        y: isCurrent ? -12 : 0,
        scale: isCurrent ? 1.22 : 1,
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
      {/* Overhead soft light — current player only */}
      {isCurrent && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-50%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "260%",
            aspectRatio: "1",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,210,140,0.13) 0%, rgba(255,210,140,0.05) 45%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      {/* Bust wrapper */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "86%",
          filter: isCurrent
            ? "drop-shadow(0 0 16px rgba(220,180,100,0.40)) drop-shadow(0 0 5px rgba(220,180,100,0.20))"
            : isEliminated
            ? "brightness(0.40)"
            : "drop-shadow(0 3px 10px rgba(0,0,0,0.70))",
          transition: "filter 0.6s ease",
        }}
      >
        <PlayerFigurine
          playerId={player.id}
          isCurrent={isCurrent}
          isEliminated={isEliminated}
        />
      </div>

      {/* Floor glow strip */}
      <div
        aria-hidden
        style={{
          width: "120%",
          height: 10,
          marginTop: -3,
          background: `radial-gradient(ellipse 70% 100% at center, rgba(199,177,142,${
            isCurrent ? floorGlow * 2.2 : floorGlow * 0.6
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
          width: "94%",
          background: isEliminated
            ? "linear-gradient(180deg, #141418 0%, #0C0C10 100%)"
            : isCurrent
            ? "linear-gradient(180deg, #2A2830 0%, #18161E 100%)"
            : "linear-gradient(180deg, #202028 0%, #121218 100%)",
          borderTop: isCurrent
            ? "2px solid rgba(220,180,100,0.55)"
            : isEliminated
            ? "1px solid rgba(255,255,255,0.04)"
            : "1px solid rgba(180,180,210,0.18)",
          borderLeft:  isCurrent ? "1px solid rgba(220,180,100,0.15)" : "none",
          borderRight: isCurrent ? "1px solid rgba(220,180,100,0.15)" : "none",
          borderBottom: "none",
          borderRadius: "1px 1px 0 0",
          boxShadow: isCurrent
            ? "0 8px 40px rgba(0,0,0,0.85), inset 0 1px 0 rgba(220,180,100,0.18)"
            : "0 4px 20px rgba(0,0,0,0.70)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(5px, 0.6vh, 8px)",
          padding: "clamp(8px, 1vh, 13px) 6px clamp(10px, 1.2vh, 15px)",
        }}
      >
        {/* Name */}
        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "clamp(10px, 1.0vw, 15px)",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: isEliminated
              ? "#2E2E32"
              : isCurrent
              ? "#F5F0E8"
              : "#C8C0D0",
            textAlign: "center",
            width: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1,
            paddingLeft: 3,
            paddingRight: 3,
          }}
        >
          {player.name}
        </p>

        {/* Life cores */}
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 1vw, 18px)" }}>
          <LifeCore active={!isEliminated && player.lives >= 1} size={15} />
          <LifeCore active={!isEliminated && player.lives >= 2} size={15} />
        </div>

        {/* Score */}
        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "clamp(13px, 1.4vw, 21px)",
            fontWeight: 700,
            color: isEliminated
              ? "#242428"
              : isCurrent
              ? "#DCC080"
              : "#7A7090",
            lineHeight: 1,
          }}
        >
          {player.points}
          <span
            style={{
              fontSize: "0.48em",
              fontWeight: 400,
              marginLeft: 3,
              opacity: 0.55,
              letterSpacing: "0.08em",
            }}
          >
            pkt
          </span>
        </p>

        {isEliminated && (
          <p
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "clamp(7px, 0.6vw, 9px)",
              fontWeight: 500,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "#2A2A2E",
              marginTop: -2,
            }}
          >
            eliminated
          </p>
        )}
      </div>

      {/* Base strip */}
      <div
        style={{
          width: "calc(94% + 6px)",
          height: 5,
          background: "#080810",
          borderRadius: "0 0 3px 3px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.9)",
          zIndex: 1,
        }}
      />
    </motion.div>
  );
}
