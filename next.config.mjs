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
