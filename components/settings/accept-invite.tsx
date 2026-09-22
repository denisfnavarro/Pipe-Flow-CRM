"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { acceptInviteAction } from "@/app/invite/[token]/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function accept() {
    setError(null);
    setPending(true);
    const result = await acceptInviteAction(token);
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
      <Button className="w-full" onClick={accept} disabled={pending}>
        {pending ? "Entrando…" : "Aceitar convite"}
      </Button>
    </div>
  );
}
