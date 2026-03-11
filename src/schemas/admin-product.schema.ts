/**
 * src/schemas/admin-product.schema.ts
 *
 * Esquemas de validación Fastify para los endpoints administrativos
 * de productos. Separados del schema público para no mezclar
 * responsabilidades (el schema público solo valida querystrings de lectura).
 *
 * PATCH /api/admin/products/:id  — todos los campos son opcionales (actualización parcial)
 */

import type { FastifySchema } from 'fastify';

const CATEGORIES = ['EARCUFF', 'ANILLO', 'DIJE', 'CADENA', 'TOPOS', 'CANDONGAS', 'CONJUNTOS'];
const COLORS     = ['ROJO', 'NEGRO', 'BLANCO', 'ROSADO', 'SILVER'];

/**
 * PATCH /api/admin/products/:id
 *
 * El body llega como multipart/form-data porque puede incluir una imagen.
 * Fastify no valida multipart vía JSON Schema — la validación de campos
 * de texto se hace manualmente en el service (ver admin-product.service.ts).
 *
 * Solo validamos los params aquí.
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
 * Validación manual del body multipart.
 * Exportamos los valores válidos para que el service pueda verificarlos
 * sin duplicar las listas.
 */
export const VALID_CATEGORIES = CATEGORIES;
export const VALID_COLORS     = COLORS;

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