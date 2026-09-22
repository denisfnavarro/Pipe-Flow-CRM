import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignupPage() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Comece no plano gratuito. Sem cartão de crédito.
        </p>
      </div>

      {/* `useSearchParams` obriga a fronteira de Suspense no App Router. */}
      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <SignupForm />
      </Suspense>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
