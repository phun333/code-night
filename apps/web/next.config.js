/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@turkcell/shared'],
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
