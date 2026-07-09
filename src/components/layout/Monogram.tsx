interface MonogramProps {
  /** Rendered height in px; width scales with the 168x64 viewBox. */
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * The AMC monogram — copper line-art, one <path> so a single pathLength
 * animation draws the whole mark (intro palm reveal + navbar hover redraw).
 */
export default function Monogram({ size = 28, strokeWidth = 5, className = "" }: MonogramProps) {
  return (
    <svg
      viewBox="0 0 168 64"
      height={size}
      width={(size * 168) / 64}
      fill="none"
      aria-label="AMC monogram"
      role="img"
      className={`monogram-svg ${className}`}
    >
      <path
        className="monogram-path"
        d="M8 56 L26 8 L44 56 M16 38 L36 38 M56 56 L56 8 L74 34 L92 8 L92 56 M156 16 A22 22 0 1 0 156 48"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
