import { z } from "zod";

const email = z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido");
const password = z.string().min(8, "A senha precisa de pelo menos 8 caracteres").max(72);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Informe a senha"),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o seu nome").max(120),
  email,
  password,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do workspace").max(120),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type CreateWorkspaceValues = z.infer<typeof createWorkspaceSchema>;

export const inviteSchema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido").toLowerCase(),
  role: z.enum(["admin", "member"]),
});

export type InviteValues = z.infer<typeof inviteSchema>;
