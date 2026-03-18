/**
 * src/app.ts
 *
 * Construye y configura la instancia de Fastify.
 * No llama a listen() — eso es responsabilidad de server.ts.
 */

import Fastify    from 'fastify';
import rateLimit  from '@fastify/rate-limit';

import { corsPlugin        } from './plugins/cors';
import { jwtPlugin         } from './plugins/jwt';
import { multipartPlugin   } from './plugins/multipart';
import { cookiePlugin      } from './plugins/cookie';
import { googleOAuthPlugin } from './plugins/oauth';

import { authRoutes    } from './routes/auth.routes';
import { productRoutes } from './routes/products.routes';
import { patternRoutes } from './routes/pattern.routes';
import { movementRoutes } from './routes/movement.routes';

import { config } from './lib/config';

export async function buildApp() {
  const app = Fastify({
    logger: config.server.nodeEnv === 'development'
      ? { transport: { target: 'pino-pretty' } }
      : true,
  });

  // ── Plugins ──────────────────────────────────────────────────────
  // El orden importa: cookie debe ir antes que jwt y oauth.

  await app.register(corsPlugin);
  await app.register(cookiePlugin);
  await app.register(jwtPlugin);
  await app.register(multipartPlugin);
  await app.register(googleOAuthPlugin);

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
  await app.register(movementRoutes, { prefix: '/api/admin' });

  return app;
}