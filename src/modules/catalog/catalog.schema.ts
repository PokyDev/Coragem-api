/**
 * src/modules/catalog/catalog.schema.ts
 *
 * Schemas de validación para categorías y colores dinámicos.
 */

import { FastifySchema } from "fastify";

// ── Categorías ────────────────────────────────────────────────────────

export const createCategorySchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 60 },
    },
    additionalProperties: false,
  },
};

export const updateCategorySchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', minLength: 1 },
    },
  },
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 60 },
    },
    additionalProperties: false,
  },
};

export const deleteCategorySchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', minLength: 1 },
    },
  },
};

// ── Colores ───────────────────────────────────────────────────────────

export const createColorSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['name', 'hex'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 60 },
      hex:  { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
    },
    additionalProperties: false,
  },
};

export const updateColorSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', minLength: 1 },
    },
  },
  body: {
    type: 'object',
    required: ['name', 'hex'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 60 },
      hex:  { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
    },
    additionalProperties: false,
  },
};

export const deleteColorSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', minLength: 1 },
    },
  },
};