/**
 * src/routes/auth.routes.ts
 *
 * POST /api/auth/login   — login con email + password, devuelve JWT en cookie
 * POST /api/auth/logout  — borra la cookie JWT
 * GET  /api/auth/me      — datos del admin autenticado (protegida)
 */

import type { FastifyInstance } from 'fastify';

export async function authRoutes(app: FastifyInstance): Promise<void> {

  app.post('/login', async (_req, reply) => {
    reply.code(501).send({ error: 'Not implemented yet' });
  });

  app.post('/logout', async (_req, reply) => {
    reply.clearCookie('token', { path: '/' });
    reply.send({ message: 'Sesión cerrada' });
  });

  app.get('/me', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    reply.send({ user: req.user });
  });
}