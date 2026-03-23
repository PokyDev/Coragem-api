/**
 * src/modules/products/products.service.ts
 *
 * Lógica de negocio para el módulo de productos.
 * Unifica las responsabilidades que antes estaban repartidas entre
 * product.service.ts y admin-product.service.ts.
 *
 * El backend ya no gestiona imágenes: la URL y el publicId llegan
 * del cliente, que interactúa directamente con Cloudinary.
 */

import type { Category, Color, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import {
  VALID_CATEGORIES,
  VALID_COLORS,
  type CreateProductBody,
  type PatchProductBody,
} from './products.schema';

// ── Tipos públicos ────────────────────────────────────────────────────

export type SortKey = 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'most_sold';

export interface GetProductsFilter {
  category?: Category;
  color?:    Color;
  search?:   string;
  sort?:     SortKey;
  priceMin?: number;
  priceMax?: number;
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

const adminProductSelect = {
  id:        true,
  name:      true,
  price:     true,
  category:  true,
  color:     true,
  stock:     true,
  ventas:    true,
  isVisible: true,
  images: {
    orderBy: { order: 'asc' as const },
    select:  imageSelect,
  },
} as const;

// ── Helpers de validación ─────────────────────────────────────────────

function validateCategory(raw: string): Category {
  if (!(VALID_CATEGORIES as readonly string[]).includes(raw)) {
    throw new ProductValidationError(`Categoría inválida: ${raw}`);
  }
  return raw as Category;
}

function validateColor(raw: string): Color {
  if (!(VALID_COLORS as readonly string[]).includes(raw)) {
    throw new ProductValidationError(`Color inválido: ${raw}`);
  }
  return raw as Color;
}

// ── Helpers de ordenamiento ───────────────────────────────────────────

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

// ── Lectura admin ─────────────────────────────────────────────────────

export async function getAllProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    select:  adminProductSelect,
  });
}

// ── Escritura admin ───────────────────────────────────────────────────

/**
 * Crea un producto con su imagen inicial.
 * La URL e imagePublicId ya fueron obtenidos por el cliente desde Cloudinary.
 */
export async function createProduct(body: CreateProductBody) {
  const stock     = body.stock;
  const isVisible = stock > 0;

  return prisma.product.create({
    data: {
      name:      body.name.trim(),
      price:     body.price,
      stock,
      ventas:    body.ventas ?? 0,
      category:  validateCategory(body.category),
      color:     validateColor(body.color),
      isVisible,
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

/**
 * Actualiza parcialmente un producto.
 * Si llega una nueva imageUrl + imagePublicId, actualiza el registro Image.
 * isVisible se recalcula automáticamente cuando cambia el stock.
 */
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

  // Construir el objeto de actualización para Product
  const productData: Prisma.ProductUpdateInput = {};
  if (body.name     !== undefined) productData.name     = body.name.trim();
  if (body.price    !== undefined) productData.price    = body.price;
  if (body.ventas   !== undefined) productData.ventas   = body.ventas;
  if (body.category !== undefined) productData.category = validateCategory(body.category);
  if (body.color    !== undefined) productData.color    = validateColor(body.color);
  if (body.stock    !== undefined) {
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

/**
 * Elimina un producto. El cliente es responsable de limpiar
 * los assets en Cloudinary usando el publicId de las imágenes
 * retornadas antes de llamar a este endpoint.
 */
export async function deleteProduct(productId: string): Promise<void> {
  const existing = await prisma.product.findUnique({
    where:  { id: productId },
    select: { id: true },
  });

  if (!existing) {
    throw new ProductNotFoundError('Producto no encontrado');
  }

  // CASCADE en la BD elimina los registros Image automáticamente
  await prisma.product.delete({ where: { id: productId } });
}