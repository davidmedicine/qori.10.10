import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export static assets to serve from /console on Netlify
  output: "export",
  basePath: "/console",
  trailingSlash: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
