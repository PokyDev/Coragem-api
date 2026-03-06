/**
 * src/plugins/jwt.ts
 */

import fp from 'fastify-plugin';
import fjwt from '@fastify/jwt';
import { config } from '../lib/config';
import type { FastifyRequest, FastifyReply } from 'fastify';

export const jwtPlugin = fp(async (app) => {
  app.register(fjwt, {
    secret: config.jwt.secret,
    cookie: {
      cookieName: 'token',
      signed:     false,
    },
  });

  app.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify({ onlyCookie: true });
      } catch {
        reply.code(401).send({ error: 'Unauthorized' });
      }
    }
  );
});