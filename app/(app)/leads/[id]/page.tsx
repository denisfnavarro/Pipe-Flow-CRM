import { ArrowLeft, Briefcase, Building2, Mail, Pencil, Phone, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityComposer } from "@/components/leads/activity-composer";
import { ActivityTimeline } from "@/components/leads/activity-timeline";
import { DeleteLeadDialog } from "@/components/leads/delete-lead-dialog";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { Money } from "@/components/shared/money";
import { StageBadge } from "@/components/shared/stage-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getLead } from "@/lib/data/leads";
import { listMembers } from "@/lib/data/members";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lead = await getLead(params.id);
  return { title: lead?.name ?? "Lead não encontrado" };
}

export default async function LeadDetailPage({ params }: PageProps) {
  const [lead, members] = await Promise.all([getLead(params.id), listMembers()]);
  if (!lead) notFound();

  const contactRows = [
    { icon: Mail, label: "E-mail", value: lead.email },
    { icon: Phone, label: "Telefone", value: lead.phone, mono: true },
    { icon: Building2, label: "Empresa", value: lead.company },
    { icon: Briefcase, label: "Cargo", value: lead.title },
  ];

  return (
    <div className="space-y-5">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Voltar para leads
      </Link>

      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight">{lead.name}</h1>
            <StatusBadge status={lead.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {[lead.title, lead.company].filter(Boolean).join(" · ") || "Sem empresa vinculada"}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <LeadFormDialog
            members={members}
            lead={lead}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Editar
              </Button>
            }
          />
          <DeleteLeadDialog
            leadId={lead.id}
            leadName={lead.name}
            redirectToList
            trigger={
              <Button variant="outline" size="sm" className="text-danger hover:text-danger">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Excluir
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contactRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-start gap-2.5">
                    <Icon
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {row.label}
                      </p>
                      <p
                        className={row.mono ? "font-mono text-sm tabular-nums" : "truncate text-sm"}
                      >
                        {row.value ?? "—"}
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Responsável
                </span>
                <span className="flex items-center gap-2">
                  <UserAvatar member={lead.owner} />
                  <span className="text-sm">{lead.owner.name}</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Criado em
                </span>
                <span className="font-mono text-sm tabular-nums">{formatDate(lead.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Negócios{" "}
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  ({lead.deals.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lead.deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum negócio vinculado a este lead.
                </p>
              ) : (
                lead.deals.map((deal) => (
                  <div key={deal.id} className="space-y-1.5 rounded-md border border-border p-2.5">
                    <p className="text-sm font-medium leading-tight">{deal.title}</p>
                    <div className="flex items-center justify-between gap-2">
                      <StageBadge stage={deal.stage} />
                      <Money cents={deal.value} className="text-sm" />
                    </div>
                    {deal.dueDate ? (
                      <p className="text-xs text-muted-foreground">
                        Prazo em {formatDate(deal.dueDate)}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Atividades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ActivityComposer leadId={lead.id} />
            <ActivityTimeline activities={lead.activities} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
