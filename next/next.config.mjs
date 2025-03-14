//コレがないと生htmlみたいになる

/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: process.env.NODE_ENV === 'production' ? '' : '',
    images: {
        domains: ['localhost', 'haiku.nkmr.io'],
    },
};

export default nextConfig;