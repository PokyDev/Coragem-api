/**
 * src/schemas/product.schema.ts
 */

import type { FastifySchema } from 'fastify';

const CATEGORIES = ['EARCUFF', 'ANILLO', 'DIJE', 'CADENA', 'TOPOS', 'CANDONGAS', 'CONJUNTOS'];
const COLORS     = ['ROJO', 'NEGRO', 'BLANCO', 'ROSADO', 'SILVER'];
const SORT_KEYS  = ['price_asc', 'price_desc', 'name_asc', 'name_desc', 'most_sold'];

export const getProductsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      category: { type: 'string', enum: CATEGORIES },
      color:    { type: 'string', enum: COLORS     },
      search:   { type: 'string', minLength: 1, maxLength: 100 },
      sort:     { type: 'string', enum: SORT_KEYS  },
      priceMin: { type: 'integer', minimum: 0      },
      priceMax: { type: 'integer', minimum: 0      },
    },
    additionalProperties: false,
  },
};

export const getProductByIdSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', minLength: 1 },
    },
  },
};