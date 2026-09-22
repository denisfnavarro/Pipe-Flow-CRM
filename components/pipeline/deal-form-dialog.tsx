"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createDealAction, deleteDealAction, updateDealAction } from "@/app/(app)/pipeline/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { parseMoneyToCents } from "@/lib/format";
import { STAGE_LABELS } from "@/lib/stages";
import { dealSchema, type DealFormValues } from "@/lib/validations/deal";
import {
  DEAL_STAGES,
  type DealStage,
  type DealWithRelations,
  type Lead,
  type Member,
} from "@/types/domain";

const NO_LEAD = "__none__";

interface DealFormDialogProps {
  members: Member[];
  leads: Pick<Lead, "id" | "name" | "company">[];
  deal?: DealWithRelations;
  defaultStage?: DealStage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** ISO → `yyyy-mm-dd`, formato que o `input[type=date]` espera. */
function toDateInput(iso: string | null | undefined): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

export function DealFormDialog({
  members,
  leads,
  deal,
  defaultStage,
  open,
  onOpenChange,
}: DealFormDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const editing = Boolean(deal);

  // O valor é digitado em reais e convertido para centavos no submit.
  const [valueText, setValueText] = useState("");

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      value: 0,
      stage: defaultStage ?? "new_lead",
      leadId: null,
      ownerId: members[0]?.id ?? "",
      dueDate: null,
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      title: deal?.title ?? "",
      value: deal?.value ?? 0,
      stage: deal?.stage ?? defaultStage ?? "new_lead",
      leadId: deal?.leadId ?? null,
      ownerId: deal?.ownerId ?? members[0]?.id ?? "",
      dueDate: toDateInput(deal?.dueDate) || null,
    });
    setValueText(deal ? (deal.value / 100).toFixed(2).replace(".", ",") : "");
  }, [open, deal, defaultStage, members, form]);

  async function onSubmit(values: DealFormValues) {
    const payload = {
      ...values,
      dueDate: values.dueDate ? new Date(`${values.dueDate}T12:00:00`).toISOString() : null,
    };

    const result = deal
      ? await updateDealAction(deal.id, payload)
      : await createDealAction(payload);

    if (!result.ok) {
      toast({ variant: "destructive", title: "Algo deu errado", description: result.error });
      return;
    }

    toast({ title: editing ? "Negócio atualizado" : "Negócio criado", description: values.title });
    onOpenChange(false);
    router.refresh();
  }

  async function onDelete() {
    if (!deal) return;

    setDeleting(true);
    const result = await deleteDealAction(deal.id);
    setDeleting(false);

    if (!result.ok) {
      toast({ variant: "destructive", title: "Algo deu errado", description: result.error });
      return;
    }

    toast({ title: "Negócio excluído", description: deal.title });
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar negócio" : "Novo negócio"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Atualize os dados desta oportunidade."
              : "Registre uma oportunidade no funil de vendas."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Implantação do CRM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        placeholder="4.800,00"
                        className="font-mono tabular-nums"
                        value={valueText}
                        onChange={(event) => {
                          setValueText(event.target.value);
                          field.onChange(parseMoneyToCents(event.target.value));
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px]">Em reais.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="font-mono"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEAL_STAGES.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {STAGE_LABELS[stage]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="leadId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead vinculado</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === NO_LEAD ? null : value)}
                    value={field.value ?? NO_LEAD}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_LEAD}>Sem lead vinculado</SelectItem>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.company ? `${lead.name} · ${lead.company}` : lead.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:justify-between">
              {editing ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onDelete}
                  disabled={deleting}
                  className="text-danger hover:text-danger"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  {deleting ? "Excluindo…" : "Excluir"}
                </Button>
              ) : (
                <span />
              )}

              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Salvando…" : editing ? "Salvar" : "Criar negócio"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
