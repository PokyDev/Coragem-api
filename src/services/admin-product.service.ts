/**
 * src/services/admin-product.service.ts
 *
 * Lógica de negocio para operaciones administrativas sobre productos.
 * Separado de product.service.ts que solo sirve rutas públicas de lectura.
 *
 * Responsabilidades actuales:
 *   - Validar y aplicar actualizaciones parciales de un producto (PATCH)
 *   - Gestionar el reemplazo de imagen: subir la nueva a Cloudinary
 *     y eliminar la anterior para no acumular recursos huérfanos
 *   - Computar isVisible automáticamente cuando stock cambia a 0
 */

import type { Category, Color } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { uploadImageBuffer, deleteCloudinaryImage } from '../lib/cloudinary';
import {
  VALID_CATEGORIES,
  VALID_COLORS,
  type PatchProductFields,
} from '../schemas/admin-product.schema';

// ── Tipos ─────────────────────────────────────────────────────────────

export interface PatchProductInput {
  fields: PatchProductFields;
  /** Buffer de la nueva imagen, si el admin la reemplazó */
  imageBuffer?: Buffer;
  /** Mime type para validación básica (ej. "image/jpeg") */
  imageMimeType?: string;
}

export interface PatchProductResult {
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

// ── Constantes ────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const PRODUCTS_FOLDER    = 'coragem/products';

// ── Validación interna ────────────────────────────────────────────────

/**
 * Valida los campos de texto del body multipart y devuelve los
 * valores tipados listos para Prisma. Lanza un error descriptivo
 * si algún campo tiene un valor inválido.
 */
function validateAndCoerceFields(raw: PatchProductFields): Partial<{
  name:      string;
  price:     number;
  category:  Category;
  color:     Color;
  stock:     number;
  ventas:    number;
  isVisible: boolean;
}> {
  const update: ReturnType<typeof validateAndCoerceFields> = {};

  if (raw.name !== undefined) {
    const name = raw.name.trim();
    if (name.length === 0) throw new ValidationError('El nombre no puede estar vacío');
    if (name.length > 120) throw new ValidationError('El nombre no puede superar 120 caracteres');
    update.name = name;
  }

  if (raw.price !== undefined) {
    const price = Number(raw.price);
    if (!Number.isInteger(price) || price < 0) {
      throw new ValidationError('El precio debe ser un entero no negativo');
    }
    update.price = price;
  }

  if (raw.stock !== undefined) {
    const stock = Number(raw.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      throw new ValidationError('El stock debe ser un entero no negativo');
    }
    update.stock     = stock;
    update.isVisible = stock > 0; // regla de negocio: stock 0 → oculto
  }

  if (raw.ventas !== undefined) {
    const ventas = Number(raw.ventas);
    if (!Number.isInteger(ventas) || ventas < 0) {
      throw new ValidationError('Las ventas deben ser un entero no negativo');
    }
    update.ventas = ventas;
  }

  if (raw.category !== undefined) {
    if (!VALID_CATEGORIES.includes(raw.category)) {
      throw new ValidationError(`Categoría inválida: ${raw.category}`);
    }
    update.category = raw.category as Category;
  }

  if (raw.color !== undefined) {
    if (!VALID_COLORS.includes(raw.color)) {
      throw new ValidationError(`Color inválido: ${raw.color}`);
    }
    update.color = raw.color as Color;
  }

  return update;
}

// ── Error tipado ──────────────────────────────────────────────────────

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

// ── Service principal ─────────────────────────────────────────────────

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
): Promise<PatchProductResult> {
  // 1. Verificar que el producto existe
  const existing = await prisma.product.findUnique({
    where:  { id: productId },
    select: {
      id: true,
      images: {
        orderBy: { order: 'asc' },
        select:  { id: true, publicId: true, order: true },
        take:    1, // solo necesitamos la primera imagen para el reemplazo
      },
    },
  });

  if (!existing) {
    throw new NotFoundError('Producto no encontrado');
  }

  // 2. Validar y tipar los campos de texto
  const coerced = validateAndCoerceFields(input.fields);

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
    // 4a. Actualizar campos del producto (solo si hay cambios de texto)
    if (hasFieldUpdates) {
      await tx.product.update({
        where: { id: productId },
        data:  coerced,
      });
    }

    // 4b. Gestionar imagen
    if (uploadedImage) {
      const firstImage = existing.images[0];

      if (firstImage) {
        // Reemplazar imagen existente
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
        // El producto no tenía imagen — crearla
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

    // 4c. Retornar el producto actualizado con sus imágenes
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

  // 5. Eliminar imagen anterior de Cloudinary fuera de la transacción.
  //    Es una operación de limpieza: si falla no queremos rollback del producto.
  if (uploadedImage && previousPublicId) {
    deleteCloudinaryImage(previousPublicId).catch((err) => {
      // Log sin lanzar — el producto ya se actualizó correctamente
      console.error(`[cloudinary] No se pudo eliminar ${previousPublicId}:`, err);
    });
  }

  return updated;
}