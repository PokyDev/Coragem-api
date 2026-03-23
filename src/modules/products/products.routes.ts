/**
 * src/modules/products/products.routes.ts
 *
 * Rutas públicas:
 *   GET  /api/products        — lista productos visibles
 *   GET  /api/products/:id    — detalle de producto visible
 *
 * Rutas admin (JWT requerido):
 *   GET    /api/admin/products       — todos los productos sin filtro isVisible
 *   POST   /api/admin/products       — crear producto (body JSON con imageUrl)
 *   PATCH  /api/admin/products/:id   — actualizar producto parcialmente
 *   DELETE /api/admin/products/:id   — eliminar producto
 */

import type { FastifyInstance } from 'fastify';
import {
  getProductsHandler,
  getProductByIdHandler,
  getAdminProductsHandler,
  postProductHandler,
  patchProductHandler,
  deleteProductHandler,
} from './products.controller';
import {
  getProductsSchema,
  getProductByIdSchema,
  postProductSchema,
  patchProductSchema,
} from './products.schema';

export async function productRoutes(app: FastifyInstance): Promise<void> {

  // ── Públicas ──────────────────────────────────────────────────────

  app.get('/products', {
    schema:  getProductsSchema,
    handler: getProductsHandler,
  });

  app.get('/products/:id', {
    schema:  getProductByIdSchema,
    handler: getProductByIdHandler,
  });

  // ── Admin ─────────────────────────────────────────────────────────

  app.get('/admin/products', {
    preHandler: [app.authenticate],
    handler:    getAdminProductsHandler,
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

  app.delete('/admin/products/:id', {
    preHandler: [app.authenticate],
    handler:    deleteProductHandler,
  });
}