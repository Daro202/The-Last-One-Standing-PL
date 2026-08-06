interface LifeCoreProps {
  active: boolean;
  /** diameter in px */
  size?: number;
}

/**
 * Physical life indicator — glowing warm stone when active,
 * dark cracked disc when lost. No heart icons.
 */
export function LifeCore({ active, size = 16 }: LifeCoreProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        position: "relative",
        background: active
          ? `radial-gradient(circle at 35% 35%, #F0DCB2 0%, #C7B18E 50%, #9A7F60 100%)`
          : "#141418",
        boxShadow: active
          ? `0 0 ${size * 0.5}px rgba(199,177,142,0.7), 0 0 ${size}px rgba(199,177,142,0.25), inset 0 1px 2px rgba(255,245,220,0.4)`
          : `inset 0 0 ${size * 0.35}px rgba(0,0,0,0.95)`,
        border: active ? "none" : `1px solid #252528`,
        transition: "all 0.4s ease",
      }}
    >
      {!active && (
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
          viewBox="0 0 16 16"
        >
          <path
            d="M8 3 L6 8 L10 11 L7.5 14.5"
            stroke="#2E2E32"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 5 L9 8"
            stroke="#2A2A2E"
            strokeWidth="0.8"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
}
