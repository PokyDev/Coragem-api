/**
 * src/modules/catalog/catalog.routes.ts
 *
 * Rutas públicas (GET) — el frontend las usa para poblar filtros y formularios.
 * Rutas admin (POST, PATCH, DELETE) — requieren JWT.
 *
 * GET    /api/categories              — listar categorías
 * POST   /api/admin/categories        — crear categoría
 * PATCH  /api/admin/categories/:id    — editar categoría
 * DELETE /api/admin/categories/:id    — eliminar categoría
 *
 * GET    /api/colors                  — listar colores
 * POST   /api/admin/colors            — crear color
 * PATCH  /api/admin/colors/:id        — editar color
 * DELETE /api/admin/colors/:id        — eliminar color
 */

import type { FastifyInstance } from 'fastify';
import {
  getCategoriesHandler,
  postCategoryHandler,
  patchCategoryHandler,
  deleteCategoryHandler,
  getColorsHandler,
  postColorHandler,
  patchColorHandler,
  deleteColorHandler,
} from './catalog.controller';
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
  createColorSchema,
  updateColorSchema,
  deleteColorSchema,
} from './catalog.schema';

export async function catalogRoutes(app: FastifyInstance): Promise<void> {

  // ── Categorías públicas ───────────────────────────────────────────

  app.get('/categories', {
    handler: getCategoriesHandler,
  });

  // ── Categorías admin ──────────────────────────────────────────────

  app.post('/admin/categories', {
    schema:     createCategorySchema,
    preHandler: [app.authenticate],
    handler:    postCategoryHandler,
  });

  app.patch('/admin/categories/:id', {
    schema:     updateCategorySchema,
    preHandler: [app.authenticate],
    handler:    patchCategoryHandler,
  });

  app.delete('/admin/categories/:id', {
    schema:     deleteCategorySchema,
    preHandler: [app.authenticate],
    handler:    deleteCategoryHandler,
  });

  // ── Colores públicos ──────────────────────────────────────────────

  app.get('/colors', {
    handler: getColorsHandler,
  });

  // ── Colores admin ─────────────────────────────────────────────────

  app.post('/admin/colors', {
    schema:     createColorSchema,
    preHandler: [app.authenticate],
    handler:    postColorHandler,
  });

  app.patch('/admin/colors/:id', {
    schema:     updateColorSchema,
    preHandler: [app.authenticate],
    handler:    patchColorHandler,
  });

  app.delete('/admin/colors/:id', {
    schema:     deleteColorSchema,
    preHandler: [app.authenticate],
    handler:    deleteColorHandler,
  });
}