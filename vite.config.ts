import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

function eventPulseBackendPlugin(): Plugin {
  const apiMiddleware = async (req: any, res: any, next: any) => {
    const rawUrl = req.originalUrl || req.url || '';
    if (rawUrl === '/api' || rawUrl.startsWith('/api/') || rawUrl.startsWith('/api?')) {
      try {
        req.url = rawUrl;
        const { handleApiRequest } = await import('./server/routes');
        await handleApiRequest(req, res);
      } catch (err) {
        next(err);
      }
    } else {
      next();
    }
  };

  const startScheduler = async () => {
    const { scheduler } = await import('./server/scheduler');
    scheduler.startBackgroundWorker(30000);
  };

  return {
    name: 'eventpulse-backend',
    async configureServer(server) {
      await startScheduler();
      server.middlewares.use(apiMiddleware);
    },
    async configurePreviewServer(server) {
      await startScheduler();
      server.middlewares.use(apiMiddleware);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return {
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''),
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
      allowedHosts: ['.vercel.run'],
    },
  };
});
