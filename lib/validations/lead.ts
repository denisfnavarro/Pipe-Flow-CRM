import { z } from "zod";
import { LEAD_STATUSES } from "@/types/domain";

/** Campo opcional de texto: input vazio vira `null`, não string vazia. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .default(null);

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do lead").max(120, "Máximo de 120 caracteres"),
  email: z
    .string()
    .trim()
    .max(180)
    .refine((value) => value === "" || z.string().email().safeParse(value).success, {
      message: "E-mail inválido",
    })
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .default(null),
  phone: optionalText(30),
  company: optionalText(120),
  title: optionalText(120),
  status: z.enum(LEAD_STATUSES),
  ownerId: z.string().min(1, "Selecione um responsável"),
});

export type LeadFormValues = z.input<typeof leadSchema>;
export type LeadPayload = z.output<typeof leadSchema>;

export const deleteLeadSchema = z.object({
  id: z.string().min(1),
});
