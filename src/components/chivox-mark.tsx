/**
 * Chivox brand mark — two overlapping circles (C + G), no background.
 * Drop-in SVG; works on any background color.
 */
export function ChivoxMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 64"
      width={(size * 100) / 64}
      height={size}
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id="cm-l" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1D72E8" />
          <stop offset="100%" stopColor="#1D72E8" />
        </linearGradient>
        <linearGradient id="cm-r" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#F01681" />
          <stop offset="100%" stopColor="#F01681" />
        </linearGradient>

        {/* Left circle: carve a crescent / open C */}
        <mask id="cm-mask-l">
          <rect width="100" height="64" fill="white" />
          <circle cx="46" cy="32" r="16" fill="black" />
        </mask>

        {/* Right circle: horizontal slot + half-disk → open smile */}
        <mask id="cm-mask-r">
          <rect width="100" height="64" fill="white" />
          <rect x="46" y="30" width="44" height="4" fill="black" />
          <path d="M 53 32 a 15 15 0 0 0 30 0 Z" fill="black" />
        </mask>

        {/* Clip the intersection slice to the left disk's footprint */}
        <clipPath id="cm-clip-l">
          <circle cx="32" cy="32" r="28" />
        </clipPath>
      </defs>

      {/* Left disk */}
      <circle cx="32" cy="32" r="28" fill="url(#cm-l)" mask="url(#cm-mask-l)" />
      {/* Right disk */}
      <circle cx="68" cy="32" r="28" fill="url(#cm-r)" mask="url(#cm-mask-r)" />
      {/* Intersection: right disk re-drawn inside left disk's clip */}
      <g clipPath="url(#cm-clip-l)">
        <circle cx="68" cy="32" r="28" fill="#0D1B82" mask="url(#cm-mask-r)" />
      </g>
    </svg>
  );
}
