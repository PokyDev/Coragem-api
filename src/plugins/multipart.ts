/**
 * src/plugins/multipart.ts
 */

import fp from 'fastify-plugin';
import multipart from '@fastify/multipart';

export const multipartPlugin = fp(async (app) => {
  app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB — igual al límite de Nginx
    },
  });
});