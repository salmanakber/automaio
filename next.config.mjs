/** @type {import('next').NextConfig} */

const devOrigins = ['localhost', 'automaio.kilo1app.com']
try {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL
  if (appUrl) devOrigins.push(new URL(appUrl).hostname)
} catch {}

const nextConfig = {
  allowedDevOrigins: devOrigins,
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

