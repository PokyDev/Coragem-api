/**
 * src/modules/cloudinary/cloudinary.routes.ts
 *
 * GET   /api/admin/cloudinary/images
 * PATCH /api/admin/cloudinary/images/:publicId/rename
 *
 * Ambas rutas requieren JWT (preHandler: authenticate).
 * El publicId viaja URL-encoded en el path param.
 */

import type { FastifyInstance } from 'fastify';
import { getAssetsHandler, patchRenameHandler } from './cloudinary.controller';

const renameSchema = {
  params: {
    type: 'object',
    required: ['publicId'],
    properties: {
      publicId: { type: 'string', minLength: 1 },
    },
  },
  body: {
    type: 'object',
    required: ['newName'],
    properties: {
      newName: { type: 'string', minLength: 1, maxLength: 100 },
    },
    additionalProperties: false,
  },
};

export async function cloudinaryRoutes(app: FastifyInstance): Promise<void> {
  app.get('/images', {
    preHandler: [app.authenticate],
    handler:    getAssetsHandler,
  });

  app.patch('/images/:publicId/rename', {
    schema:     renameSchema,
    preHandler: [app.authenticate],
    handler:    patchRenameHandler,
  });
}