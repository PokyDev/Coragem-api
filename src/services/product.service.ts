/**
 * src/services/product.service.ts
 *
 * Lógica de negocio de productos.
 * Toda consulta a Prisma vive aquí — los controllers solo orquestan.
 */

import { prisma } from '../lib/prisma';
import type { Category, Color } from '@prisma/client';

interface GetProductsFilter {
  category?: Category;
  color?:    Color;
  search?:   string;
}

/**
 * Selección de campos de imagen que se incluye en todas las queries.
 * Solo se devuelve lo que el frontend necesita.
 */
const imageSelect = {
  id:      true,
  url:     true,
  order:   true,
  width:   true,
  height:  true,
} as const;

// ── Rutas públicas ────────────────────────────────────────────────────

/**
 * Lista todos los productos visibles (isVisible = true).
 * Soporta filtros opcionales por categoría, color y búsqueda por nombre.
 * Las imágenes se devuelven ordenadas por `order ASC`.
 */
export async function getVisibleProducts(filters: GetProductsFilter) {
  const { category, color, search } = filters;

  return prisma.product.findMany({
    where: {
      isVisible: true,
      ...(category && { category }),
      ...(color    && { color    }),
      ...(search   && {
        name: { contains: search, mode: 'insensitive' },
      }),
    },
    orderBy: { ventas: 'desc' }, // más vendidos primero
    select: {
      id:        true,
      name:      true,
      price:     true,
      category:  true,
      color:     true,
      stock:     true,
      ventas:    true,
      images: {
        orderBy: { order: 'asc' },
        select:  imageSelect,
      },
    },
  });
}

/**
 * Devuelve el detalle completo de un producto visible por ID.
 * Retorna null si no existe o no está visible (el controller decide el 404).
 */
export async function getVisibleProductById(id: string) {
  return prisma.product.findFirst({
    where: { id, isVisible: true },
    select: {
      id:        true,
      name:      true,
      price:     true,
      category:  true,
      color:     true,
      stock:     true,
      ventas:    true,
      createdAt: true,
      images: {
        orderBy: { order: 'asc' },
        select:  imageSelect,
      },
    },
  });
}