/**
 * src/services/product.service.ts
 */

import { prisma } from '../lib/prisma';
import type { Category, Color, Prisma } from '@prisma/client';

export type SortKey = 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'most_sold';

interface GetProductsFilter {
  category?: Category;
  color?:    Color;
  search?:   string;
  sort?:     SortKey;
  priceMin?: number;
  priceMax?: number;
}

const imageSelect = {
  id:     true,
  url:    true,
  order:  true,
  width:  true,
  height: true,
} as const;

function buildOrderBy(sort?: SortKey): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case 'price_asc':  return { price: 'asc'  };
    case 'price_desc': return { price: 'desc' };
    case 'name_asc':   return { name:  'asc'  };
    case 'name_desc':  return { name:  'desc' };
    case 'most_sold':
    default:           return { ventas: 'desc' };
  }
}

// ── Rutas públicas ────────────────────────────────────────────────────

export async function getVisibleProducts(filters: GetProductsFilter) {
  const { category, color, search, sort, priceMin, priceMax } = filters;

  return prisma.product.findMany({
    where: {
      isVisible: true,
      ...(category && { category }),
      ...(color    && { color    }),
      ...(search   && { name: { contains: search, mode: 'insensitive' } }),
      ...((priceMin !== undefined || priceMax !== undefined) && {
        price: {
          ...(priceMin !== undefined && { gte: priceMin }),
          ...(priceMax !== undefined && { lte: priceMax }),
        },
      }),
    },
    orderBy: buildOrderBy(sort),
    select: {
      id:       true,
      name:     true,
      price:    true,
      category: true,
      color:    true,
      stock:    true,
      ventas:   true,
      images: {
        orderBy: { order: 'asc' },
        select:  imageSelect,
      },
    },
  });
}

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