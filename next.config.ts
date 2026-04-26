import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['react-markdown'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hxxvxsmengeoazuywpjm.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
