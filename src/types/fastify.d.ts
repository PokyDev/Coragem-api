/**
 * src/types/fastify.d.ts
 *
 * Augmentación del namespace de Fastify para registrar el decorador
 * `authenticate` que agrega el plugin JWT, y el payload del token.
 */

import '@fastify/jwt';
import 'fastify';

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
  }
}