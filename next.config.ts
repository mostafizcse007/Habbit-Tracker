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
}

export default nextConfig
