import { Link } from "wouter";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PlayerFigurine } from "@/components/arena/PlayerFigurine";
import { unlock, toggleMute, isMuted, playHover, playClick } from "@/lib/arena-audio";

// ── Design tokens — shared with the arena, so the doorway feels like the
//    same room as the game itself ──────────────────────────────────────────
const C = {
  bg: "#111014",
  warmWhite: "#F1EEE8",
  bronze: "#C7B18E",
  muted: "#A2907C",
  dim: "#3A3A3E",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
};
const sans: React.CSSProperties = {
  fontFamily: "'Inter', system-ui, sans-serif",
};

export default function Home() {
  const [muted, setMuted] = useState(false);

  // Autoplay policy: the ambient drone can only start after the visitor
  // has interacted with the page at least once. First click/tap anywhere
  // (outside the mute button itself) unlocks it, then removes itself.
  useEffect(() => {
    const onFirstInteract = () => unlock();
    window.addEventListener("pointerdown", onFirstInteract, { once: true });
    return () => window.removeEventListener("pointerdown", onFirstInteract);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════
          Empty arena — ten dormant pedestals, unlit, waiting.
          Signature element: this is the SAME stage the audience screen
          uses, just before anyone has stepped onto it.
      ══════════════════════════════════════════════════════════════ */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "38vh",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: "clamp(4px, 1.4vw, 22px)",
          padding: "0 4vw 6vh",
          opacity: 0.72,
          filter: "brightness(0.8) saturate(0.75)",
          pointerEvents: "none",
        }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 1.1, ease: "easeOut" }}
            style={{ width: "clamp(28px, 5.4vw, 70px)" }}
          >
            <PlayerFigurine playerId={i} isCurrent={false} isEliminated={false} />
          </motion.div>
        ))}
      </div>

      {/* Floor line, echoing the arena's stage edge */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "38vh",
          left: "5%",
          right: "5%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(199,177,142,0.16) 50%, transparent 100%)",
        }}
      />

      {/* ══════════════════════════════════════════════════════════════
          Overhead spotlight — settles on the title on load, the same
          warm cone that marks the current player mid-game.
      ══════════════════════════════════════════════════════════════ */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "60vw",
          height: "62vh",
          pointerEvents: "none",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scaleY: 0.15, y: -80 }}
          animate={{ opacity: 1, scaleY: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: "100%",
            height: "100%",
            transformOrigin: "50% 0%",
            background:
              "radial-gradient(ellipse 50% 60% at 50% 0%, rgba(199,177,142,0.30) 0%, rgba(199,177,142,0.10) 45%, transparent 75%)",
          }}
        />
      </div>

      {/* Ignition flash — a brief bright pulse as the light "switches on" */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "34vw",
          height: "40vh",
          pointerEvents: "none",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0] }}
          transition={{ delay: 0.15, duration: 0.5, times: [0, 0.3, 1] }}
          style={{
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(255,235,200,0.55) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Drifting dust in the light column */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "34vw",
          height: "60vh",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {Array.from({ length: 14 }).map((_, i) => {
          const left = 10 + ((i * 37) % 80);
          const delay = 1.4 + (i % 7) * 0.6;
          const dur = 5 + (i % 5);
          return (
            <motion.div
              key={i}
              initial={{ y: "-10%", opacity: 0 }}
              animate={{ y: "110%", opacity: [0, 0.5, 0] }}
              transition={{ delay, duration: dur, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute",
                left: `${left}%`,
                width: 2,
                height: 2,
                borderRadius: "50%",
                background: "rgba(241,232,210,0.6)",
              }}
            />
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          Title block
      ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 24px",
          zIndex: 2,
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          style={{
            ...sans,
            color: C.muted,
            fontSize: "clamp(11px, 1vw, 14px)",
            fontWeight: 600,
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            marginBottom: "clamp(14px, 2vh, 24px)",
          }}
        >
          Ten enter · One remains
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 1.3, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{
            ...serif,
            color: C.warmWhite,
            fontSize: "clamp(2.6rem, 7.2vw, 6.4rem)",
            fontWeight: 600,
            letterSpacing: "0.01em",
            lineHeight: 1.02,
            margin: 0,
            textShadow: "0 0 60px rgba(199,177,142,0.18)",
          }}
        >
          The Last One Standing
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 1.05, duration: 0.7, ease: "easeOut" }}
          style={{
            width: 96,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(199,177,142,0.6), transparent)",
            margin: "clamp(20px, 3vh, 32px) 0",
          }}
        />

        {/* ── Two portals — styled as pedestal-grade stone panels,
               not generic rounded cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.7 }}
          style={{
            display: "flex",
            gap: "clamp(14px, 2vw, 28px)",
            width: "100%",
            maxWidth: 640,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Portal href="/admin" label="Host Panel" desc="Run the show — select questions, judge answers, manage players." cta="Enter" accent="bronze" />
          <Portal href="/audience" label="Audience View" desc="Open on the big screen. Updates live as the host acts." cta="Open" accent="cool" />
        </motion.div>
      </div>

      <p
        style={{
          ...sans,
          position: "absolute",
          bottom: 14,
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.18)",
          fontSize: 10,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          zIndex: 2,
        }}
      >
        Prototype build
      </p>

      {/* ── Discreet mute toggle — top-right, low-key until hovered ── */}
      <button
        onClick={() => setMuted(toggleMute())}
        aria-label={muted ? "Unmute ambience" : "Mute ambience"}
        style={{
          position: "absolute",
          top: 18,
          right: 20,
          zIndex: 3,
          width: 30,
          height: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: "50%",
          color: "rgba(255,255,255,0.4)",
          fontSize: 13,
          cursor: "pointer",
          transition: "color 0.2s ease, border-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "rgba(241,238,232,0.85)";
          e.currentTarget.style.borderColor = "rgba(199,177,142,0.45)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(255,255,255,0.4)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
        }}
      >
        {muted ? "🔇" : "🔊"}
      </button>
    </div>
  );
}

