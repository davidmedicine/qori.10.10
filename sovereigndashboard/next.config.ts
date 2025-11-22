import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true, // Fixes the build error for static export
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;