import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Standard panel: surface background, hairline border, consistent radius and padding
export default function Card({
  as: Tag = "div",
  className,
  children,
}: {
  as?: "div" | "section";
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={cn("rounded-2xl bg-surface ring-1 ring-line p-5 sm:p-6", className)}>{children}</Tag>;
}
