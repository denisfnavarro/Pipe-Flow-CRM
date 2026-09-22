"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { inviteMemberAction } from "@/app/(app)/settings/members/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { inviteSchema, type InviteValues } from "@/lib/validations/auth";

export function InviteForm({ disabled, disabledReason }: { disabled?: boolean; disabledReason?: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "member" },
  });

  async function onSubmit(values: InviteValues) {
    const result = await inviteMemberAction(values);

    if (!result.ok) {
      toast({ variant: "destructive", title: "Não foi possível convidar", description: result.error });
      return;
    }

    toast({ title: "Convite enviado", description: result.message });
    form.reset({ email: "", role: values.role });
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="colega@empresa.com.br"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="sm:w-36">
                <FormLabel>Papel</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="sm" disabled={disabled || form.formState.isSubmitting}>
            <Mail className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {form.formState.isSubmitting ? "Enviando…" : "Convidar"}
          </Button>
        </div>

        {disabled && disabledReason ? (
          <p className="text-xs text-danger">{disabledReason}</p>
        ) : null}
      </form>
    </Form>
  );
}
