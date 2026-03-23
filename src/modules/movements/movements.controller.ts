/**
 * src/modules/movements/movements.controller.ts
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { MovementType } from '@prisma/client';
import {
  createMovement,
  getMovements,
  getMovementById,
  MovementValidationError,
  MovementNotFoundError,
} from './movements.service';

interface CreateMovementParams { productId: string }
interface CreateMovementBody   { type: MovementType; quantity: number }
interface GetMovementsQuery    { type?: MovementType; limit?: number }
interface GetMovementByIdParams { id: string }

export async function postMovementHandler(
  request: FastifyRequest<{ Params: CreateMovementParams; Body: CreateMovementBody }>,
  reply:   FastifyReply,
): Promise<void> {
  const { productId } = request.params;
  const { type, quantity } = request.body;

  try {
    const movement = await createMovement(productId, type, quantity);
    reply.code(201).send({ movement });
  } catch (err) {
    if (err instanceof MovementNotFoundError) {
      reply.code(404).send({ error: err.message });
      return;
    }
    if (err instanceof MovementValidationError) {
      reply.code(400).send({ error: err.message });
      return;
    }
    throw err;
  }
}

export async function getMovementsHandler(
  request: FastifyRequest<{ Querystring: GetMovementsQuery }>,
  reply:   FastifyReply,
): Promise<void> {
  const movements = await getMovements(request.query);
  reply.send({ movements });
}

export async function getMovementByIdHandler(
  request: FastifyRequest<{ Params: GetMovementByIdParams }>,
  reply:   FastifyReply,
): Promise<void> {
  try {
    const movement = await getMovementById(request.params.id);
    reply.send({ movement });
  } catch (err) {
    if (err instanceof MovementNotFoundError) {
      reply.code(404).send({ error: err.message });
      return;
    }
    throw err;
  }
}