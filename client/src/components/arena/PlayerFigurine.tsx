interface PlayerFigurineProps {
  playerId: number;
  isCurrent: boolean;
  isEliminated: boolean;
}

/**
 * Abstract 2.5D museum-sculpture bust — CSS/SVG only.
 * Wide shoulders, prominent head, substantial chest.
 * Monumental graphite sculpture — not a chess pawn, not an emoji.
 * Width is 100 % of the wrapper div; caller controls display size.
 */
export function PlayerFigurine({ playerId, isCurrent, isEliminated }: PlayerFigurineProps) {
  const gId = `bust-${playerId}`;

  if (isEliminated) {
    return (
      <svg
        viewBox="0 0 130 162"
        style={{ display: "block", width: "100%", height: "auto", opacity: 0.22, filter: "grayscale(1) brightness(0.45)" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <ellipse cx="65" cy="44" rx="30" ry="33" fill="#111114" />
        <path d="M54 76 L76 76 L79 94 L51 94 Z" fill="#111114" />
        <path
          d="M51 94 C 38 89, 18 88, 4 99 L 4 160 L 126 160 L 126 99 C 112 88, 92 89, 79 94 Z"
          fill="#111114"
        />
      </svg>
    );
  }

  const headTop   = isCurrent ? "#525259" : "#33333C";
  const headBot   = isCurrent ? "#383840" : "#20202A";
  const bodyTop   = isCurrent ? "#424249" : "#2A2A32";
  const bodyBot   = isCurrent ? "#28282F" : "#16161E";
  const shineAmt  = isCurrent ? 0.12 : 0.04;
  const rimAmt    = isCurrent ? 0.20 : 0;

  return (
    <svg
      viewBox="0 0 130 162"
      style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Head: lighter at top-left (overhead + front light) */}
        <linearGradient id={`${gId}-hd`} x1="0.25" y1="0" x2="0.75" y2="1">
          <stop offset="0%"   stopColor={headTop} />
          <stop offset="100%" stopColor={headBot} />
        </linearGradient>

        {/* Body: top of shoulders lighter, chest darker */}
        <linearGradient id={`${gId}-bd`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%"   stopColor={bodyTop} />
          <stop offset="100%" stopColor={bodyBot} />
        </linearGradient>

        {/* Centre warm shine — vertical streak, wider at top */}
        <radialGradient id={`${gId}-sh`} cx="50%" cy="30%" rx="45%" ry="50%">
          <stop offset="0%"   stopColor={`rgba(199,177,142,${shineAmt * 1.4})`} />
          <stop offset="60%"  stopColor={`rgba(199,177,142,${shineAmt * 0.6})`} />
          <stop offset="100%" stopColor="rgba(199,177,142,0)" />
        </radialGradient>

        {/* Left rim light — bronze edge for current player */}
        <linearGradient id={`${gId}-rim`} x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0%"  stopColor={`rgba(199,177,142,${rimAmt})`} />
          <stop offset="35%" stopColor={`rgba(199,177,142,${rimAmt * 0.3})`} />
          <stop offset="100%" stopColor="rgba(199,177,142,0)" />
        </linearGradient>
      </defs>

      {/* ── Head ── */}
      <ellipse cx="65" cy="44" rx="30" ry="33" fill={`url(#${gId}-hd)`} />

      {/* Forward-facing plane — subtle lighter oval on the front of the head */}
      <ellipse
        cx="65" cy="46"
        rx="19" ry="21"
        fill={`rgba(255,255,255,${isCurrent ? 0.05 : 0.025})`}
      />

      {/* ── Neck ── */}
      <path d="M54 76 L76 76 L79 95 L51 95 Z" fill={bodyTop} />

      {/* ── Shoulders + chest — the WIDE monumental element ──
          Shoulders sweep from x=3 to x=127, nearly the full viewBox.
          Cubic-bezier curves drape naturally from neck to shoulder tip.
      ── */}
      <path
        d="
          M 51 95
          C 37 90, 17 89, 3 100
          L 3 160
          L 127 160
          L 127 100
          C 113 89, 93 90, 79 95
          Z
        "
        fill={`url(#${gId}-bd)`}
      />

      {/* Left shoulder top-surface highlight — catches overhead light */}
      <path
        d="M 51 95 C 37 90, 17 89, 3 100 C 14 93, 30 90, 51 95 Z"
        fill={`rgba(255,255,255,${isCurrent ? 0.06 : 0.03})`}
      />

      {/* Right shoulder top-surface highlight */}
      <path
        d="M 79 95 C 100 90, 116 93, 127 100 C 113 89, 93 90, 79 95 Z"
        fill={`rgba(255,255,255,${isCurrent ? 0.06 : 0.03})`}
      />

      {/* Warm centre shine overlay */}
      <path
        d="M 51 95 C 37 90, 17 89, 3 100 L 3 160 L 127 160 L 127 100 C 113 89, 93 90, 79 95 Z"
        fill={`url(#${gId}-sh)`}
      />

      {/* Bronze rim light — left side, current player only */}
      {isCurrent && (
        <path
          d="M 51 95 C 37 90, 17 89, 3 100 L 3 160 L 127 160 L 127 100 C 113 89, 93 90, 79 95 Z"
          fill={`url(#${gId}-rim)`}
        />
      )}

      {/* Chest shadow — adds mid-body depth */}
      <ellipse cx="65" cy="130" rx="38" ry="11" fill="rgba(0,0,0,0.16)" />
    </svg>
  );
}
