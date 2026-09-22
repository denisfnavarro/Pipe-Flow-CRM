import "server-only";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface Subscription {
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/** Assinatura do workspace ativo. `null` quando nunca houve checkout. */
export async function getSubscription(): Promise<Subscription | null> {
  const { workspace } = await requireAdmin();
  const supabase = createClient();

  const { data } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, cancel_at_period_end")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  if (!data) return null;

  return {
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
  };
}
