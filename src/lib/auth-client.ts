"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        // Full navigation so the Better Auth two-factor cookie is available.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- plugin callback lacks Next router
        window.location.assign("/login?twoFactor=1");
      },
    }),
  ],
});
