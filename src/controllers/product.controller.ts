/**
 * src/controllers/product.controller.ts
 *
 * Extrae datos del request, llama al service y formatea la respuesta.
 * No contiene lógica de negocio ni acceso directo a Prisma.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Category, Color } from '@prisma/client';
import {
  getVisibleProducts,
  getVisibleProductById,
} from '../services/product.service';

interface GetProductsQuery {
  category?: Category;
  color?:    Color;
  search?:   string;
}

interface GetProductByIdParams {
  id: string;
}

/**
 * GET /api/products
 * Devuelve los productos visibles, con filtros opcionales.
 */
export async function getProducts(
  request: FastifyRequest<{ Querystring: GetProductsQuery }>,
  reply:   FastifyReply
): Promise<void> {
  const { category, color, search } = request.query;
  const products = await getVisibleProducts({ category, color, search });
  reply.send({ products });
}

/**
 * GET /api/products/:id
 * Devuelve el detalle de un producto visible.
 * 404 si no existe o está oculto.
 */
export async function getProductById(
  request: FastifyRequest<{ Params: GetProductByIdParams }>,
  reply:   FastifyReply
): Promise<void> {
  const { id } = request.params;
  const product = await getVisibleProductById(id);

  if (!product) {
    reply.code(404).send({ error: 'Producto no encontrado' });
    return;
  }

  reply.send({ product });
}