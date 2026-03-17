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
 *
 * Nota sobre MIME type vacío:
 *   Windows y Linux no tienen image/heif registrado nativamente, por lo que
 *   el browser envía el campo Content-Type vacío en el multipart cuando el
 *   archivo es .heif/.heic. Se permite pasar la validación en ese caso —
 *   Cloudinary detecta el formato real por los magic bytes del buffer y
 *   actúa como segunda línea de defensa rechazando cualquier archivo inválido.
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

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heif',
  'image/heic',
];

const PRODUCTS_FOLDER = 'coragem/products';

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

/**
 * Valida el MIME type del archivo de imagen.
 *
 * Se permite string vacío porque Windows y Linux no tienen image/heif
 * registrado nativamente — el browser envía Content-Type vacío para
 * archivos .heif/.heic en esos sistemas. Cloudinary detecta el formato
 * real por el contenido del buffer y rechaza cualquier archivo inválido,
 * actuando como segunda línea de defensa.
 *
 * Mejora futura: inspeccionar los magic bytes del buffer para identificar
 * el formato real independientemente del MIME type declarado.
 */
function validateMimeType(mimeType: string): void {
  if (!mimeType || mimeType === '' || mimeType === 'application/octet-stream') return;

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new ValidationError(
      `Tipo de imagen no permitido: ${mimeType}. Usa JPEG, PNG, WebP, HEIF o GIF.`
    );
  }
}

function validateCreateFields(raw: CreateProductFields): {
  name:      string;
  price:     number;
  stock:     number;
  ventas:    number;
  category:  Category;
  color:     Color;
  isVisible: boolean;
} {
  if (!raw.name)             throw new ValidationError('El campo "name" es requerido');
  if (raw.price     == null) throw new ValidationError('El campo "price" es requerido');
  if (raw.stock     == null) throw new ValidationError('El campo "stock" es requerido');
  if (raw.ventas    == null) throw new ValidationError('El campo "ventas" es requerido');
  if (!raw.category)         throw new ValidationError('El campo "category" es requerido');
  if (!raw.color)            throw new ValidationError('El campo "color" es requerido');

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
    update.isVisible = stock > 0;
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

  // 2. Validar MIME type y subir imagen (obligatoria en POST)
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
    // Permitir MIME type vacío — ocurre con .heif en Windows/Linux.
    // Cloudinary rechaza buffers inválidos por su cuenta.
    if (input.imageMimeType && input.imageMimeType !== '' && !ALLOWED_MIME_TYPES.includes(input.imageMimeType)) {
      throw new ValidationError(
        `Tipo de imagen no permitido: ${input.imageMimeType}. Usa JPEG, PNG, WebP, HEIF o GIF.`
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

// ── Service: eliminar producto ────────────────────────────────────────

/**
 * Elimina un producto y limpia sus imágenes de Cloudinary.
 *
 * Flujo:
 *   1. Verifica que el producto exista y obtiene los publicIds de sus imágenes
 *   2. Elimina el producto de la BD (cascade elimina los registros Image)
 *   3. Limpia las imágenes de Cloudinary fuera de la transacción (fire-and-forget)
 */
export async function deleteProduct(productId: string): Promise<void> {
  const existing = await prisma.product.findUnique({
    where:  { id: productId },
    select: {
      images: {
        select: { publicId: true },
      },
    },
  });

  if (!existing) {
    throw new NotFoundError('Producto no encontrado');
  }

  await prisma.product.delete({ where: { id: productId } });

  for (const image of existing.images) {
    deleteCloudinaryImage(image.publicId).catch((err) => {
      console.error(`[cloudinary] No se pudo eliminar ${image.publicId}:`, err);
    });
  }
}