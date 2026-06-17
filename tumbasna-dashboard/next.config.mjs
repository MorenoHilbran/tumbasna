/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    typescript: {
        ignoreBuildErrors: true,
    },
    turbopack: {
        root: import.meta.dirname,
    },
    async rewrites() {
        return [
            {
                source: '/api/auth/:path*',
                destination: 'http://tumbasna_whatsapp_bot:3002/api/auth/:path*', // Proxy to WhatsApp Bot container
            },
        ];
    },
};

export default nextConfig;
