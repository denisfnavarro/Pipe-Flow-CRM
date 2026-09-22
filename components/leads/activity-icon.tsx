import { FileText, Mail, Phone, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityType } from "@/types/domain";

const ICONS = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: FileText,
} as const;

const TONES: Record<ActivityType, string> = {
  call: "bg-stage-contacted/15 text-stage-contacted",
  email: "bg-stage-proposal-sent/15 text-stage-proposal-sent",
  meeting: "bg-stage-negotiation/15 text-stage-negotiation",
  note: "bg-muted text-muted-foreground",
};

export function ActivityIcon({ type, className }: { type: ActivityType; className?: string }) {
  const Icon = ICONS[type];
  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
        TONES[type],
        className,
      )}
      aria-hidden
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}
