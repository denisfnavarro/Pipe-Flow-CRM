"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validations/auth";

export type AuthResult = { ok: true; message?: string } | { ok: false; error: string };

/** Traduz os erros do Supabase, que chegam em inglês, para a voz do produto. */
function humanize(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "E-mail ou senha incorretos.",
    "Email not confirmed": "Confirme o seu e-mail antes de entrar.",
    "User already registered": "Já existe uma conta com este e-mail.",
    "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos.",
  };
  return map[message] ?? message;
}

export async function loginAction(input: unknown): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: humanize(error.message) };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signupAction(input: unknown): Promise<AuthResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/onboarding`,
    },
  });

  if (error) return { ok: false, error: humanize(error.message) };

  if (data.session) {
    revalidatePath("/", "layout");
    return { ok: true };
  }

  /*
   * Ausência de `session` na resposta não basta para concluir que o projeto
   * exige confirmação: no fluxo PKCE o `signUp` pode devolver `session: null`
   * mesmo quando a conta já nasce confirmada. Perguntar ao servidor é o que
   * distingue os dois casos — sem isso, quem se cadastra com a confirmação
   * desligada fica preso esperando um e-mail que nunca vai chegar.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    revalidatePath("/", "layout");
    return { ok: true };
  }

  return { ok: true, message: "Enviamos um link de confirmação para o seu e-mail." };
}

export async function forgotPasswordAction(input: unknown): Promise<AuthResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
  });
  if (error) return { ok: false, error: humanize(error.message) };

  // Resposta idêntica exista ou não a conta: não entregamos quem é cadastrado.
  return { ok: true, message: "Se houver uma conta com este e-mail, o link chegará em instantes." };
}

export async function resetPasswordAction(input: unknown): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: humanize(error.message) };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function logoutAction(): Promise<never> {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
