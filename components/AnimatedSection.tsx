"use client";

import { motion } from "framer-motion";
import { easeSoft } from "./MotionProvider";

export default function AnimatedSection({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      // Start a little before the row scrolls fully into view so it never feels late
      viewport={{ once: true, amount: 0.1, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.8, ease: easeSoft }}
    >
      {children}
    </motion.div>
  );
}
