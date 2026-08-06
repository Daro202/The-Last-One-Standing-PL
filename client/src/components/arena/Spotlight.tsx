import { motion, AnimatePresence } from "framer-motion";

interface SpotlightProps {
  /** 0–1, increases with round intensity */
  intensity: number;
  /** px width of the cone at the figurine base */
  coneWidth?: number;
}

/**
 * A downward-pointing cone of light from above, rendered as a
 * CSS gradient + clip-path. Only rendered for the current player.
 */
export function Spotlight({ intensity, coneWidth = 120 }: SpotlightProps) {
  // Cone shrinks slightly at top to give the narrow-beam look
  const topPct  = Math.max(10, 50 - coneWidth / 4);
  const botPct  = Math.min(90, 50 + coneWidth / 4);

  return (
    <AnimatePresence>
      <motion.div
        key="spotlight"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: coneWidth + 40,
          height: "100%",
          background: [
            `linear-gradient(180deg,`,
            `  rgba(199,177,142,0) 0%,`,
            `  rgba(199,177,142,${(intensity * 0.45).toFixed(3)}) 55%,`,
            `  rgba(199,177,142,${intensity.toFixed(3)}) 100%`,
            `)`,
          ].join(" "),
          clipPath: `polygon(${topPct}% 0%, ${botPct}% 0%, 100% 100%, 0% 100%)`,
          pointerEvents: "none",
        }}
      />
    </AnimatePresence>
  );
}
