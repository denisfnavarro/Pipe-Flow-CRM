import { redirect } from "next/navigation";

/**
 * Barra o acesso a uma tela por falta de permissão.
 *
 * Redireciona em vez de lançar: a pessoa não fez nada errado, só não tem o
 * papel necessário. O RLS já impediria a leitura dos dados — isto é a camada
 * de UX em cima da fronteira de segurança, nunca no lugar dela.
 */
export function forbidden(reason: string): never {
  redirect(`/dashboard?forbidden=${encodeURIComponent(reason)}`);
}
