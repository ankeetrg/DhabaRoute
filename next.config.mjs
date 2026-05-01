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

  // Slug cleanup — 2026-05-01.
  // The previous build-data slug scheme used `{baseSlug}-{n}` for collisions
  // (punjabi-dhaba-2, punjabi-dhaba-3, ...). The new scheme uses location
  // suffixes (punjabi-dhaba-sanders, punjabi-dhaba-fresno-ca). These 308
  // redirects preserve any external links and search-engine ranking from
  // the old URLs. Computed by mapsUrl from git HEAD vs working tree — see
  // commit message for the script.
  async redirects() {
    return [
      { source: "/dhabas/punjabi-dhaba-2",                destination: "/dhabas/punjabi-dhaba-sanders",                       permanent: true },
      { source: "/dhabas/punjabi-dhaba-3",                destination: "/dhabas/punjabi-dhaba-san-simon",                     permanent: true },
      { source: "/dhabas/punjabi-dhaba-4",                destination: "/dhabas/punjabi-dhaba-shamrock",                      permanent: true },
      { source: "/dhabas/desi-dhaba-2",                   destination: "/dhabas/desi-dhaba-welsh",                            permanent: true },
      { source: "/dhabas/desi-dhaba-3",                   destination: "/dhabas/desi-dhaba-marshall-tx",                      permanent: true },
      { source: "/dhabas/chachas-dhaba-indian-cuisine-2", destination: "/dhabas/chachas-dhaba-indian-cuisine-pearl-river-la", permanent: true },
      { source: "/dhabas/punjabi-dhaba-5",                destination: "/dhabas/punjabi-dhaba-indianapolis-in",               permanent: true },
      { source: "/dhabas/punjabi-dhaba-6",                destination: "/dhabas/punjabi-dhaba-livingston-tx",                 permanent: true },
      { source: "/dhabas/punjabi-dhaba-7",                destination: "/dhabas/punjabi-dhaba-carteret-nj",                   permanent: true },
      { source: "/dhabas/desi-dhaba-4",                   destination: "/dhabas/desi-dhaba-kansas-city-mo",                   permanent: true },
      { source: "/dhabas/punjabi-dhaba-8",                destination: "/dhabas/punjabi-dhaba-aurora-or",                     permanent: true },
      { source: "/dhabas/little-india-punjabi-dhaba-2",   destination: "/dhabas/little-india-punjabi-dhaba-salem-or",         permanent: true },
      { source: "/dhabas/indian-dhaba-2",                 destination: "/dhabas/indian-dhaba-gainesville-tx",                 permanent: true },
      { source: "/dhabas/punjabi-dhaba-9",                destination: "/dhabas/punjabi-dhaba-kingston-springs-tn",           permanent: true },
      { source: "/dhabas/punjabi-indian-restaurant-2",    destination: "/dhabas/punjabi-indian-restaurant-deming-nm",         permanent: true },
      { source: "/dhabas/punjabi-dhaba-10",               destination: "/dhabas/punjabi-dhaba-alvord-tx",                     permanent: true },
      { source: "/dhabas/punjabi-dhaba-11",               destination: "/dhabas/punjabi-dhaba-wendover-ut",                   permanent: true },
      { source: "/dhabas/punjabi-dhaba-12",               destination: "/dhabas/punjabi-dhaba-newberry-springs-ca",           permanent: true },
      { source: "/dhabas/punjabi-dhaba-13",               destination: "/dhabas/punjabi-dhaba-kingman-az",                    permanent: true },
      { source: "/dhabas/punjabi-dhaba-14",               destination: "/dhabas/punjabi-dhaba-shamrock-tx",                   permanent: true },
      { source: "/dhabas/panjabi-dhaba-2",                destination: "/dhabas/panjabi-dhaba-warren-in",                     permanent: true },
      { source: "/dhabas/punjabi-dhaba-15",               destination: "/dhabas/punjabi-dhaba-bakersfield-ca",                permanent: true },
      { source: "/dhabas/punjabi-dhaba-16",               destination: "/dhabas/punjabi-dhaba-fernley-nv",                    permanent: true },
      { source: "/dhabas/punjabi-dhaba-17",               destination: "/dhabas/punjabi-dhaba-caddo-mills-tx",                permanent: true },
      { source: "/dhabas/desi-dhaba-5",                   destination: "/dhabas/desi-dhaba-winnie-tx",                        permanent: true },
      { source: "/dhabas/taste-of-india-2",               destination: "/dhabas/taste-of-india-buttonwillow-ca",              permanent: true },
      { source: "/dhabas/taste-of-india-3",               destination: "/dhabas/taste-of-india-santa-nella-ca",               permanent: true },
    ];
  },
};

export default nextConfig;
