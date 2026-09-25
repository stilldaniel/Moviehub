"use client";

import { MotionConfig } from "framer-motion";

// Shared easing for framer-motion, matching --ease-soft in globals.css
export const easeSoft = [0.22, 1, 0.36, 1] as const;

// Honour the OS "reduce motion" setting for every framer-motion animation
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: easeSoft }}>
      {children}
    </MotionConfig>
  );
}
