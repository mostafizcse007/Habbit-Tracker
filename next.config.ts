import type { NextConfig } from "next"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseHostname: string | undefined
if (supabaseUrl) {
  try {
    supabaseHostname = new URL(supabaseUrl).hostname
  } catch {
    supabaseHostname = undefined
  }
}

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    "192.168.0.102",
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "192.168.0.102:3000",
        "192.168.*.*:3000",
        "10.*.*.*:3000",
        "172.*.*.*:3000",
      ],
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
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/avatars/**",
          },
        ]
      : [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ]
  },
}

export default nextConfig
