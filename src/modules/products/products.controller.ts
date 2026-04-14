/**
 * src/modules/products/products.controller.ts
 *
 * Recibe requests, delega al service y formatea la respuesta HTTP.
 * Unifica lo que antes estaba en product.controller.ts y admin-product.controller.ts.
 * No contiene lógica de negocio ni acceso directo a Prisma.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Category, Color } from '@prisma/client';
import {
  getVisibleProducts,
  getVisibleProductById,
  getAllProducts,
  getTopSellingProducts,
  createProduct,
  patchProduct,
  deleteProduct,
  ProductValidationError,
  ProductNotFoundError,
  type SortKey,
} from './products.service';
import type { CreateProductBody, PatchProductBody } from './products.schema';

// ── Tipos de request ──────────────────────────────────────────────────

interface GetProductsQuery {
  categorySlug?: string;
  colorSlug?:    string;
  search?:       string;
  sort?:         SortKey;
  priceMin?:     number;
  priceMax?:     number;
}

interface ProductIdParams {
  id: string;
}

// ── Handlers públicos ─────────────────────────────────────────────────

export async function getProductsHandler(
  request: FastifyRequest<{ Querystring: GetProductsQuery }>,
  reply:   FastifyReply,
): Promise<void> {
  const products = await getVisibleProducts(request.query);
  reply.send({ products });
}

export async function getProductByIdHandler(
  request: FastifyRequest<{ Params: ProductIdParams }>,
  reply:   FastifyReply,
): Promise<void> {
  const product = await getVisibleProductById(request.params.id);

  if (!product) {
    reply.code(404).send({ error: 'Producto no encontrado' });
    return;
  }

  reply.send({ product });
}

// ── Handlers admin ────────────────────────────────────────────────────

export async function getAdminProductsHandler(
  _request: FastifyRequest,
  reply:    FastifyReply,
): Promise<void> {
  const products = await getAllProducts();
  reply.send({ products });
}

export async function getTopProductsHandler(
  _request: FastifyRequest,
  reply:    FastifyReply,
): Promise<void> {
  const products = await getTopSellingProducts();
  reply.send({ products });
}

export async function postProductHandler(
  request: FastifyRequest<{ Body: CreateProductBody }>,
  reply:   FastifyReply,
): Promise<void> {
  try {
    const product = await createProduct(request.body);
    reply.code(201).send({ product });
  } catch (err) {
    if (err instanceof ProductValidationError) {
      reply.code(400).send({ error: err.message });
      return;
    }
    throw err;
  }
}

export async function patchProductHandler(
  request: FastifyRequest<{ Params: ProductIdParams; Body: PatchProductBody }>,
  reply:   FastifyReply,
): Promise<void> {
  try {
    const product = await patchProduct(request.params.id, request.body);
    reply.send({ product });
  } catch (err) {
    if (err instanceof ProductNotFoundError) {
      reply.code(404).send({ error: err.message });
      return;
    }
    if (err instanceof ProductValidationError) {
      reply.code(400).send({ error: err.message });
      return;
    }
    throw err;
  }
}

export async function deleteProductHandler(
  request: FastifyRequest<{ Params: ProductIdParams }>,
  reply:   FastifyReply,
): Promise<void> {
  try {
    await deleteProduct(request.params.id);
    reply.code(204).send();
  } catch (err) {
    if (err instanceof ProductNotFoundError) {
      reply.code(404).send({ error: err.message });
      return;
    }
    throw err;
  }
}