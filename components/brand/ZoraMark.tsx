import { useId } from "react";

// The Zora Stream emblem: an italic Z with a play button set into its diagonal.
// `speedLines` adds the trailing speed streaks for larger, standalone uses.
export default function ZoraMark({
  size = 32,
  speedLines = false,
  className,
  title,
}: {
  size?: number;
  speedLines?: boolean;
  className?: string;
  title?: string;
}) {
  // Unique gradient/mask ids so several logos on one page don't clash
  const id = useId().replace(/:/g, "");
  const width = speedLines ? (size * 86) / 64 : size;

  return (
    <svg
      viewBox={speedLines ? "0 0 86 64" : "0 0 64 64"}
      width={width}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff5a4e" />
          <stop offset="0.5" stopColor="#e3121b" />
          <stop offset="1" stopColor="#990812" />
        </linearGradient>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dde1e7" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#9aa3ad" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}h`} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="#fff" />
          <circle cx="32" cy="32" r="14.5" fill="#000" />
        </mask>
      </defs>

      {speedLines && (
        <g fill={`url(#${id}s)`}>
          <path d="M58 19.5 L84 19.5 L83 21.5 L57 21.5 Z" />
          <path d="M54.5 25 L76 25 L75 27 L53.5 27 Z" />
          <path d="M50 42 L80 42 L79 44 L49 44 Z" />
        </g>
      )}

      {/* Italic Z with a round window cut through the diagonal */}
      <g mask={`url(#${id}h)`}>
        <g transform="translate(6.5 0) skewX(-12)">
          <path fill={`url(#${id}r)`} d="M11 9 H55 V15.5 L24.5 47.5 H53 V55 H9 V48.5 L39.5 16.5 H11 Z" />
          <path
            fill="none"
            stroke="#ffb3aa"
            strokeOpacity=".7"
            strokeWidth=".9"
            strokeLinecap="round"
            d="M11.6 9.6 H54.4 M25.4 48.1 H52.4"
          />
        </g>
      </g>

      {/* Bezel and play button */}
      <circle cx="32" cy="32" r="10.2" fill="#141414" />
      <circle cx="32" cy="32" r="11.5" fill="none" stroke={`url(#${id}r)`} strokeWidth="3" />
      <path
        d="M29 26.2 L29 37.8 L38.8 32 Z"
        fill={`url(#${id}p)`}
        stroke={`url(#${id}p)`}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
