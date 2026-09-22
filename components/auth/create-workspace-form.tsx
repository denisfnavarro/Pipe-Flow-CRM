"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createWorkspaceAction } from "@/app/(app)/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createWorkspaceSchema, type CreateWorkspaceValues } from "@/lib/validations/auth";

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateWorkspaceValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: "" },
  });

  async function onSubmit(values: CreateWorkspaceValues) {
    setError(null);
    const result = await createWorkspaceAction(values);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do workspace</FormLabel>
              <FormControl>
                <Input placeholder="Acme Consultoria" autoFocus {...field} />
              </FormControl>
              <FormDescription className="text-[11px]">
                Use o nome da empresa ou do cliente. Dá para criar outros depois.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Criando…" : "Criar workspace"}
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
        </Button>
      </form>
    </Form>
  );
}
