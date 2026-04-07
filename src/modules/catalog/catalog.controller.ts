/**
 * src/modules/catalog/catalog.controller.ts
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listColors,
  createColor,
  updateColor,
  deleteColor,
  CatalogNotFoundError,
  CatalogConflictError,
  CatalogConstraintError,
} from './catalog.service';

// ── Tipos de request ──────────────────────────────────────────────────

interface IdParams        { id: string }
interface CategoryBody    { name: string }
interface ColorBody       { name: string; hex: string }

// ── Helpers ───────────────────────────────────────────────────────────

function handleCatalogError(err: unknown, reply: FastifyReply): void {
  if (err instanceof CatalogNotFoundError) {
    reply.code(404).send({ error: err.message });
    return;
  }
  if (err instanceof CatalogConflictError) {
    reply.code(409).send({ error: err.message });
    return;
  }
  if (err instanceof CatalogConstraintError) {
    reply.code(422).send({ error: err.message });
    return;
  }
  throw err;
}

// ── Categorías ────────────────────────────────────────────────────────

export async function getCategoriesHandler(
  _request: FastifyRequest,
  reply:    FastifyReply,
): Promise<void> {
  const categories = await listCategories();
  reply.send({ categories });
}

export async function postCategoryHandler(
  request: FastifyRequest<{ Body: CategoryBody }>,
  reply:   FastifyReply,
): Promise<void> {
  try {
    const category = await createCategory(request.body.name);
    reply.code(201).send({ category });
  } catch (err) {
    handleCatalogError(err, reply);
  }
}

export async function patchCategoryHandler(
  request: FastifyRequest<{ Params: IdParams; Body: CategoryBody }>,
  reply:   FastifyReply,
): Promise<void> {
  try {
    const category = await updateCategory(request.params.id, request.body.name);
    reply.send({ category });
  } catch (err) {
    handleCatalogError(err, reply);
  }
}

export async function deleteCategoryHandler(
  request: FastifyRequest<{ Params: IdParams }>,
  reply:   FastifyReply,
): Promise<void> {
  try {
    await deleteCategory(request.params.id);
    reply.code(204).send();
  } catch (err) {
    handleCatalogError(err, reply);
  }
}

// ── Colores ───────────────────────────────────────────────────────────

export async function getColorsHandler(
  _request: FastifyRequest,
  reply:    FastifyReply,
): Promise<void> {
  const colors = await listColors();
  reply.send({ colors });
}

export async function postColorHandler(
  request: FastifyRequest<{ Body: ColorBody }>,
  reply:   FastifyReply,
): Promise<void> {
  try {
    const color = await createColor(request.body.name, request.body.hex);
    reply.code(201).send({ color });
  } catch (err) {
    handleCatalogError(err, reply);
  }
}

export async function patchColorHandler(
  request: FastifyRequest<{ Params: IdParams; Body: ColorBody }>,
  reply:   FastifyReply,
): Promise<void> {
  try {
    const color = await updateColor(
      request.params.id,
      request.body.name,
      request.body.hex,
    );
    reply.send({ color });
  } catch (err) {
    handleCatalogError(err, reply);
  }
}

export async function deleteColorHandler(
  request: FastifyRequest<{ Params: IdParams }>,
  reply:   FastifyReply,
): Promise<void> {
  try {
    await deleteColor(request.params.id);
    reply.code(204).send();
  } catch (err) {
    handleCatalogError(err, reply);
  }
}