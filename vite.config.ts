import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { defineConfig } from 'vite';
export default defineConfig({
  plugins: [react(),babel({presets:[reactCompilerPreset()]})],
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: { '/api': { target: process.env.DEV_API_TARGET || 'http://127.0.0.1:3001' } } },
});
