/**
 * src/plugins/cors.ts
 */

import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { config } from '../lib/config';

export const corsPlugin = fp(async (app) => {
  await app.register(cors, {
    origin:      config.cors.allowedOrigin,
    credentials: true,
  });
});