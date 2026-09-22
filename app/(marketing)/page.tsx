import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

// Placeholder da M1 — a landing completa chega na M2.
export default function MarketingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <h1 className="text-3xl font-semibold tracking-tight">
        O funil de vendas da sua empresa, visível de ponta a ponta.
      </h1>
      <Button asChild>
        <Link href="/dashboard">Entrar no app</Link>
      </Button>
    </main>
  );
}
