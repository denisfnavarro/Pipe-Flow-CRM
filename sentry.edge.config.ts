import * as Sentry from "@sentry/nextjs";
import { SENTRY_ENABLED, sentryBaseOptions } from "@/lib/sentry";

if (SENTRY_ENABLED) {
  Sentry.init(sentryBaseOptions);
}
