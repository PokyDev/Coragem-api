/**
 * src/routes/products.routes.ts
 *
 * Públicas:
 *   GET /api/products        — lista productos visibles (?category= ?color= ?search=)
 *   GET /api/products/:id    — detalle de producto visible
 *
 * Admin (JWT requerido):
 *   GET    /api/admin/products              — todos los productos       [pendiente]
 *   POST   /api/admin/products              — crear producto            [pendiente]
 *   PATCH  /api/admin/products/:id          — actualizar producto       ✓ implementado
 *   PATCH  /api/admin/products/:id/stock    — actualizar solo stock     [pendiente]
 *   DELETE /api/admin/products/:id          — eliminar producto         [pendiente]
 *   POST   /api/admin/products/:id/images   — subir imágenes            [pendiente]
 *   PATCH  /api/admin/products/:id/images/reorder
 *   DELETE /api/admin/images/:imageId       — eliminar imagen           [pendiente]
 */

import type { FastifyInstance } from 'fastify';
import { getProducts, getProductById }   from '../controllers/product.controller';
import { patchProductHandler }           from '../controllers/admin-product.controller';
import { getProductsSchema, getProductByIdSchema } from '../schemas/product.schema';
import { patchProductSchema }            from '../schemas/admin-product.schema';

export async function productRoutes(app: FastifyInstance): Promise<void> {

  // ── Públicas ──────────────────────────────────────────────────────

  app.get('/products', {
    schema:  getProductsSchema,
    handler: getProducts,
  });

  app.get('/products/:id', {
    schema:  getProductByIdSchema,
    handler: getProductById,
  });

  // ── Admin ─────────────────────────────────────────────────────────

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

  /**
   * PATCH /api/admin/products/:id
   *
   * Body: multipart/form-data — campos opcionales + imagen opcional.
   * contentTypeParser no se configura aquí porque @fastify/multipart
   * ya está registrado globalmente en app.ts.
   */
  app.patch('/admin/products/:id', {
    schema:     patchProductSchema,
    preHandler: [app.authenticate],
    handler:    patchProductHandler,
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