import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nova senha" };

export default async function ResetPasswordPage() {
  // Só chega aqui quem veio do link de recuperação, que já criou a sessão.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/forgot-password");

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Definir nova senha</h1>
        <p className="text-sm text-muted-foreground">
          Escolha uma senha nova para <span className="font-medium">{user.email}</span>.
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}
