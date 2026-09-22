import { Mail, MoreHorizontal } from "lucide-react";
import type { Metadata } from "next";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { getWorkspace, listMembers } from "@/lib/mock/workspace";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Membros" };

const ROLE_LABELS = { admin: "Admin", member: "Membro" } as const;

export default async function MembersSettingsPage() {
  const [members, workspace] = await Promise.all([listMembers(), getWorkspace()]);

  const seats = workspace.plan === "free" ? 2 : Infinity;
  const overLimit = members.length > seats;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Convidar colaborador</CardTitle>
          <p className="text-xs text-muted-foreground">
            O convite chega por e-mail e expira em sete dias.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email">E-mail</Label>
              <Input id="invite-email" type="email" placeholder="colega@empresa.com.br" />
            </div>
            {/* O envio real chega na M10, com a Resend. */}
            <Button size="sm" className="sm:mb-0.5" disabled={overLimit}>
              <Mail className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Enviar convite
            </Button>
          </div>

          {overLimit ? (
            <p className="text-xs text-danger">
              O plano Free permite até 2 colaboradores. Faça upgrade para convidar mais gente.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Membros{" "}
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              ({members.length}
              {workspace.plan === "free" ? `/${seats}` : ""})
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
                        <span className="block text-sm font-medium">{member.name}</span>
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
                  <TableCell className="py-1.5 pr-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={`Ações de ${member.name}`}
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
