/**
 * src/modules/products/products.service.ts
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { config } from '../../lib/config';
import type { CreateProductBody, PatchProductBody } from './products.schema';

// ── Tipos públicos ────────────────────────────────────────────────────

export type SortKey = 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'most_sold';

export interface GetProductsFilter {
  categorySlug?: string;
  colorSlug?:    string;
  search?:       string;
  sort?:         SortKey;
  priceMin?:     number;
  priceMax?:     number;
}

// ── Errores tipados ───────────────────────────────────────────────────

export class ProductValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductValidationError';
  }
}

export class ProductNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductNotFoundError';
  }
}

// ── Selects reutilizables ─────────────────────────────────────────────

const imageSelect = {
  id:     true,
  url:    true,
  order:  true,
  width:  true,
  height: true,
} as const;

const categorySelect = {
  id:   true,
  name: true,
  slug: true,
} as const;

const colorSelect = {
  id:   true,
  name: true,
  slug: true,
  hex:  true,
} as const;

const adminProductSelect = {
  id:        true,
  name:      true,
  price:     true,
  stock:     true,
  ventas:    true,
  isVisible: true,
  category:  { select: categorySelect },
  color:     { select: colorSelect    },
  images: {
    orderBy: { order: 'asc' as const },
    select:  imageSelect,
  },
} as const;

// ── Helper de ordenamiento ────────────────────────────────────────────

function buildOrderBy(sort?: SortKey): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case 'price_asc':  return { price:  'asc'  };
    case 'price_desc': return { price:  'desc' };
    case 'name_asc':   return { name:   'asc'  };
    case 'name_desc':  return { name:   'desc' };
    case 'most_sold':
    default:           return { ventas: 'desc' };
  }
}

// ── Lectura pública ───────────────────────────────────────────────────

export async function getVisibleProducts(filters: GetProductsFilter) {
  const { categorySlug, colorSlug, search, sort, priceMin, priceMax } = filters;

  return prisma.product.findMany({
    where: {
      ...(config.catalog.showAllProducts ? {} : { isVisible: true }),
      ...(categorySlug && { category: { slug: categorySlug } }),
      ...(colorSlug    && { color:    { slug: colorSlug    } }),
      ...(search       && { name: { contains: search, mode: 'insensitive' } }),
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
      stock:    true,
      ventas:   true,
      category: { select: categorySelect },
      color:    { select: colorSelect    },
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
      stock:     true,
      ventas:    true,
      createdAt: true,
      category:  { select: categorySelect },
      color:     { select: colorSelect    },
      images: {
        orderBy: { order: 'asc' },
        select:  imageSelect,
      },
    },
  });
}

// ── Lectura admin ─────────────────────────────────────────────────────

export async function getTopSellingProducts(limit = 5) {
  return prisma.product.findMany({
    take:    limit,
    orderBy: { ventas: 'desc' },
    select: {
      id:     true,
      name:   true,
      price:  true,
      stock:  true,
      ventas: true,
      images: {
        orderBy: { order: 'asc' },
        take:    1,
        select:  imageSelect,
      },
    },
  });
}

export async function getAllProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    select:  adminProductSelect,
  });
}

// ── Escritura admin ───────────────────────────────────────────────────

export async function createProduct(body: CreateProductBody) {
  const stock     = body.stock;
  const isVisible = stock > 0;

  return prisma.product.create({
    data: {
      name:      body.name.trim(),
      price:     body.price,
      stock,
      ventas:    body.ventas ?? 0,
      isVisible,
      category:  { connect: { id: body.categoryId } },
      color:     { connect: { id: body.colorId    } },
      images: {
        create: {
          url:      body.imageUrl,
          publicId: body.imagePublicId,
          order:    0,
        },
      },
    },
    select: adminProductSelect,
  });
}

export async function patchProduct(productId: string, body: PatchProductBody) {
  const existing = await prisma.product.findUnique({
    where:  { id: productId },
    select: {
      id:     true,
      images: {
        orderBy: { order: 'asc' },
        select:  { id: true },
        take:    1,
      },
    },
  });

  if (!existing) {
    throw new ProductNotFoundError('Producto no encontrado');
  }

  const hasImageUpdate = Boolean(body.imageUrl && body.imagePublicId);

  const productData: Prisma.ProductUpdateInput = {};
  if (body.name       !== undefined) productData.name      = body.name.trim();
  if (body.price      !== undefined) productData.price     = body.price;
  if (body.ventas     !== undefined) productData.ventas    = body.ventas;
  if (body.categoryId !== undefined) productData.category  = { connect: { id: body.categoryId } };
  if (body.colorId    !== undefined) productData.color     = { connect: { id: body.colorId    } };
  if (body.stock      !== undefined) {
    productData.stock     = body.stock;
    productData.isVisible = body.stock > 0;
  }

  return prisma.$transaction(async (tx) => {
    if (Object.keys(productData).length > 0) {
      await tx.product.update({
        where: { id: productId },
        data:  productData,
      });
    }

    if (hasImageUpdate) {
      const firstImage = existing.images[0];

      if (firstImage) {
        await tx.image.update({
          where: { id: firstImage.id },
          data: {
            url:      body.imageUrl!,
            publicId: body.imagePublicId!,
          },
        });
      } else {
        await tx.image.create({
          data: {
            productId,
            url:      body.imageUrl!,
            publicId: body.imagePublicId!,
            order:    0,
          },
        });
      }
    }

    return tx.product.findUniqueOrThrow({
      where:  { id: productId },
      select: adminProductSelect,
    });
  });
}

export async function deleteProduct(productId: string): Promise<void> {
  const existing = await prisma.product.findUnique({
    where:  { id: productId },
    select: { id: true },
  });

  if (!existing) {
    throw new ProductNotFoundError('Producto no encontrado');
  }

  await prisma.product.delete({ where: { id: productId } });
}