// ── Portal — a stone doorway, matching the pedestal material language ──────
function Portal({
  href,
  label,
  desc,
  cta,
  accent,
}: {
  href: string;
  label: string;
  desc: string;
  cta: string;
  accent: "bronze" | "cool";
}) {
  const glow = accent === "bronze" ? "rgba(220,180,100,0.45)" : "rgba(160,170,220,0.30)";
  const border = accent === "bronze" ? "rgba(220,180,100,0.35)" : "rgba(160,170,220,0.22)";
  const borderHover = accent === "bronze" ? "rgba(230,195,130,0.75)" : "rgba(180,190,235,0.55)";
  const label2 = accent === "bronze" ? C.bronze : "#A8AED0";

  return (
    <Link
      href={href}
      style={{ textDecoration: "none", flex: "1 1 260px", maxWidth: 300 }}
      onClick={() => playClick()}
    >
      <motion.div
        initial="rest"
        whileHover="hover"
        animate="rest"
        onHoverStart={() => playHover()}
        style={{
          position: "relative",
          padding: "28px 22px 24px",
          background: "linear-gradient(180deg, #242028 0%, #16141A 100%)",
          border: `1px solid ${border}`,
          borderTop: `2px solid ${border}`,
          boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
          cursor: "pointer",
          textAlign: "left",
          overflow: "hidden",
        }}
      >
        {/* Hover state: lift + brighten + stronger border, driven by variants
            so every sub-element reacts to the SAME hover, not just this div */}
        <motion.div
          variants={{
            rest: { y: 0, boxShadow: "0 12px 40px rgba(0,0,0,0.7)" },
            hover: { y: -4, boxShadow: `0 16px 46px rgba(0,0,0,0.75), 0 0 0 1px ${borderHover}, inset 0 0 40px ${glow}` },
          }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        />

        <motion.div
          variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
          transition={{ duration: 0.3 }}
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${glow} 0%, transparent 70%)`,
          }}
        />

        <p
          style={{
            ...sans,
            position: "relative",
            color: label2,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          {label}
        </p>
        <p
          style={{
            ...sans,
            position: "relative",
            color: "rgba(241,238,232,0.72)",
            fontSize: 13,
            lineHeight: 1.55,
            margin: 0,
            marginBottom: 14,
          }}
        >
          {desc}
        </p>

        {/* CTA — slides in and brightens on hover, doesn't just fade */}
        <motion.p
          variants={{
            rest: { opacity: 0.55, x: -4 },
            hover: { opacity: 1, x: 0 },
          }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{
            ...sans,
            position: "relative",
            color: label2,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {cta}
          <motion.span
            variants={{ rest: { x: 0 }, hover: { x: 4 } }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ display: "inline-block" }}
          >
            →
          </motion.span>
        </motion.p>
      </motion.div>
    </Link>
  );
}
