import type { FastifyInstance } from 'fastify';
import {
  postMovementHandler,
  getMovementsHandler,
  getMovementByIdHandler,
} from '../controllers/movement.controller';
import {
  createMovementSchema,
  getMovementsSchema,
  getMovementByIdSchema,
} from '../schemas/movement.schema';

export async function movementRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/admin/movements — todos los movimientos
  app.get('/', {
    schema:     getMovementsSchema,
    preHandler: [app.authenticate],
    handler:    getMovementsHandler,
  });

  // GET /api/admin/movements/:id — movimiento individual
  app.get('/:id', {
    schema:     getMovementByIdSchema,
    preHandler: [app.authenticate],
    handler:    getMovementByIdHandler,
  });

  // POST /api/admin/products/:productId/movements — crear movimiento
  app.post('/products/:productId/movements', {
    schema:     createMovementSchema,
    preHandler: [app.authenticate],
    handler:    postMovementHandler,
  });
}