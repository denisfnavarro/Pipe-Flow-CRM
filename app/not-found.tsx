import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo />
      <p className="font-mono text-5xl font-semibold tabular-nums text-muted-foreground">404</p>
      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold tracking-tight">Página não encontrada</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          O endereço não existe ou o conteúdo foi movido.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/">Ir para a home</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">Abrir o app</Link>
        </Button>
      </div>
    </div>
  );
}
