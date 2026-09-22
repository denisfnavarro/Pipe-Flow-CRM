import { z } from "zod";
import { DEAL_STAGES } from "@/types/domain";

export const dealSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Informe o título do negócio")
    .max(140, "Máximo de 140 caracteres"),
  /** Chega em centavos: o formulário converte antes de enviar. */
  value: z
    .number({ invalid_type_error: "Informe um valor" })
    .int("Valor inválido")
    .min(0, "O valor não pode ser negativo")
    .max(1_000_000_000, "Valor acima do limite"),
  stage: z.enum(DEAL_STAGES),
  leadId: z
    .string()
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .default(null),
  ownerId: z.string().min(1, "Selecione um responsável"),
  dueDate: z
    .string()
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .default(null),
});

export type DealFormValues = z.input<typeof dealSchema>;

export const moveDealSchema = z.object({
  dealId: z.string().min(1),
  stage: z.enum(DEAL_STAGES),
  position: z.number().int().min(0),
});
