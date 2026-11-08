/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
  async rewrites() {
    return {
      // The website is static HTML in /public. Serve its homepage at the site root.
      beforeFiles: [{ source: '/', destination: '/index.html' }],
    };
  },
};
export default nextConfig;
