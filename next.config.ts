import type { NextConfig } from "next";

const isGitHubPages = process.env.DEPLOY_TARGET === "pages";
const basePath = isGitHubPages ? "/codex-micro-mockup" : "";

const nextConfig: NextConfig = {
  ...(isGitHubPages
    ? {
        output: "export" as const,
        basePath,
        assetPrefix: basePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
