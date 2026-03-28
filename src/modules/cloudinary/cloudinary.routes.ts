/**
 * src/modules/cloudinary/cloudinary.routes.ts
 *
 * GET   /api/admin/cloudinary/folders?path=
 * GET   /api/admin/cloudinary/images?folder=
 * PATCH /api/admin/cloudinary/images/:publicId/rename
 * PATCH /api/admin/cloudinary/assets/move
 *
 * Todas las rutas requieren JWT (preHandler: authenticate).
 */

import type { FastifyInstance } from 'fastify';
import {
  getFoldersHandler,
  getAssetsHandler,
  patchRenameHandler,
  patchMoveAssetsHandler,
} from './cloudinary.controller';

const foldersSchema = {
  querystring: {
    type: 'object',
    properties: {
      path: { type: 'string' },
    },
    additionalProperties: false,
  },
};

const assetsSchema = {
  querystring: {
    type: 'object',
    required: ['folder'],
    properties: {
      folder: { type: 'string' },
    },
    additionalProperties: false,
  },
};

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

const moveSchema = {
  body: {
    type: 'object',
    required: ['publicIds', 'targetFolder'],
    properties: {
      publicIds: {
        type:     'array',
        items:    { type: 'string', minLength: 1 },
        minItems: 1,
        maxItems: 100,
      },
      targetFolder: { type: 'string' },
    },
    additionalProperties: false,
  },
};

export async function cloudinaryRoutes(app: FastifyInstance): Promise<void> {
  app.get('/folders', {
    schema:     foldersSchema,
    preHandler: [app.authenticate],
    handler:    getFoldersHandler,
  });

  app.get('/images', {
    schema:     assetsSchema,
    preHandler: [app.authenticate],
    handler:    getAssetsHandler,
  });

  app.patch('/images/:publicId/rename', {
    schema:     renameSchema,
    preHandler: [app.authenticate],
    handler:    patchRenameHandler,
  });

  app.patch('/assets/move', {
    schema:     moveSchema,
    preHandler: [app.authenticate],
    handler:    patchMoveAssetsHandler,
  });
}