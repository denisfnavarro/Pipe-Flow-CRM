import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // `instrumentation.ts` ainda é opt-in no Next 14.
  experimental: { instrumentationHook: true },

  // Cabeçalhos de segurança básicos. CSP fica de fora: o Next injeta scripts
  // inline e uma política correta exige nonce por request — assunto próprio.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

// Sem as credenciais de organização o wrapper não sobe source maps, mas o
// build continua funcionando — é o que permite desenvolver sem conta no Sentry.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: { treeshake: { removeDebugLogging: true } },
  // O túnel contorna bloqueadores de anúncio que engolem chamadas ao Sentry.
  tunnelRoute: "/monitoring",
});
