import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_META_APP_ID: process.env.NEXT_PUBLIC_META_APP_ID || "",
    NEXT_PUBLIC_EMBEDDED_SIGNUP_CONFIG_ID: process.env.NEXT_PUBLIC_EMBEDDED_SIGNUP_CONFIG_ID || "",
  },
};

if (!process.env.NEXT_PUBLIC_META_APP_ID) {
  console.warn("WARNING: NEXT_PUBLIC_META_APP_ID is not set. FB Embedded Signup will not work.");
}

export default nextConfig;
