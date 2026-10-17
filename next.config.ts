import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Studio is session + DB heavy; Cache Components prerender rules fight
  // authenticated admin routes. Keep the portfolio (`web/`) on Cache Components.
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
