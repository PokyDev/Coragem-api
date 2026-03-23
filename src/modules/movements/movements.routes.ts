/**
 * src/modules/movements/movements.routes.ts
 *
 * GET  /api/admin/movements                          — listar movimientos
 * GET  /api/admin/movements/:id                      — movimiento por ID
 * POST /api/admin/products/:productId/movements      — registrar movimiento
 */

import type { FastifyInstance } from 'fastify';
import {
  postMovementHandler,
  getMovementsHandler,
  getMovementByIdHandler,
} from './movements.controller';
import {
  createMovementSchema,
  getMovementsSchema,
  getMovementByIdSchema,
} from './movements.schema';

export async function movementRoutes(app: FastifyInstance): Promise<void> {
  app.get('/movements', {
    schema:     getMovementsSchema,
    preHandler: [app.authenticate],
    handler:    getMovementsHandler,
  });

  app.get('/movements/:id', {
    schema:     getMovementByIdSchema,
    preHandler: [app.authenticate],
    handler:    getMovementByIdHandler,
  });

  app.post('/products/:productId/movements', {
    schema:     createMovementSchema,
    preHandler: [app.authenticate],
    handler:    postMovementHandler,
  });
}