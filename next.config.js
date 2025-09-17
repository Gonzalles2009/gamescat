/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for Phaser in webpack
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
      };
    }
    
    // Handle Phaser physics (matter-js will be loaded dynamically if needed)

    return config;
  },
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;




