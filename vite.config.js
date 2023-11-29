import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
const path = require('path')

export default defineConfig({
    base: '/',
    plugins: [
        viteTsconfigPaths(),
        svgrPlugin(),
        react(),
    ],
    publicDir: 'public',
    server: {
        port: 3000,
        open: true
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@mui/styled-engine': '@mui/styled-engine-sc'
        },
    },
});