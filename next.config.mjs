// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactCompiler: true,
//   compress: true,
//   poweredByHeader: false,
//   images: {
//     remotePatterns: [
//       { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
//     ],
//     deviceSizes: [640, 750, 828, 1080, 1200, 1920],
//     imageSizes: [16, 32, 48, 64, 96, 128, 256],
//     minimumCacheTTL: 60,
//   },
//   experimental: {
//     optimizePackageImports: ["lucide-react", "@react-google-maps/api"],
//   },
//   // Performance optimizations
//   swcMinify: true,
//   compiler: {
//     removeConsole: process.env.NODE_ENV === "production" ? {
//       exclude: ["error", "warn"],
//     } : false,
//   },
// };

// export default nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  compress: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "@react-google-maps/api"],
  },

  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
};

export default nextConfig;
