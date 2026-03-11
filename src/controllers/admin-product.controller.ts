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
  patchProduct,
  ValidationError,
  NotFoundError,
  type PatchProductInput,
} from '../services/admin-product.service';
import type { PatchProductFields } from '../schemas/admin-product.schema';

interface PatchProductParams {
  id: string;
}

/**
 * PATCH /api/admin/products/:id
 *
 * Body: multipart/form-data
 *   - name?     (string)
 *   - price?    (string → number)
 *   - stock?    (string → number)
 *   - ventas?   (string → number)
 *   - category? (string)
 *   - color?    (string)
 *   - image?    (file) — opcional, reemplaza la imagen actual
 *
 * Multipart llega como stream. Usamos @fastify/multipart con
 * request.parts() para iterar campos y archivos en un solo paso.
 */
export async function patchProductHandler(
  request: FastifyRequest<{ Params: PatchProductParams }>,
  reply:   FastifyReply,
): Promise<void> {
  const { id } = request.params;

  // ── Parsear multipart ────────────────────────────────────────────
  const fields: PatchProductFields = {};
  let   imageBuffer:   Buffer | undefined;
  let   imageMimeType: string | undefined;

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      // Solo procesamos el campo "image"; ignoramos otros archivos
      if (part.fieldname === 'image') {
        imageBuffer   = await part.toBuffer();
        imageMimeType = part.mimetype;
      } else {
        // Consumir el stream para evitar memory leaks aunque no lo usemos
        await part.toBuffer();
      }
    } else {
      // Campo de texto — lo mapeamos al tipo PatchProductFields
      const value = part.value as string;

      switch (part.fieldname) {
        case 'name':     fields.name     = value; break;
        case 'price':    fields.price    = Number(value); break;
        case 'stock':    fields.stock    = Number(value); break;
        case 'ventas':   fields.ventas   = Number(value); break;
        case 'category': fields.category = value; break;
        case 'color':    fields.color    = value; break;
        // Ignorar campos desconocidos
      }
    }
  }

  // ── Delegar al service ───────────────────────────────────────────
  const patchInput: PatchProductInput = {
    fields,
    ...(imageBuffer   && { imageBuffer   }),
    ...(imageMimeType && { imageMimeType }),
  };

  try {
    const product = await patchProduct(id, patchInput);
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
    // Error inesperado — Fastify lo captura y devuelve 500
    throw err;
  }
}