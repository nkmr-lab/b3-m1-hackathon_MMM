//コレがないと生htmlみたいになる

/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: process.env.NODE_ENV === 'production' ? '/nakano-de-haiku' : '',
    images: {
        domains: ['localhost', 'vps4.nkmr.io'],
    },
};

export default nextConfig;