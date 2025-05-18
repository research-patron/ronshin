/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  swcMinify: true,
  // Server Actions are available by default in Next.js 14
  experimental: {},
  // Workaround for Firebase compatibility issues with Next.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // ブラウザ環境でのNode.jsネイティブモジュールの処理
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
      };
    }

    // undiciの#targetシンボルを処理する
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /node_modules\/undici/,
      loader: 'ignore-loader',
    });

    return config;
  },
}

module.exports = nextConfig