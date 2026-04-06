import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.imweb.me',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias['next/dist/compiled/amphtml-validator'] = path.join(__dirname, 'src/stubs/amphtml-validator.js');
    return config;
  },
};

export default nextConfig;
