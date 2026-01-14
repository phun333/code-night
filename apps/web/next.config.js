/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@turkcell/shared'],
  output: 'standalone',
};

module.exports = nextConfig;
