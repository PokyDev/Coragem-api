/**
 * src/plugins/cookie.ts
 *
 * Requerido por @fastify/jwt para leer el token desde cookies HttpOnly.
 * Debe registrarse antes del plugin JWT.
 */

import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';

export const cookiePlugin = fp(async (app) => {
  app.register(cookie);
});