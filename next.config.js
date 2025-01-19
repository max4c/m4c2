/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add this to suppress the punycode warning
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: false,
      };
    }
    config.cache = false;
    return config;
  },
  // ... other config options
};

module.exports = nextConfig; 