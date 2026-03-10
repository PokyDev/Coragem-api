/**
 * src/controllers/product.controller.ts
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Category, Color } from '@prisma/client';
import type { SortKey } from '../services/product.service';
import {
  getVisibleProducts,
  getVisibleProductById,
} from '../services/product.service';

interface GetProductsQuery {
  category?: Category;
  color?:    Color;
  search?:   string;
  sort?:     SortKey;
  priceMin?: number;
  priceMax?: number;
}

interface GetProductByIdParams {
  id: string;
}

export async function getProducts(
  request: FastifyRequest<{ Querystring: GetProductsQuery }>,
  reply:   FastifyReply
): Promise<void> {
  const { category, color, search, sort, priceMin, priceMax } = request.query;
  const products = await getVisibleProducts({ category, color, search, sort, priceMin, priceMax });
  reply.send({ products });
}

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