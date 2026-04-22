import type { NextConfig } from "next";

// Disable TLS verification for corporate proxy (local dev only)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
