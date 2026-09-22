import { z } from "zod";
import { ACTIVITY_TYPES } from "@/types/domain";

export const activitySchema = z.object({
  leadId: z.string().min(1),
  type: z.enum(ACTIVITY_TYPES),
  description: z
    .string()
    .trim()
    .min(3, "Descreva a atividade")
    .max(1000, "Máximo de 1000 caracteres"),
});

export type ActivityFormValues = z.infer<typeof activitySchema>;
