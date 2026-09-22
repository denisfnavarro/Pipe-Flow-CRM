"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createActivityAction } from "@/app/(app)/leads/actions";
import { ActivityIcon } from "@/components/leads/activity-icon";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ACTIVITY_LABELS } from "@/lib/stages";
import { cn } from "@/lib/utils";
import { activitySchema, type ActivityFormValues } from "@/lib/validations/activity";
import { ACTIVITY_TYPES } from "@/types/domain";

export function ActivityComposer({ leadId }: { leadId: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: { leadId, type: "note", description: "" },
  });

  const selectedType = form.watch("type");

  async function onSubmit(values: ActivityFormValues) {
    const result = await createActivityAction(values);

    if (!result.ok) {
      toast({ variant: "destructive", title: "Algo deu errado", description: result.error });
      return;
    }

    form.reset({ leadId, type: values.type, description: "" });
    toast({ title: "Atividade registrada" });
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <div
                className="flex flex-wrap gap-1.5"
                role="radiogroup"
                aria-label="Tipo de atividade"
              >
                {ACTIVITY_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={selectedType === type}
                    onClick={() => field.onChange(type)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                      selectedType === type
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <ActivityIcon type={type} className="h-5 w-5" />
                    {ACTIVITY_LABELS[type]}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="O que aconteceu nesta interação?"
                  aria-label="Descrição da atividade"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Registrando…" : "Registrar atividade"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
