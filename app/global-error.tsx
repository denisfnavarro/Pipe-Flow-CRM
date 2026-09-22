"use client";

/**
 * Último recurso: substitui o `<html>` inteiro, então não pode depender do
 * layout, dos tokens nem de nenhum componente do design system.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          display: "flex",
          minHeight: "100dvh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Algo deu muito errado</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", maxWidth: "24rem" }}>
          A aplicação não conseguiu se recuperar. Recarregue a página para tentar de novo.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#4F46E5",
            color: "#fff",
            border: 0,
            borderRadius: "0.375rem",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
