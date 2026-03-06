/**
 * src/routes/products.routes.ts
 *
 * Públicas:
 *   GET /api/products        — lista productos visibles (?category= ?search=)
 *   GET /api/products/:id    — detalle de producto
 *
 * Admin (JWT requerido):
 *   GET    /api/admin/products              — todos los productos
 *   POST   /api/admin/products              — crear producto
 *   PUT    /api/admin/products/:id          — actualizar producto
 *   PATCH  /api/admin/products/:id/stock    — actualizar stock
 *   DELETE /api/admin/products/:id          — eliminar producto
 *   POST   /api/admin/products/:id/images   — subir imágenes
 *   PATCH  /api/admin/products/:id/images/reorder
 *   DELETE /api/admin/images/:imageId       — eliminar imagen
 */

import type { FastifyInstance } from 'fastify';

export async function productRoutes(app: FastifyInstance): Promise<void> {

  // ── Públicas ────────────────────────────────────────────────────

  app.get('/products', async (_req, reply) => {
    reply.code(501).send({ error: 'Not implemented yet' });
  });

  app.get('/products/:id', async (_req, reply) => {
    reply.code(501).send({ error: 'Not implemented yet' });
  });

  // ── Admin ───────────────────────────────────────────────────────

  app.get('/admin/products', {
    preHandler: [app.authenticate],
  }, async (_req, reply) => {
    reply.code(501).send({ error: 'Not implemented yet' });
  });

  app.post('/admin/products', {
    preHandler: [app.authenticate],
  }, async (_req, reply) => {
    reply.code(501).send({ error: 'Not implemented yet' });
  });

  app.put('/admin/products/:id', {
    preHandler: [app.authenticate],
  }, async (_req, reply) => {
    reply.code(501).send({ error: 'Not implemented yet' });
  });

  app.patch('/admin/products/:id/stock', {
    preHandler: [app.authenticate],
  }, async (_req, reply) => {
    reply.code(501).send({ error: 'Not implemented yet' });
  });

  app.delete('/admin/products/:id', {
    preHandler: [app.authenticate],
  }, async (_req, reply) => {
    reply.code(501).send({ error: 'Not implemented yet' });
  });

  app.post('/admin/products/:id/images', {
    preHandler: [app.authenticate],
  }, async (_req, reply) => {
    reply.code(501).send({ error: 'Not implemented yet' });
  });

  app.patch('/admin/products/:id/images/reorder', {
    preHandler: [app.authenticate],
  }, async (_req, reply) => {
    reply.code(501).send({ error: 'Not implemented yet' });
  });

  app.delete('/admin/images/:imageId', {
    preHandler: [app.authenticate],
  }, async (_req, reply) => {
    reply.code(501).send({ error: 'Not implemented yet' });
  });
}