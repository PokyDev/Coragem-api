/**
 * src/app.ts
 *
 * Construye y configura la instancia de Fastify.
 * No llama a listen() — eso es responsabilidad de server.ts.
 * Exportar la app permite testearla sin levantar el puerto.
 */

import Fastify from 'fastify';
import rateLimit  from '@fastify/rate-limit';

import { corsPlugin      } from './plugins/cors';
import { jwtPlugin       } from './plugins/jwt';
import { multipartPlugin } from './plugins/multipart';
import { cookiePlugin    } from './plugins/cookie';

import { authRoutes    } from './routes/auth.routes';
import { productRoutes } from './routes/products.routes';
import { patternRoutes } from './routes/pattern.routes';

import { config } from './lib/config';

export async function buildApp() {
  const app = Fastify({
    logger: config.server.nodeEnv === 'development'
      ? { transport: { target: 'pino-pretty' } }
      : true,
  });

  // ── Plugins ──────────────────────────────────────────────────────

  await app.register(corsPlugin);
  await app.register(jwtPlugin);
  await app.register(multipartPlugin);
  await app.register(cookiePlugin);

  /*
   * Rate limiting — global: false para que solo aplique en las rutas
   * que lo configuren explícitamente (actualmente: POST /api/pattern/verify).
   */
  await app.register(rateLimit, { global: false });

  // ── Health check ─────────────────────────────────────────────────

  app.get('/api/health', async () => ({
    status:    'ok',
    timestamp: new Date().toISOString(),
  }));

  // ── Rutas ────────────────────────────────────────────────────────

  await app.register(authRoutes,    { prefix: '/api/auth'    });
  await app.register(productRoutes, { prefix: '/api'         });
  await app.register(patternRoutes, { prefix: '/api/pattern' });

  return app;
}