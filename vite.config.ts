import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { handleApiRequest } from './server/routes';
import { scheduler } from './server/scheduler';

function eventPulseBackendPlugin(): Plugin {
  return {
    name: 'eventpulse-backend',
    configureServer(server) {
      // Start the persistent automated lifecycle & outbox scheduler in dev server
      scheduler.startBackgroundWorker(30000);

      server.middlewares.use('/api', async (req, res, next) => {
        try {
          const originalUrl = req.url || '';
          req.url = '/api' + (originalUrl.startsWith('/') ? originalUrl : '/' + originalUrl);
          await handleApiRequest(req, res);
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
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
