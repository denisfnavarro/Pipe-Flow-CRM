import { cn } from "@/lib/utils";

/** Marca do produto: três barras de funil que diminuem, mais o nome. */
export function Logo({ className, showName = true }: { className?: string; showName?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary"
        aria-hidden
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
          <rect x="2" y="3" width="12" height="2.2" rx="1.1" fill="white" />
          <rect x="4" y="7" width="8" height="2.2" rx="1.1" fill="white" opacity="0.8" />
          <rect x="6" y="11" width="4" height="2.2" rx="1.1" fill="white" opacity="0.6" />
        </svg>
      </span>
      {showName ? (
        <span className="text-sm font-semibold tracking-tight">
          Pipe<span className="text-primary">Flow</span>
        </span>
      ) : null}
    </span>
  );
}
