import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nextPackageInProject = path.join(__dirname, "node_modules", "next", "package.json");
const turbopackRoot = fs.existsSync(nextPackageInProject) ? __dirname : path.resolve(__dirname, "..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  allowedDevOrigins: ['192.168.56.1', 'localhost', 'backend', 'nhadatxunghe.vn'],
  turbopack: {
    root: turbopackRoot,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'nhadatxunghe.vn',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
      },
      {
        protocol: 'https',
        hostname: '*.fbcdn.net',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      { source: '/tin-tuc', destination: '/news' },
      { source: '/:slug([\\w-]+-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', destination: '/user/:slug' },
      { source: '/api/v1/socket.io', destination: `http://backend:4000/api/v1/socket.io/` },
      { source: '/api/:path*', destination: `http://backend:4000/api/:path*` },
      { source: '/socket.io/:path*', destination: `http://backend:4000/socket.io/:path*` },
      { source: '/bds-uploads/:path*', destination: `${process.env.UPLOADS_URL || 'http://backend:4000/bds-uploads'}/:path*` },
    ];
  }
};

export default nextConfig;
