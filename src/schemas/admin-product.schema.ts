/**
 * src/schemas/admin-product.schema.ts
 *
 * Esquemas de validación Fastify para los endpoints administrativos
 * de productos. Separados del schema público para no mezclar
 * responsabilidades (el schema público solo valida querystrings de lectura).
 *
 * POST  /api/admin/products       — todos los campos son requeridos
 * PATCH /api/admin/products/:id   — todos los campos son opcionales (actualización parcial)
 */

import type { FastifySchema } from 'fastify';

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

// ── POST /api/admin/products ──────────────────────────────────────────

/**
 * El body llega como multipart/form-data porque incluye una imagen obligatoria.
 * Fastify no valida multipart vía JSON Schema — la validación de campos
 * se hace manualmente en el service.
 * Solo validamos que no haya params inesperados a nivel de ruta.
 */
export const postProductSchema: FastifySchema = {};

/**
 * Campos requeridos para crear un producto.
 * La imagen se recibe como archivo multipart (no se tipifica aquí).
 */
export interface CreateProductFields {
  name:     string;
  price:    number;
  stock:    number;
  ventas:   number;
  category: string;
  color:    string;
}

// ── PATCH /api/admin/products/:id ────────────────────────────────────

/**
 * Solo validamos los params aquí. El body multipart se valida
 * manualmente en el service.
 */
export const patchProductSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', minLength: 1 },
    },
  },
};

/**
 * Campos que el administrador puede modificar en un producto.
 * Todos son opcionales en PATCH — al menos uno debe estar presente.
 */
export interface PatchProductFields {
  name?:     string;
  price?:    number;
  stock?:    number;
  ventas?:   number;
  category?: string;
  color?:    string;
}