/**
 * src/services/admin-product.service.ts
 *
 * Lógica de negocio para operaciones administrativas sobre productos.
 * Separado de product.service.ts que solo sirve rutas públicas de lectura.
 *
 * Responsabilidades:
 *   - Validar y crear productos nuevos (POST)
 *   - Validar y aplicar actualizaciones parciales (PATCH)
 *   - Gestionar imágenes en Cloudinary (subida y eliminación)
 *   - Computar isVisible automáticamente cuando stock cambia a 0
 */

import type { Category, Color } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { uploadImageBuffer, deleteCloudinaryImage } from '../lib/cloudinary';
import {
  VALID_CATEGORIES,
  VALID_COLORS,
  type CreateProductFields,
  type PatchProductFields,
} from '../schemas/admin-product.schema';

// ── Constantes ────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const PRODUCTS_FOLDER    = 'coragem/products';

// ── Tipos públicos ────────────────────────────────────────────────────

export interface CreateProductInput {
  fields:        CreateProductFields;
  imageBuffer:   Buffer;
  imageMimeType: string;
}

export interface PatchProductInput {
  fields:         PatchProductFields;
  imageBuffer?:   Buffer;
  imageMimeType?: string;
}

/** Shape compartida que devuelven tanto createProduct como patchProduct */
export interface AdminProductResult {
  id:        string;
  name:      string;
  price:     number;
  category:  Category;
  color:     Color;
  stock:     number;
  ventas:    number;
  isVisible: boolean;
  images: Array<{
    id:     string;
    url:    string;
    order:  number;
    width:  number | null;
    height: number | null;
  }>;
}

// ── Errores tipados ───────────────────────────────────────────────────

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// ── Helpers de validación ─────────────────────────────────────────────

/**
 * Valida y convierte los campos de texto de un multipart.
 * Acepta un modo "strict" para POST (todos requeridos) y
 * "partial" para PATCH (al menos uno presente).
 */
function validateName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) throw new ValidationError('El nombre no puede estar vacío');
  if (trimmed.length > 120) throw new ValidationError('El nombre no puede superar 120 caracteres');
  return trimmed;
}

function validatePrice(raw: number): number {
  const price = Number(raw);
  if (!Number.isInteger(price) || price < 0) {
    throw new ValidationError('El precio debe ser un entero no negativo');
  }
  return price;
}

function validateStock(raw: number): number {
  const stock = Number(raw);
  if (!Number.isInteger(stock) || stock < 0) {
    throw new ValidationError('El stock debe ser un entero no negativo');
  }
  return stock;
}

function validateVentas(raw: number): number {
  const ventas = Number(raw);
  if (!Number.isInteger(ventas) || ventas < 0) {
    throw new ValidationError('Las ventas deben ser un entero no negativo');
  }
  return ventas;
}

function validateCategory(raw: string): Category {
  if (!(VALID_CATEGORIES as readonly string[]).includes(raw)) {
    throw new ValidationError(`Categoría inválida: ${raw}`);
  }
  return raw as Category;
}

function validateColor(raw: string): Color {
  if (!(VALID_COLORS as readonly string[]).includes(raw)) {
    throw new ValidationError(`Color inválido: ${raw}`);
  }
  return raw as Color;
}

function validateMimeType(mimeType: string): void {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new ValidationError(
      `Tipo de imagen no permitido: ${mimeType}. Usa JPEG, PNG, WebP o GIF.`
    );
  }
}

/**
 * Valida los campos requeridos para crear un producto.
 * Lanza ValidationError si falta algún campo o tiene valor inválido.
 */
function validateCreateFields(raw: CreateProductFields): {
  name:      string;
  price:     number;
  stock:     number;
  ventas:    number;
  category:  Category;
  color:     Color;
  isVisible: boolean;
} {
  if (!raw.name)           throw new ValidationError('El campo "name" es requerido');
  if (raw.price     == null) throw new ValidationError('El campo "price" es requerido');
  if (raw.stock     == null) throw new ValidationError('El campo "stock" es requerido');
  if (raw.ventas    == null) throw new ValidationError('El campo "ventas" es requerido');
  if (!raw.category)       throw new ValidationError('El campo "category" es requerido');
  if (!raw.color)          throw new ValidationError('El campo "color" es requerido');

  const stock = validateStock(raw.stock);

  return {
    name:      validateName(raw.name),
    price:     validatePrice(raw.price),
    stock,
    ventas:    validateVentas(raw.ventas),
    category:  validateCategory(raw.category),
    color:     validateColor(raw.color),
    isVisible: stock > 0,
  };
}

/**
 * Valida los campos opcionales para actualizar un producto.
 * Lanza ValidationError si algún campo presente tiene valor inválido.
 */
function validatePatchFields(raw: PatchProductFields): Partial<{
  name:      string;
  price:     number;
  category:  Category;
  color:     Color;
  stock:     number;
  ventas:    number;
  isVisible: boolean;
}> {
  const update: ReturnType<typeof validatePatchFields> = {};

  if (raw.name     !== undefined) update.name     = validateName(raw.name);
  if (raw.price    !== undefined) update.price    = validatePrice(raw.price);
  if (raw.category !== undefined) update.category = validateCategory(raw.category);
  if (raw.color    !== undefined) update.color    = validateColor(raw.color);
  if (raw.ventas   !== undefined) update.ventas   = validateVentas(raw.ventas);

  if (raw.stock !== undefined) {
    const stock      = validateStock(raw.stock);
    update.stock     = stock;
    update.isVisible = stock > 0; // regla de negocio: stock 0 → oculto
  }

  return update;
}

