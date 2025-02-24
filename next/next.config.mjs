//コレがないと生htmlみたいになる

/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: process.env.NODE_ENV === 'production' ? '/nakano-de-haiku' : '',
};

export default nextConfig;