/**
 * src/controllers/admin-product.controller.ts
 *
 * Recibe requests multipart, extrae los campos y el archivo,
 * delega al service y formatea la respuesta HTTP.
 *
 * No contiene lógica de negocio ni acceso directo a Prisma o Cloudinary.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  createProduct,
  patchProduct,
  ValidationError,
  NotFoundError,
  type CreateProductInput,
  type PatchProductInput,
} from '../services/admin-product.service';
import type { CreateProductFields, PatchProductFields } from '../schemas/admin-product.schema';

interface PatchProductParams {
  id: string;
}

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Parsea un request multipart y devuelve los campos de texto
 * y el archivo de imagen (si existe).
 * Reutilizado por POST y PATCH para no duplicar la iteración de parts().
 */
async function parseMultipart(request: FastifyRequest): Promise<{
  fields:        Record<string, string>;
  imageBuffer?:  Buffer;
  imageMimeType?: string;
}> {
  const fields: Record<string, string> = {};
  let imageBuffer:   Buffer | undefined;
  let imageMimeType: string | undefined;

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      if (part.fieldname === 'image') {
        imageBuffer   = await part.toBuffer();
        imageMimeType = part.mimetype;
      } else {
        // Consumir el stream para evitar memory leaks
        await part.toBuffer();
      }
    } else {
      fields[part.fieldname] = part.value as string;
    }
  }

  return { fields, imageBuffer, imageMimeType };
}

// ── POST /api/admin/products ──────────────────────────────────────────

/**
 * Crea un producto nuevo.
 *
 * Body: multipart/form-data — todos los campos son requeridos.
 *   - name      (string)
 *   - price     (string → number)
 *   - stock     (string → number)
 *   - ventas    (string → number)
 *   - category  (string)
 *   - color     (string)
 *   - image     (file) — obligatorio
 */
export async function postProductHandler(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  const { fields, imageBuffer, imageMimeType } = await parseMultipart(request);

  if (!imageBuffer || !imageMimeType) {
    reply.code(400).send({ error: 'La imagen es requerida' });
    return;
  }

  const createFields: CreateProductFields = {
    name:     fields.name     ?? '',
    price:    Number(fields.price),
    stock:    Number(fields.stock),
    ventas:   Number(fields.ventas  ?? '0'),
    category: fields.category ?? '',
    color:    fields.color    ?? '',
  };

  const input: CreateProductInput = {
    fields:        createFields,
    imageBuffer,
    imageMimeType,
  };

  try {
    const product = await createProduct(input);
    reply.code(201).send({ product });
  } catch (err) {
    if (err instanceof ValidationError) {
      reply.code(400).send({ error: err.message });
      return;
    }
    throw err;
  }
}

// ── PATCH /api/admin/products/:id ────────────────────────────────────

/**
 * Aplica una actualización parcial sobre un producto existente.
 *
 * Body: multipart/form-data — todos los campos son opcionales.
 *   - name?     (string)
 *   - price?    (string → number)
 *   - stock?    (string → number)
 *   - ventas?   (string → number)
 *   - category? (string)
 *   - color?    (string)
 *   - image?    (file) — opcional, reemplaza la imagen actual
 */
export async function patchProductHandler(
  request: FastifyRequest<{ Params: PatchProductParams }>,
  reply:   FastifyReply,
): Promise<void> {
  const { id } = request.params;
  const { fields, imageBuffer, imageMimeType } = await parseMultipart(request);

  const patchFields: PatchProductFields = {};

  if (fields.name     !== undefined) patchFields.name     = fields.name;
  if (fields.price    !== undefined) patchFields.price    = Number(fields.price);
  if (fields.stock    !== undefined) patchFields.stock    = Number(fields.stock);
  if (fields.ventas   !== undefined) patchFields.ventas   = Number(fields.ventas);
  if (fields.category !== undefined) patchFields.category = fields.category;
  if (fields.color    !== undefined) patchFields.color    = fields.color;

  const input: PatchProductInput = {
    fields: patchFields,
    ...(imageBuffer   && { imageBuffer   }),
    ...(imageMimeType && { imageMimeType }),
  };

  try {
    const product = await patchProduct(id, input);
    reply.send({ product });
  } catch (err) {
    if (err instanceof NotFoundError) {
      reply.code(404).send({ error: err.message });
      return;
    }
    if (err instanceof ValidationError) {
      reply.code(400).send({ error: err.message });
      return;
    }
    throw err;
  }
}