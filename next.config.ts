import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  outputFileTracingExcludes: { "/*": ["./.local-mail/**/*", "./.env*", "./.auth-test/**/*"] },
  logging: { incomingRequests: { ignore: [/\/access\/confirm/] } },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Cache-Control", value: "no-store" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
    ] },
    { source: "/access/confirm/ready", headers: [{ key: "Referrer-Policy", value: "same-origin" }] },
    { source: "/access/verified", headers: [{ key: "Referrer-Policy", value: "same-origin" }] }];
  },
};
export default config;
