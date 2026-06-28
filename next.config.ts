import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This worktree can exceed Linux inotify watcher limits in dev, so use
  // polling to keep Turbopack file change detection reliable.
  watchOptions: {
    pollIntervalMs: 1000,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
