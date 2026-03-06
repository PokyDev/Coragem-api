/**
 * src/schemas/pattern.schema.ts
 *
 * Esquemas de validación Fastify para los endpoints del patrón de desbloqueo.
 * El patrón llega como un array de índices de nodos (0–8) en orden de selección.
 * Ejemplo: [0, 1, 2, 5, 8]
 */

import type { FastifySchema } from 'fastify';

/** Propiedad compartida: el array de nodos del patrón */
const patternNodes = {
  type: 'array',
  items: { type: 'integer', minimum: 0, maximum: 8 },
  minItems: 4,
  maxItems: 9,
  uniqueItems: true,
} as const;

/** POST /api/pattern — guardar patrón inicial */
export const savePatternSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['nodes'],
    properties: {
      nodes: patternNodes,
    },
    additionalProperties: false,
  },
};

/** POST /api/pattern/verify — comparar patrón ingresado */
export const verifyPatternSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['nodes'],
    properties: {
      nodes: patternNodes,
    },
    additionalProperties: false,
  },
};

/** PUT /api/pattern — reemplazar patrón existente (JWT requerido) */
export const updatePatternSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['nodes'],
    properties: {
      nodes: patternNodes,
    },
    additionalProperties: false,
  },
};