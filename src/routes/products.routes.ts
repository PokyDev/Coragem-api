/**
 * src/routes/products.routes.ts
 *
 * Públicas:
 *   GET  /api/products        — lista productos visibles (?category= ?color= ?search=)
 *   GET  /api/products/:id    — detalle de producto visible
 *
 * Admin (JWT requerido):
 *   GET    /api/admin/products              — todos los productos (sin filtro isVisible)
 *   POST   /api/admin/products              — crear producto
 *   PATCH  /api/admin/products/:id          — actualizar producto
 *   PATCH  /api/admin/products/:id/stock    — actualizar solo stock     [pendiente]
 *   DELETE /api/admin/products/:id          — eliminar producto
 *   POST   /api/admin/products/:id/images   — subir imágenes            [pendiente]
 *   PATCH  /api/admin/products/:id/images/reorder                       [pendiente]
 *   DELETE /api/admin/images/:imageId       — eliminar imagen           [pendiente]
 */

import type { FastifyInstance } from 'fastify';
import {
  getProducts,
  getProductById,
  getAdminProducts,
} from '../controllers/product.controller';
import {
  postProductHandler,
  patchProductHandler,
  deleteProductHandler,
} from '../controllers/admin-product.controller';
import { getProductsSchema, getProductByIdSchema } from '../schemas/product.schema';
import { postProductSchema, patchProductSchema }   from '../schemas/admin-product.schema';

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
    handler:    getAdminProducts,
  });

  app.post('/admin/products', {
    schema:     postProductSchema,
    preHandler: [app.authenticate],
    handler:    postProductHandler,
  });

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
    handler:    deleteProductHandler,
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