import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Member } from "@/types/domain";

interface UserAvatarProps {
  member: Pick<Member, "name" | "avatarUrl">;
  className?: string;
}

export function UserAvatar({ member, className }: UserAvatarProps) {
  return (
    <Avatar className={cn("h-6 w-6", className)}>
      {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt={member.name} /> : null}
      <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
        {initials(member.name)}
      </AvatarFallback>
    </Avatar>
  );
}
