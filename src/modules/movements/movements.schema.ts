/**
 * src/modules/movements/movements.schema.ts
 */

import type { FastifySchema } from 'fastify';

export const createMovementSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['productId'],
    properties: {
      productId: { type: 'string', minLength: 1 },
    },
  },
  body: {
    type: 'object',
    required: ['type', 'quantity'],
    properties: {
      type:     { type: 'string', enum: ['PURCHASE', 'SALE'] },
      quantity: { type: 'integer', minimum: 1 },
    },
    additionalProperties: false,
  },
};

export const getMovementsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      type:  { type: 'string', enum: ['PURCHASE', 'SALE'] },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    },
    additionalProperties: false,
  },
};

export const getMovementByIdSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', minLength: 1 },
    },
  },
};