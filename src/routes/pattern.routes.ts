/**
 * src/routes/pattern.routes.ts
 *
 * Registra los endpoints del patrón de desbloqueo.
 *
 * Rutas públicas:
 *   GET  /api/pattern/exists   — consulta si existe patrón
 *   POST /api/pattern          — setup inicial (solo si no hay patrón)
 *   POST /api/pattern/verify   — comparar patrón (rate limited)
 *
 * Rutas protegidas (JWT):
 *   PUT  /api/pattern          — reemplazar patrón existente
 */

import type { FastifyInstance } from 'fastify';
import {
  getPatternExists,
  postSavePattern,
  postVerifyPattern,
  putUpdatePattern,
} from '../controllers/pattern.controller';
import {
  savePatternSchema,
  verifyPatternSchema,
  updatePatternSchema,
} from '../schemas/pattern.schema';

export async function patternRoutes(app: FastifyInstance): Promise<void> {

  // ── Públicas ─────────────────────────────────────────────────────

  app.get('/exists', {
    handler: getPatternExists,
  });

  app.post('/', {
    schema:  savePatternSchema,
    handler: postSavePattern,
  });

  app.post('/verify', {
    schema: verifyPatternSchema,
    config: {
      // Rate limit específico para este endpoint.
      // Requiere que @fastify/rate-limit esté registrado globalmente en app.ts
      // con allowList o skipOnError según convenga.
      rateLimit: {
        max:         5,
        timeWindow:  '15 minutes',
        errorResponseBuilder: (_req, context) => ({
          error: 'Demasiados intentos fallidos',
          retryAfter: Math.ceil(context.ttl / 1000),
        }),
      },
    },
    handler: postVerifyPattern,
  });

  // ── Protegidas (JWT) ──────────────────────────────────────────────

  app.put('/', {
    schema:     updatePatternSchema,
    preHandler: [app.authenticate],
    handler:    putUpdatePattern,
  });
}