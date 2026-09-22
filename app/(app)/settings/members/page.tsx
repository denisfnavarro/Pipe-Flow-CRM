import type { Metadata } from "next";
import { InviteActions } from "@/components/settings/invite-actions";
import { InviteForm } from "@/components/settings/invite-form";
import { MemberActions } from "@/components/settings/member-actions";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireWorkspace } from "@/lib/auth";
import { listInvites } from "@/lib/data/invites";
import { listMembers } from "@/lib/data/members";
import { formatDate, formatRelative } from "@/lib/format";
import { PLAN_LIMITS } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { forbidden } from "@/lib/errors";

export const metadata: Metadata = { title: "Membros" };

const ROLE_LABELS = { admin: "Admin", member: "Membro" } as const;

const INVITE_STATUS = {
  pending: { label: "Pendente", tone: "bg-warning/15 text-foreground" },
  accepted: { label: "Aceito", tone: "bg-success/15 text-foreground" },
  revoked: { label: "Revogado", tone: "bg-muted text-muted-foreground" },
  expired: { label: "Expirado", tone: "bg-danger/15 text-foreground" },
} as const;

export default async function MembersSettingsPage() {
  const { user, workspace } = await requireWorkspace();

  // Gestão de time é assunto de admin — e as policies da M6 dizem o mesmo.
  if (workspace.role !== "admin") forbidden("Só administradores gerenciam o time.");

  const [members, invites] = await Promise.all([listMembers(), listInvites()]);

  const seats = PLAN_LIMITS[workspace.plan].seats;
  const pending = invites.filter((invite) => invite.status === "pending").length;
  const used = members.length + pending;
  const atLimit = seats !== null && used >= seats;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Convidar colaborador</CardTitle>
          <p className="text-xs text-muted-foreground">
            O convite chega por e-mail e expira em sete dias.
          </p>
        </CardHeader>
        <CardContent>
          <InviteForm
            disabled={atLimit}
            disabledReason={`O plano ${PLAN_LIMITS[workspace.plan].label} permite até ${seats} pessoas, contando convites pendentes. Faça upgrade para convidar mais.`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Membros{" "}
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              ({members.length}
              {seats !== null ? `/${seats}` : ""})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 pl-6">Pessoa</TableHead>
                <TableHead className="h-9">Papel</TableHead>
                <TableHead className="h-9">Entrou em</TableHead>
                <TableHead className="h-9 w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} className="h-10">
                  <TableCell className="py-1.5 pl-6">
                    <span className="flex items-center gap-2.5">
                      <UserAvatar member={member} className="h-7 w-7" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {member.name}
                          {member.id === user.id ? (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                              (você)
                            </span>
                          ) : null}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {member.email}
                        </span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <span
                      className={cn(
                        "rounded-sm px-2 py-0.5 text-xs font-medium",
                        member.role === "admin"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {ROLE_LABELS[member.role]}
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {formatDate(member.joinedAt)}
                  </TableCell>
                  <TableCell className="py-1.5 pr-4">
                    <MemberActions member={member} isSelf={member.id === user.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invites.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Convites</CardTitle>
            <p className="text-xs text-muted-foreground">
              Convites pendentes também ocupam uma vaga do plano.
            </p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 pl-6">E-mail</TableHead>
                  <TableHead className="h-9">Papel</TableHead>
                  <TableHead className="h-9">Situação</TableHead>
                  <TableHead className="h-9">Expira</TableHead>
                  <TableHead className="h-9 w-40" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => {
                  const status = INVITE_STATUS[invite.status];
                  return (
                    <TableRow key={invite.id} className="h-10">
                      <TableCell className="py-1.5 pl-6 text-sm">{invite.email}</TableCell>
                      <TableCell className="py-1.5 text-xs text-muted-foreground">
                        {ROLE_LABELS[invite.role]}
                      </TableCell>
                      <TableCell className="py-1.5">
                        <span
                          className={cn("rounded-sm px-2 py-0.5 text-xs font-medium", status.tone)}
                        >
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-muted-foreground">
                        {invite.status === "pending" ? formatRelative(invite.expiresAt) : "—"}
                      </TableCell>
                      <TableCell className="py-1.5 pr-4">
                        {invite.status === "accepted" ? null : (
                          <InviteActions
                            inviteId={invite.id}
                            active={invite.status === "pending"}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
