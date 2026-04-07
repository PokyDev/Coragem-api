/**
 * src/modules/products/products.schema.ts
 */

import type { FastifySchema } from 'fastify';

const SORT_KEYS = ['price_asc', 'price_desc', 'name_asc', 'name_desc', 'most_sold'] as const;

// ── Tipos de input ────────────────────────────────────────────────────

export interface CreateProductBody {
  name:          string;
  price:         number;
  stock:         number;
  ventas?:       number;
  categoryId:    string;
  colorId:       string;
  imageUrl:      string;
  imagePublicId: string;
}

export interface PatchProductBody {
  name?:          string;
  price?:         number;
  stock?:         number;
  ventas?:        number;
  categoryId?:    string;
  colorId?:       string;
  imageUrl?:      string;
  imagePublicId?: string;
}

// ── Schemas públicos ──────────────────────────────────────────────────

export const getProductsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      categorySlug: { type: 'string', minLength: 1 },
      colorSlug:    { type: 'string', minLength: 1 },
      search:       { type: 'string', minLength: 1, maxLength: 100 },
      sort:         { type: 'string', enum: SORT_KEYS },
      priceMin:     { type: 'integer', minimum: 0 },
      priceMax:     { type: 'integer', minimum: 0 },
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
    required: ['name', 'price', 'stock', 'categoryId', 'colorId', 'imageUrl', 'imagePublicId'],
    properties: {
      name:          { type: 'string', minLength: 1, maxLength: 120 },
      price:         { type: 'integer', minimum: 0 },
      stock:         { type: 'integer', minimum: 0 },
      ventas:        { type: 'integer', minimum: 0 },
      categoryId:    { type: 'string', minLength: 1 },
      colorId:       { type: 'string', minLength: 1 },
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
      categoryId:    { type: 'string', minLength: 1 },
      colorId:       { type: 'string', minLength: 1 },
      imageUrl:      { type: 'string', minLength: 1 },
      imagePublicId: { type: 'string', minLength: 1 },
    },
    additionalProperties: false,
    minProperties: 1,
  },
};