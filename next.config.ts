import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/voices", destination: "/", permanent: true }];
  },
};

export default nextConfig;
