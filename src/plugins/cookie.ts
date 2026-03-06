/**
 * src/plugins/cookie.ts
 *
 * Requerido por @fastify/jwt para leer el token desde cookies HttpOnly.
 * Debe registrarse antes del plugin JWT en app.ts.
 */

import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';

export const cookiePlugin = fp(async (app) => {
  await app.register(cookie);
});