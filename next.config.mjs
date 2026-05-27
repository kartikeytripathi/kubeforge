import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new MonacoWebpackPlugin({
          languages: ["yaml"],
          filename: "static/[name].worker.js",
        })
      );
    }
    return config;
  },
};

export default nextConfig;
