import { MessagesSquare } from "lucide-react";
import { ActivityIcon } from "@/components/leads/activity-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatRelative } from "@/lib/format";
import { ACTIVITY_LABELS } from "@/lib/stages";
import type { ActivityWithAuthor } from "@/types/domain";

export function ActivityTimeline({ activities }: { activities: ActivityWithAuthor[] }) {
  if (activities.length === 0) {
    return (
      <EmptyState
        icon={MessagesSquare}
        title="Nenhuma atividade registrada"
        description="Registre a primeira ligação, e-mail, reunião ou nota para começar o histórico deste lead."
      />
    );
  }

  return (
    <ol className="relative space-y-4 pl-1">
      {activities.map((activity, index) => (
        <li key={activity.id} className="relative flex gap-3">
          {/* Fio que liga os pontos da timeline, exceto no último item. */}
          {index < activities.length - 1 ? (
            <span
              className="absolute left-[13px] top-8 h-[calc(100%-0.5rem)] w-px bg-border"
              aria-hidden
            />
          ) : null}

          <ActivityIcon type={activity.type} />

          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-medium">{ACTIVITY_LABELS[activity.type]}</span>
              <span className="text-xs text-muted-foreground">por {activity.author.name}</span>
              <time
                dateTime={activity.createdAt}
                title={formatDate(activity.createdAt)}
                className="ml-auto text-xs text-muted-foreground"
              >
                {formatRelative(activity.createdAt)}
              </time>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {activity.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
