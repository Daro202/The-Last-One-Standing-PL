interface PlayerFigurineProps {
  playerId: number;
  isCurrent: boolean;
  isEliminated: boolean;
}

/**
 * Museum-quality stone bust — deliberately visible against dark stage.
 * Regular players: cool stone grey. Current player: warm limestone / bronze.
 * Eliminated: near-black, clearly dead.
 */
export function PlayerFigurine({ playerId, isCurrent, isEliminated }: PlayerFigurineProps) {
  const gId = `bust-${playerId}`;

  // ── Eliminated — nearly invisible dark silhouette ──
  if (isEliminated) {
    return (
      <svg
        viewBox="0 0 130 162"
        style={{ display: "block", width: "100%", height: "auto" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <ellipse cx="65" cy="44" rx="30" ry="33" fill="#1A1A1E" />
        <path d="M54 76 L76 76 L79 95 L51 95 Z" fill="#1A1A1E" />
        <path
          d="M51 95 C37 90,17 89,3 100 L3 160 L127 160 L127 100 C113 89,93 90,79 95 Z"
          fill="#1A1A1E"
        />
      </svg>
    );
  }

  // ── Colour palette per state ──
  // Regular: cool pale stone — clearly visible on dark background
  // Current: warm limestone with amber/bronze warmth — obviously different
  const headHigh  = isCurrent ? "#A08B6A" : "#6E6E7E";
  const headMid   = isCurrent ? "#7A6248" : "#565666";
  const headShad  = isCurrent ? "#4E3E2C" : "#363646";
  const bodyHigh  = isCurrent ? "#8C7858" : "#626270";
  const bodyMid   = isCurrent ? "#6A5640" : "#484858";
  const bodyShad  = isCurrent ? "#3E2E1E" : "#282838";
  const rimColor  = isCurrent ? "rgba(255,210,140,0.28)" : "rgba(200,200,220,0.08)";
  const faceLight = isCurrent ? "rgba(255,230,160,0.12)" : "rgba(255,255,255,0.07)";
  const shoulderHL= isCurrent ? "rgba(255,220,140,0.14)" : "rgba(255,255,255,0.06)";

  return (
    <svg
      viewBox="0 0 130 162"
      style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Head: 3-stop to give hemisphere depth */}
        <linearGradient id={`${gId}-hd`} x1="0.25" y1="0" x2="0.75" y2="1">
          <stop offset="0%"   stopColor={headHigh} />
          <stop offset="55%"  stopColor={headMid} />
          <stop offset="100%" stopColor={headShad} />
        </linearGradient>

        {/* Body: overhead light hits shoulders, chest falls into shadow */}
        <linearGradient id={`${gId}-bd`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%"   stopColor={bodyHigh} />
          <stop offset="50%"  stopColor={bodyMid} />
          <stop offset="100%" stopColor={bodyShad} />
        </linearGradient>

        {/* Overhead centre shine — brightest at top-centre of bust */}
        <radialGradient id={`${gId}-glow`} cx="50%" cy="20%" rx="55%" ry="45%">
          <stop offset="0%"   stopColor={isCurrent ? "rgba(255,220,160,0.22)" : "rgba(255,255,255,0.10)"} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>

        {/* Left rim — edge light from stage side */}
        <linearGradient id={`${gId}-rim`} x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0%"   stopColor={rimColor} />
          <stop offset="40%"  stopColor="rgba(0,0,0,0)" />
        </linearGradient>
      </defs>

      {/* ── Head ── */}
      <ellipse cx="65" cy="44" rx="30" ry="33" fill={`url(#${gId}-hd)`} />

      {/* Face catch-light — forward-facing plane */}
      <ellipse cx="64" cy="46" rx="18" ry="21" fill={faceLight} />

      {/* ── Neck ── */}
      <path d="M54 76 L76 76 L79 95 L51 95 Z" fill={bodyMid} />

      {/* ── Wide shoulders + chest ──
          Sweeps from x=3 to x=127 — nearly full viewBox width.
          Cubic bezier drape for natural shoulder curvature.
      ── */}
      <path
        d="M51 95 C37 90,17 89,3 100 L3 160 L127 160 L127 100 C113 89,93 90,79 95 Z"
        fill={`url(#${gId}-bd)`}
      />

      {/* Left shoulder highlight — top surface catches overhead */}
      <path
        d="M51 95 C37 90,17 89,3 100 C14 93,30 90,51 95 Z"
        fill={shoulderHL}
      />
      {/* Right shoulder highlight */}
      <path
        d="M79 95 C100 90,116 93,127 100 C113 89,93 90,79 95 Z"
        fill={shoulderHL}
      />

      {/* Centre overhead glow overlay */}
      <path
        d="M51 95 C37 90,17 89,3 100 L3 160 L127 160 L127 100 C113 89,93 90,79 95 Z"
        fill={`url(#${gId}-glow)`}
      />

      {/* Left rim light overlay */}
      <path
        d="M51 95 C37 90,17 89,3 100 L3 160 L127 160 L127 100 C113 89,93 90,79 95 Z"
        fill={`url(#${gId}-rim)`}
      />

      {/* Chest/base shadow for depth */}
      <ellipse cx="65" cy="148" rx="40" ry="9" fill="rgba(0,0,0,0.22)" />
    </svg>
  );
}
