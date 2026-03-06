/**
 * src/types/fastify.d.ts
 *
 * Augmentación del namespace de Fastify para:
 *   - el decorador `authenticate` del plugin JWT
 *   - el decorador `googleOAuth2` del plugin OAuth2
 *   - el payload del JWT
 */

import '@fastify/jwt';
import 'fastify';
import type { OAuth2Namespace } from '@fastify/oauth2';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email: string };
    user:    { id: string; email: string };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: import('fastify').FastifyRequest,
      reply:   import('fastify').FastifyReply
    ) => Promise<void>;

    googleOAuth2: OAuth2Namespace;
  }
}