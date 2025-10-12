import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

if (supabaseUrl) {
  try {
    const parsed = new URL(supabaseUrl);
    remotePatterns = [
      {
        protocol: (parsed.protocol.replace(":", "") as "http" | "https") ?? "https",
        hostname: parsed.hostname,
        pathname: "/storage/v1/object/public/time-capsule/**",
      },
    ];
  } catch (error) {
    console.warn(
      "[time-capsule][config] Failed to parse NEXT_PUBLIC_SUPABASE_URL for image remote pattern.",
      error,
    );
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
