interface LifeCoreProps {
  active: boolean;
}

/**
 * A physical life indicator — glowing warm stone when active,
 * dark cracked disc when lost. No heart icons.
 */
export function LifeCore({ active }: LifeCoreProps) {
  return (
    <div
      style={{
        width: 9,
        height: 9,
        borderRadius: '50%',
        flexShrink: 0,
        position: 'relative',
        background: active
          ? 'radial-gradient(circle at 35% 35%, #EAD9B2 0%, #C7B18E 55%, #9A7F60 100%)'
          : '#181818',
        boxShadow: active
          ? '0 0 5px rgba(199,177,142,0.65), 0 0 10px rgba(199,177,142,0.25), inset 0 1px 1px rgba(255,245,220,0.35)'
          : 'inset 0 0 4px rgba(0,0,0,0.9)',
        border: active ? 'none' : '1px solid #292929',
      }}
    >
      {/* Cracked appearance for lost life */}
      {!active && (
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
          viewBox="0 0 9 9"
        >
          <path
            d="M4.5 1.5 L3.2 4.5 L5.8 6 L4.2 8"
            stroke="#333"
            strokeWidth="0.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
