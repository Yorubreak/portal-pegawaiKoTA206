/** @type {import('next').NextConfig} */
const nextConfig = {
  // Izinkan gambar dari domain object storage
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Diperlukan agar API route bisa handle multipart/form-data
  api: {
    bodyParser: false,
  },
};

module.exports = nextConfig;
