/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.axodojo.xyz' }],
        destination: 'https://axodojo.xyz/:path*',
        permanent: true,
      },
    ];
  },
}

export default nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.axodojo.xyz' }],
        destination: 'https://axodojo.xyz/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
