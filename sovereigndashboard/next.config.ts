import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Generate fully static assets so we can host /console on the main site
  output: "export",
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
