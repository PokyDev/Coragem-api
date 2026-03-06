/**
 * src/routes/auth.routes.ts
 *
 * GET  /api/auth/google           → inicia el flujo OAuth (manejado por el plugin)
 * GET  /api/auth/google/callback  → callback de Google → JWT cookie → redirect
 * GET  /api/auth/me               → datos del admin autenticado (protegida)
 * POST /api/auth/logout           → borra la cookie JWT
 */

import type { FastifyInstance } from 'fastify';
import {
  handleGoogleCallback,
  getMe,
  postLogout,
} from '../controllers/auth.controller';

export async function authRoutes(app: FastifyInstance): Promise<void> {

  /**
   * La ruta GET /api/auth/google la registra automáticamente el plugin
   * @fastify/oauth2 usando `startRedirectPath`. No hay que declararla aquí.
   */

  // Callback que Google llama después de que el usuario autoriza
  app.get('/google/callback', {
    handler: handleGoogleCallback,
  });

  // Datos del admin autenticado
  app.get('/me', {
    preHandler: [app.authenticate],
    handler:    getMe,
  });

  // Cerrar sesión
  app.post('/logout', {
    handler: postLogout,
  });
}