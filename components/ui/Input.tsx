import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type InputProps = ComponentPropsWithoutRef<"input"> & { icon?: ReactNode; label?: string };

// Text input with an optional leading icon and visible label
const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ icon, label, className, id, ...props }, ref) {
  const inputId = id ?? props.name;
  const field = (
    <div className="relative">
      {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle">{icon}</span>}
      <input
        ref={ref}
        id={inputId}
        {...props}
        className={cn(
          "h-11 w-full rounded-xl bg-surface-raised px-4 text-sm text-fg placeholder:text-fg-subtle",
          "ring-1 ring-inset ring-line outline-none transition focus:ring-2 focus:ring-brand/70",
          icon ? "pl-10" : undefined,
          className
        )}
      />
    </div>
  );
  if (!label) return field;
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1.5 block text-xs font-medium text-fg-muted">{label}</span>
      {field}
    </label>
  );
});

export default Input;
