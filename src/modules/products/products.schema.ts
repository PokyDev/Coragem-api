/**
 * src/modules/products/products.schema.ts
 *
 * Esquemas de validación Fastify y tipos compartidos para el módulo de productos.
 * Unifica lo que antes estaba repartido entre product.schema.ts y admin-product.schema.ts.
 */

import type { FastifySchema } from 'fastify';

// ── Constantes de dominio ─────────────────────────────────────────────

export const VALID_CATEGORIES = [
  'EARCUFF',
  'ANILLO',
  'DIJE',
  'CADENA',
  'TOPOS',
  'CANDONGAS',
  'CONJUNTOS',
] as const;

export const VALID_COLORS = [
  'ROJO',
  'NEGRO',
  'BLANCO',
  'ROSADO',
  'SILVER',
] as const;

const SORT_KEYS = ['price_asc', 'price_desc', 'name_asc', 'name_desc', 'most_sold'] as const;

// ── Tipos de input ────────────────────────────────────────────────────

/** Campos para crear un producto. La imagen llega como URL ya subida a Cloudinary. */
export interface CreateProductBody {
  name:          string;
  price:         number;
  stock:         number;
  ventas?:       number;
  category:      string;
  color:         string;
  imageUrl:      string;
  imagePublicId: string;
}

/** Todos los campos son opcionales en PATCH. Al menos uno debe estar presente. */
export interface PatchProductBody {
  name?:          string;
  price?:         number;
  stock?:         number;
  ventas?:        number;
  category?:      string;
  color?:         string;
  imageUrl?:      string;
  imagePublicId?: string;
}

// ── Schemas públicos ──────────────────────────────────────────────────

export const getProductsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      category: { type: 'string', enum: VALID_CATEGORIES },
      color:    { type: 'string', enum: VALID_COLORS     },
      search:   { type: 'string', minLength: 1, maxLength: 100 },
      sort:     { type: 'string', enum: SORT_KEYS        },
      priceMin: { type: 'integer', minimum: 0            },
      priceMax: { type: 'integer', minimum: 0            },
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

// ── Schemas admin ─────────────────────────────────────────────────────

export const postProductSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['name', 'price', 'stock', 'category', 'color', 'imageUrl', 'imagePublicId'],
    properties: {
      name:          { type: 'string', minLength: 1, maxLength: 120 },
      price:         { type: 'integer', minimum: 0 },
      stock:         { type: 'integer', minimum: 0 },
      ventas:        { type: 'integer', minimum: 0 },
      category:      { type: 'string', enum: VALID_CATEGORIES },
      color:         { type: 'string', enum: VALID_COLORS     },
      imageUrl:      { type: 'string', minLength: 1 },
      imagePublicId: { type: 'string', minLength: 1 },
    },
    additionalProperties: false,
  },
};

export const patchProductSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', minLength: 1 },
    },
  },
  body: {
    type: 'object',
    properties: {
      name:          { type: 'string', minLength: 1, maxLength: 120 },
      price:         { type: 'integer', minimum: 0 },
      stock:         { type: 'integer', minimum: 0 },
      ventas:        { type: 'integer', minimum: 0 },
      category:      { type: 'string', enum: VALID_CATEGORIES },
      color:         { type: 'string', enum: VALID_COLORS     },
      imageUrl:      { type: 'string', minLength: 1 },
      imagePublicId: { type: 'string', minLength: 1 },
    },
    additionalProperties: false,
    minProperties: 1,
  },
};