import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { handleApiRequest } from './server/routes';
import { scheduler } from './server/scheduler';

function eventPulseBackendPlugin(): Plugin {
  const apiMiddleware = async (req: any, res: any, next: any) => {
    const rawUrl = req.originalUrl || req.url || '';
    if (rawUrl === '/api' || rawUrl.startsWith('/api/') || rawUrl.startsWith('/api?')) {
      try {
        req.url = rawUrl;
        await handleApiRequest(req, res);
      } catch (err) {
        next(err);
      }
    } else {
      next();
    }
  };

  return {
    name: 'eventpulse-backend',
    configureServer(server) {
      scheduler.startBackgroundWorker(30000);
      server.middlewares.use(apiMiddleware);
    },
    configurePreviewServer(server) {
      scheduler.startBackgroundWorker(30000);
      server.middlewares.use(apiMiddleware);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''),
  },
  plugins: [react(), eventPulseBackendPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
