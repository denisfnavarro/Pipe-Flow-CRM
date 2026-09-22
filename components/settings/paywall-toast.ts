"use client";

/**
 * Toast de limite de plano.
 *
 * O texto vem do trigger no banco, então a tela nunca inventa um limite que o
 * servidor não aplica — e nunca deixa de mostrar um que ele aplica.
 */
export function paywallToast(error: string) {
  return {
    variant: "destructive" as const,
    title: "Limite do plano Free",
    description: `${error} Vá em Configurações › Plano e cobrança para assinar o Pro.`,
  };
}