// ── Service: crear producto ───────────────────────────────────────────

/**
 * Crea un producto nuevo con su imagen inicial.
 *
 * Flujo:
 *   1. Valida todos los campos requeridos
 *   2. Valida y sube la imagen a Cloudinary
 *   3. Crea el producto y la imagen en una transacción
 */
export async function createProduct(
  input: CreateProductInput,
): Promise<AdminProductResult> {
  // 1. Validar campos de texto
  const validated = validateCreateFields(input.fields);

  // 2. Validar y subir imagen (obligatoria en POST)
  validateMimeType(input.imageMimeType);
  const uploaded = await uploadImageBuffer(input.imageBuffer, PRODUCTS_FOLDER);

  // 3. Crear producto e imagen en una transacción
  const created = await prisma.product.create({
    data: {
      ...validated,
      images: {
        create: {
          url:      uploaded.url,
          publicId: uploaded.publicId,
          width:    uploaded.width,
          height:   uploaded.height,
          order:    0,
        },
      },
    },
    select: {
      id:        true,
      name:      true,
      price:     true,
      category:  true,
      color:     true,
      stock:     true,
      ventas:    true,
      isVisible: true,
      images: {
        orderBy: { order: 'asc' },
        select: {
          id:     true,
          url:    true,
          order:  true,
          width:  true,
          height: true,
        },
      },
    },
  });

  return created;
}

// ── Service: actualizar producto ──────────────────────────────────────

/**
 * Aplica una actualización parcial sobre un producto existente.
 *
 * Flujo cuando llega una nueva imagen:
 *   1. Sube el nuevo buffer a Cloudinary
 *   2. Actualiza el registro Image en la BD con los nuevos datos
 *   3. Elimina la imagen anterior de Cloudinary (limpieza asíncrona al final)
 *
 * Si el producto no tiene imágenes previas y se envía una nueva,
 * se crea el registro Image en lugar de actualizarlo.
 */
export async function patchProduct(
  productId: string,
  input:     PatchProductInput,
): Promise<AdminProductResult> {
  // 1. Verificar que el producto existe
  const existing = await prisma.product.findUnique({
    where:  { id: productId },
    select: {
      id: true,
      images: {
        orderBy: { order: 'asc' },
        select:  { id: true, publicId: true, order: true },
        take:    1,
      },
    },
  });

  if (!existing) {
    throw new NotFoundError('Producto no encontrado');
  }

  // 2. Validar campos de texto
  const coerced = validatePatchFields(input.fields);

  const hasFieldUpdates = Object.keys(coerced).length > 0;
  const hasNewImage     = Boolean(input.imageBuffer);

  if (!hasFieldUpdates && !hasNewImage) {
    throw new ValidationError('Debes enviar al menos un campo para actualizar');
  }

  // 3. Subir nueva imagen a Cloudinary (si se envió una)
  let uploadedImage: Awaited<ReturnType<typeof uploadImageBuffer>> | null = null;

  if (input.imageBuffer) {
    if (input.imageMimeType && !ALLOWED_MIME_TYPES.includes(input.imageMimeType)) {
      throw new ValidationError(
        `Tipo de imagen no permitido: ${input.imageMimeType}. Usa JPEG, PNG, WebP o GIF.`
      );
    }
    uploadedImage = await uploadImageBuffer(input.imageBuffer, PRODUCTS_FOLDER);
  }

  // 4. Actualizar producto e imagen en una transacción
  const previousPublicId = existing.images[0]?.publicId ?? null;

  const updated = await prisma.$transaction(async (tx) => {
    if (hasFieldUpdates) {
      await tx.product.update({
        where: { id: productId },
        data:  coerced,
      });
    }

    if (uploadedImage) {
      const firstImage = existing.images[0];

      if (firstImage) {
        await tx.image.update({
          where: { id: firstImage.id },
          data: {
            url:      uploadedImage.url,
            publicId: uploadedImage.publicId,
            width:    uploadedImage.width,
            height:   uploadedImage.height,
          },
        });
      } else {
        await tx.image.create({
          data: {
            productId,
            url:      uploadedImage.url,
            publicId: uploadedImage.publicId,
            width:    uploadedImage.width,
            height:   uploadedImage.height,
            order:    0,
          },
        });
      }
    }

    return tx.product.findUniqueOrThrow({
      where:  { id: productId },
      select: {
        id:        true,
        name:      true,
        price:     true,
        category:  true,
        color:     true,
        stock:     true,
        ventas:    true,
        isVisible: true,
        images: {
          orderBy: { order: 'asc' },
          select: {
            id:     true,
            url:    true,
            order:  true,
            width:  true,
            height: true,
          },
        },
      },
    });
  });

  // 5. Limpiar imagen anterior de Cloudinary fuera de la transacción
  if (uploadedImage && previousPublicId) {
    deleteCloudinaryImage(previousPublicId).catch((err) => {
      console.error(`[cloudinary] No se pudo eliminar ${previousPublicId}:`, err);
    });
  }

  return updated;
}