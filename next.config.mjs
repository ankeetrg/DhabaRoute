/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Places API photos come from lh3.googleusercontent.com after the
      // skipHttpRedirect=true resolver hop. We render them with <Image
      // unoptimized> so Next doesn't proxy the bytes, but the domain still
      // needs to be allowlisted for the component to mount without error.
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // places.googleapis.com is the direct-media host when skipHttpRedirect
      // isn't used; listed here so either shape works if we ever switch.
      {
        protocol: "https",
        hostname: "places.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
