/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [390, 640, 750, 828, 1080],
    imageSizes: [64, 128, 256, 390],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "gswszoljvafugtdikimn.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      }
    ],
  },
};

export default nextConfig;
