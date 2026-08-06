interface PlayerFigurineProps {
  playerId: number;
  isCurrent: boolean;
  isEliminated: boolean;
}

/**
 * Abstract 2.5D museum-sculpture figurine — CSS/SVG only.
 * Head ellipse + tapered torso trapezoid. No cartoon emoji, no realism.
 */
export function PlayerFigurine({ playerId, isCurrent, isEliminated }: PlayerFigurineProps) {
  const gId = `fig-${playerId}`;

  if (isEliminated) {
    return (
      <svg
        viewBox="0 0 44 78"
        width="34"
        height="60"
        style={{ opacity: 0.18, filter: 'grayscale(1)', display: 'block' }}
      >
        <ellipse cx="22" cy="13" rx="9" ry="10" fill="#1A1A1A" />
        <rect x="19.5" y="22" width="5" height="4" fill="#1A1A1A" />
        <path d="M14 26 L30 26 L32 68 L12 68 Z" fill="#1A1A1A" />
      </svg>
    );
  }

  const headFill  = isCurrent ? '#4C4C50' : '#313134';
  const bodyTop   = isCurrent ? '#424246' : '#2C2C2F';
  const bodyBot   = isCurrent ? '#30303380' : '#1E1E21';
  const shineAlpha = isCurrent ? '0.09' : '0.04';
  const W = isCurrent ? 44 : 38;
  const H = isCurrent ? 78 : 68;

  return (
    <svg viewBox="0 0 44 78" width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${gId}-body`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={bodyTop} />
          <stop offset="100%" stopColor={bodyBot} stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={`${gId}-head`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={headFill} />
          <stop offset="100%" stopColor={isCurrent ? '#38383C' : '#252527'} />
        </linearGradient>
        {/* Vertical shine streak */}
        <linearGradient id={`${gId}-shine`} x1="0.35" y1="0" x2="0.65" y2="1">
          <stop offset="0%" stopColor={`rgba(199,177,142,${shineAlpha})`} />
          <stop offset="50%" stopColor={`rgba(199,177,142,${parseFloat(shineAlpha) * 1.5})`} />
          <stop offset="100%" stopColor="rgba(199,177,142,0)" />
        </linearGradient>
      </defs>

      {/* Head */}
      <ellipse cx="22" cy="13" rx="9.5" ry="10.5" fill={`url(#${gId}-head)`} />

      {/* Neck */}
      <rect x="19.5" y="22.5" width="5" height="4.5" fill={bodyTop} />

      {/* Torso — tapered trapezoid, wider at base */}
      <path d="M14 27 L30 27 L33 70 L11 70 Z" fill={`url(#${gId}-body)`} />

      {/* Warm shine overlay */}
      <path d="M14 27 L30 27 L33 70 L11 70 Z" fill={`url(#${gId}-shine)`} />

      {/* Shoulder edge highlight */}
      <line
        x1="14" y1="31" x2="30" y2="31"
        stroke={isCurrent ? 'rgba(199,177,142,0.14)' : 'rgba(255,255,255,0.05)'}
        strokeWidth="0.6"
      />
    </svg>
  );
}
