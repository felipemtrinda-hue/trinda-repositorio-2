import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Todo o portal é autenticado e personalizado por usuário (cookies em cada
  // requisição), então usamos renderização dinâmica clássica. Reavaliar
  // Cache Components quando houver páginas públicas (ex.: vitrine de imóveis).
  cacheComponents: false,
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
      ],
    }];
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
