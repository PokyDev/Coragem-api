/**
 * src/plugins/oauth.ts
 *
 * Registra @fastify/oauth2 con las credenciales de Google.
 * Expone app.googleOAuth2 que se usa en auth.routes.ts
 * para iniciar el flujo y obtener el access token en el callback.
 */

import fp           from 'fastify-plugin';
import oauthPlugin  from '@fastify/oauth2';
import { config   } from '../lib/config';

export const googleOAuthPlugin = fp(async (app) => {
  await app.register(oauthPlugin, {
    name:        'googleOAuth2',
    credentials: {
      client: {
        id:     config.google.clientId,
        secret: config.google.clientSecret,
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION,
    },
    scope:       ['email', 'profile'],
    startRedirectPath: '/api/auth/google',
    callbackUri:       config.google.callbackUrl,
  });
});