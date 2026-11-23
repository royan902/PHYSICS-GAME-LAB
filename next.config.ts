import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return ["/games-html/:path*", "/embedded-games/:path*"].map((source) => ({
      source,
      headers: [
        // Keep local builds sandboxed even when their document is opened directly.
        {
          key: "Content-Security-Policy",
          value:
            "sandbox allow-scripts allow-pointer-lock; frame-ancestors 'self'",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    }));
  },
};
export default nextConfig;
