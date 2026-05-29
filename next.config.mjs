/** @type {import('next').NextConfig} */

const devOrigins = ['localhost', 'http://192.168.0.100:3301']
try {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL
  if (appUrl) devOrigins.push(new URL(appUrl).hostname)
} catch {}

const nextConfig = {
  allowedDevOrigins: devOrigins,
  async headers() {
    return [
      {
        source: '/webflow/designer',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "frame-ancestors 'self' https://*.webflow-ext.com https://*.webflow.com https://webflow.com http://localhost:1337 http://127.0.0.1:1337",
          },
        ],
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? '',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
    middlewareClientMaxBodySize: '15mb',
  },
}

export default nextConfig

