/**
 * src/schemas/product.schema.ts
 *
 * Esquemas de validación Fastify para los endpoints de productos.
 * Se usan tanto en rutas públicas como en las de admin.
 */

import type { FastifySchema } from 'fastify';

const CATEGORIES = ['EARCUFF', 'ANILLO', 'DIJE', 'CADENA', 'TOPOS', 'CANDONGAS', 'CONJUNTOS'];
const COLORS     = ['ROJO', 'NEGRO', 'BLANCO', 'ROSADO', 'SILVER'];

/**
 * GET /api/products
 * Querystring opcional: ?category=EARCUFF&search=cadena&color=SILVER
 */
export const getProductsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      category: { type: 'string', enum: CATEGORIES },
      color:    { type: 'string', enum: COLORS     },
      search:   { type: 'string', minLength: 1, maxLength: 100 },
    },
    additionalProperties: false,
  },
};

/**
 * GET /api/products/:id
 */
export const getProductByIdSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', minLength: 1 },
    },
  },
};