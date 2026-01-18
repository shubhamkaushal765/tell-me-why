/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
    reactStrictMode: true,

    // Emotion & MUI optimization
    compiler: {
        emotion: true,
    },

    // Environment variables validation
    env: {
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    },

    // Experimental features
    experimental: {
        // Enable if needed
    },
}

export default nextConfig
