"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// A horizontal row of cards that runs to the screen edges, with previous/next arrows on
// devices that can hover. Arrows only appear when there's more to scroll in that direction.
export default function ScrollRow({ children, label, className }: { children: ReactNode; label?: string; className?: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  // Re-check when the row resizes (window resize, cards loading in)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [update]);

  const scroll = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="scroll-row relative" onMouseEnter={update}>
      <div
        ref={scrollerRef}
        onScroll={update}
        role={label ? "region" : undefined}
        aria-label={label}
        className={cn("poster-row", className)}
      >
        {children}
      </div>
      <button type="button" aria-label="Scroll left" tabIndex={canLeft ? 0 : -1} onClick={() => scroll(-1)} className={cn("row-arrow row-arrow-left", canLeft && "is-available")}>
        <span><ChevronLeft size={22} /></span>
      </button>
      <button type="button" aria-label="Scroll right" tabIndex={canRight ? 0 : -1} onClick={() => scroll(1)} className={cn("row-arrow row-arrow-right", canRight && "is-available")}>
        <span><ChevronRight size={22} /></span>
      </button>
    </div>
  );
}
