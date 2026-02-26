import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com https://checkout.razorpay.com https://*.clerk.accounts.dev https://*.clerk.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.clerk.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://*.clerk.accounts.dev https://*.clerk.com",
      "frame-src https://api.razorpay.com https://*.razorpay.com",
    ].join("; "),
  },
];


const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
  // Optimize images from clerk CDN
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.clerk.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
};

export default nextConfig;
