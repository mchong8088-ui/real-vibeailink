/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Turbopack
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;
