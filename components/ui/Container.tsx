import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The one page gutter and max width used everywhere, so edges line up from page to page
export const containerClasses = "mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10";

export default function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(containerClasses, className)}>{children}</div>;
}
