import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Cliente para Server Components, Server Actions e Route Handlers.
 *
 * Em Server Component puro os cookies são somente leitura: o Next lança ao
 * tentar escrever. O `try/catch` no `setAll` é o escape documentado — quem
 * renova a sessão é o middleware, que roda antes e pode escrever.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Render de Server Component: o middleware já cuidou da renovação.
          }
        },
      },
    },
  );
}

/**
 * Cliente com a service_role: ignora RLS por completo.
 *
 * Só para webhooks e rotinas server-only, como manda o CLAUDE.md. Nunca
 * importar isso de um componente — nem de um Server Component.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");

  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
