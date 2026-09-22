import { MailX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AcceptInvite } from "@/components/settings/accept-invite";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { getInvitePreview } from "@/lib/data/invites";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Convite" };

const ROLE_LABELS = { admin: "administrador", member: "membro" } as const;

const PROBLEMS: Record<string, string> = {
  accepted: "Este convite já foi aceito.",
  revoked: "Este convite foi revogado por um administrador.",
  expired: "Este convite expirou. Peça um novo para quem te convidou.",
};

/**
 * Tela de aceite. Fica fora de `(app)` porque quem chega aqui pode ainda não
 * ter workspace nenhum — e o layout autenticado mandaria essa pessoa para o
 * onboarding antes de ela ver o convite.
 */
export default async function InvitePage({ params }: { params: { token: string } }) {
  const invite = await getInvitePreview(params.token);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const problem = invite ? PROBLEMS[invite.status] : "Este convite não existe.";
  const wrongAccount =
    invite && user && user.email?.toLowerCase() !== invite.email.toLowerCase()
      ? `Este convite é para ${invite.email}, mas você está conectado como ${user.email}.`
      : null;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-muted/30 px-4 py-12">
      <Link href="/" aria-label="PipeFlow CRM, página inicial">
        <Logo />
      </Link>

      <div className="w-full max-w-sm space-y-5 rounded-lg border border-border bg-card p-6 shadow-sm">
        {!invite || problem ? (
          <div className="space-y-4 text-center">
            <span
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-muted"
              aria-hidden
            >
              <MailX className="h-5 w-5 text-muted-foreground" />
            </span>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold tracking-tight">Convite indisponível</h1>
              <p className="text-sm text-muted-foreground">{problem}</p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Ir para o PipeFlow</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <h1 className="text-lg font-semibold tracking-tight">
                Você foi convidado para o {invite.workspaceName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {invite.invitedBy} convidou <span className="font-medium">{invite.email}</span> para
                entrar como {ROLE_LABELS[invite.role]}.
              </p>
            </div>

            {!user ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Entre ou crie uma conta com este e-mail para aceitar.
                </p>
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href={`/signup?next=/invite/${params.token}`}>Criar conta</Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/login?next=/invite/${params.token}`}>Entrar</Link>
                  </Button>
                </div>
              </div>
            ) : wrongAccount ? (
              <div className="space-y-3">
                <p className="text-sm text-danger">{wrongAccount}</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Entrar com outra conta</Link>
                </Button>
              </div>
            ) : (
              <AcceptInvite token={params.token} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
