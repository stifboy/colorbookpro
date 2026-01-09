import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Use loadEnv for local .env files, fall back to process.env for Vercel
    const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const openaiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
        'process.env.OPENAI_API_KEY': JSON.stringify(openaiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
