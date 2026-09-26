import { Exo_2 } from "next/font/google";
import ZoraMark from "./ZoraMark";

// Brand typeface for the wordmark only; the rest of the app keeps its UI font
const exo = Exo_2({ subsets: ["latin"], weight: ["800"], style: ["italic"], display: "swap" });

export const BRAND_NAME = "Zora Stream";

// Emblem + "ZORA STREAM" wordmark. `size` is the emblem height in pixels.
export default function ZoraLogo({
  size = 30,
  speedLines = false,
  className = "",
}: {
  size?: number;
  speedLines?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label={BRAND_NAME} role="img">
      <ZoraMark size={size} speedLines={speedLines} />
      <span
        aria-hidden
        className={`${exo.className} leading-none tracking-wide whitespace-nowrap`}
        style={{ fontSize: size * 0.62 }}
      >
        <span className="text-white">ZORA</span>
        <span className="text-[#e3121b] ml-[0.28em]">STREAM</span>
      </span>
    </span>
  );
}
