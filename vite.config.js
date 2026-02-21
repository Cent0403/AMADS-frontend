import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const apiBackend = env.VITE_API_BACKEND || 'http://localhost:4000';

    return {
        plugins: [react()],
        resolve: {
            alias: { '@': path.resolve(__dirname, './src') },
        },
        server: {
            port: 3000,
            proxy: {
                '/api': { target: apiBackend, changeOrigin: true },
            },
        },
    };
});
