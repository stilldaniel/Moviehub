import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The one page gutter used everywhere, so edges line up from page to page. Content spans the full
// width like a streaming app; long text sets its own reading width (e.g. max-w-2xl, max-w-3xl).
export const containerClasses = "w-full px-4 sm:px-6 lg:px-10";

export default function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(containerClasses, className)}>{children}</div>;
}
