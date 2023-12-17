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
        host: "0.0.0.0",
        hmr: {
            clientPort: 3000,
        },
        port: 3000,
        open: false
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@mui/styled-engine': '@mui/styled-engine-sc'
        },
    }
});