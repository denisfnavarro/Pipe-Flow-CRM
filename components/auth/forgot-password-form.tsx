"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { forgotPasswordAction } from "@/app/(auth)/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setError(null);
    const result = await forgotPasswordAction(values);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(result.message ?? "Link enviado.");
  }

  if (sent) return <AuthMessage tone="success">{sent}</AuthMessage>;

  return (
    <Form {...form}>
      <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="voce@empresa.com.br"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Enviando…" : "Enviar link de recuperação"}
        </Button>
      </form>
    </Form>
  );
}
