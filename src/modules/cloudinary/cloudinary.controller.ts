/**
 * src/modules/cloudinary/cloudinary.controller.ts
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { listAssets, renameAsset } from './cloudinary.service';

interface RenameParams { publicId: string }
interface RenameBody   { newName:  string }

export async function getAssetsHandler(
  _request: FastifyRequest,
  reply:    FastifyReply,
): Promise<void> {
  const assets = await listAssets();
  reply.send({ assets });
}

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