/**
 * src/modules/cloudinary/cloudinary.controller.ts
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { listFolders, listAssets, renameAsset, moveAssets } from './cloudinary.service';

interface FoldersQuery { path?: string }
interface AssetsQuery  { folder: string }
interface RenameParams { publicId: string }
interface RenameBody   { newName:  string }

interface MoveBody {
  publicIds:    string[];
  targetFolder: string;
}

/**
 * GET /api/admin/cloudinary/folders?path=
 */
export async function getFoldersHandler(
  request: FastifyRequest<{ Querystring: FoldersQuery }>,
  reply:   FastifyReply,
): Promise<void> {
  const { path } = request.query;

  try {
    const folders = await listFolders(path ?? '');
    reply.send({ folders });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al listar carpetas';
    reply.code(500).send({ error: message });
  }
}

/**
 * GET /api/admin/cloudinary/images?folder=coragem/products
 */
export async function getAssetsHandler(
  request: FastifyRequest<{ Querystring: AssetsQuery }>,
  reply:   FastifyReply,
): Promise<void> {
  const { folder } = request.query;

  try {
    const assets = await listAssets(folder);
    reply.send({ assets });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al listar imágenes';
    reply.code(500).send({ error: message });
  }
}

/**
 * PATCH /api/admin/cloudinary/images/:publicId/rename
 */
export async function patchRenameHandler(
  request: FastifyRequest<{
    Params: RenameParams;
    Body:   RenameBody;
  }>,
  reply: FastifyReply,
): Promise<void> {
  const publicId = decodeURIComponent(request.params.publicId);
  const { newName } = request.body;

  if (!newName?.trim()) {
    reply.code(400).send({ error: 'El nombre no puede estar vacío' });
    return;
  }

  try {
    const result = await renameAsset(publicId, newName);
    reply.send({ asset: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al renombrar';
    reply.code(500).send({ error: message });
  }
}

/**
 * PATCH /api/admin/cloudinary/assets/move
 *
 * Mueve uno o varios assets a una carpeta destino.
 * Body: { publicIds: string[], targetFolder: string }
 */
export async function patchMoveAssetsHandler(
  request: FastifyRequest<{ Body: MoveBody }>,
  reply:   FastifyReply,
): Promise<void> {
  const { publicIds, targetFolder } = request.body;

  try {
    const result = await moveAssets(publicIds, targetFolder);
    reply.send(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al mover assets';
    reply.code(500).send({ error: message });
  }
}