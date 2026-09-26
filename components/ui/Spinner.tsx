import { cn } from "@/lib/utils";

// Page-level loading indicator
export default function Spinner({ className }: { className?: string }) {
  return (
    <div role="status" className={cn("flex min-h-[60vh] items-center justify-center", className)}>
      <span className="h-8 w-8 rounded-full border-2 border-brand border-t-transparent animate-spin motion-reduce:animate-none" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
