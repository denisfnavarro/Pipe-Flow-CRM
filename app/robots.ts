import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // A área autenticada e os webhooks não têm por que ser rastreados.
      disallow: ["/dashboard", "/leads", "/pipeline", "/calendar", "/reports", "/settings", "/api"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
