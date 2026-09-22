import { siteUrl } from "@/lib/site";

interface InviteEmailProps {
  workspaceName: string;
  invitedByName: string;
  role: "admin" | "member";
  token: string;
  expiresAt: string;
}

const ROLE_LABELS = { admin: "administrador", member: "membro" } as const;

/** O nome do workspace e de quem convida vêm do banco: nunca interpolar cru. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * E-mail de convite em HTML puro.
 *
 * Cliente de e-mail não é navegador: nada de classe CSS, flexbox ou custom
 * property. Estilo inline e tabela, que é o que o Outlook entende.
 */
export function inviteEmail({
  workspaceName,
  invitedByName,
  role,
  token,
  expiresAt,
}: InviteEmailProps): { subject: string; html: string; text: string } {
  const link = `${siteUrl()}/invite/${token}`;
  const expira = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
  }).format(new Date(expiresAt));

  const subject = `${invitedByName} convidou você para o ${workspaceName} no PipeFlow`;

  const text = [
    `${invitedByName} convidou você para participar do workspace "${workspaceName}" no PipeFlow como ${ROLE_LABELS[role]}.`,
    "",
    `Aceite o convite: ${link}`,
    "",
    `O convite expira em ${expira}.`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;">
      <tr>
        <td style="padding:28px 28px 0;">
          <span style="display:inline-block;font-size:16px;font-weight:600;color:#0f172a;">Pipe<span style="color:#4f46e5;">Flow</span></span>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px 0;">
          <h1 style="margin:0 0 12px;font-size:19px;line-height:1.35;color:#0f172a;font-weight:600;">${escapeHtml(invitedByName)} convidou você para o ${escapeHtml(workspaceName)}</h1>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">Você vai entrar como <strong style="color:#0f172a;">${ROLE_LABELS[role]}</strong> e poderá acompanhar leads, negócios e atividades do time.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 24px;">
          <a href="${link}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:11px 20px;border-radius:6px;">Aceitar convite</a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 28px;border-top:1px solid #e2e8f0;">
          <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#64748b;">O convite expira em ${expira}. Se o botão não funcionar, copie este endereço:<br /><span style="color:#4f46e5;word-break:break-all;">${link}</span></p>
          <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">Se você não esperava este convite, pode ignorar esta mensagem.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
