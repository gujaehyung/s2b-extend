import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@supabase/ssr', '@supabase/supabase-js'],
  experimental: {
    serverActions: {
      allowedOrigins: ['https://s2b-extend.vercel.app', 'localhost:3000']
    }
  }
};

export default nextConfig;
