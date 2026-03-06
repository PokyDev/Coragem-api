/**
 * src/controllers/auth.controller.ts
 *
 * Recibe el callback de Google OAuth, orquesta el service
 * y responde con una cookie JWT + redirección al dashboard.
 *
 * No contiene lógica de negocio — eso vive en auth.service.ts.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  getGoogleUserInfo,
  assertEmailAllowed,
  upsertAdminFromGoogle,
} from '../services/auth.service';
import { config } from '../lib/config';

/**
 * GET /api/auth/google/callback
 *
 * Flujo:
 *   1. Intercambia el code de Google por un access token
 *   2. Consulta el perfil del usuario a Google
 *   3. Verifica whitelist — si falla, redirige con ?error=unauthorized
 *   4. Upsert del AdminUser en la base de datos
 *   5. Firma el JWT con el payload del admin
 *   6. Setea la cookie HttpOnly
 *   7. Redirige al frontend en /admin/dashboard
 */
export async function handleGoogleCallback(
  request: FastifyRequest,
  reply:   FastifyReply
): Promise<void> {
  const frontendUrl = config.auth.frontendUrl;

  try {
    // 1. Intercambiar el authorization code por un access token
    const { token } =
      await request.server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
        request
      );

    const accessToken = token.access_token;

    // 2. Obtener datos del usuario desde Google
    const googleUser = await getGoogleUserInfo(accessToken);

    // 3. Verificar whitelist
    assertEmailAllowed(googleUser.email);

    // 4. Crear o recuperar el AdminUser
    const admin = await upsertAdminFromGoogle(googleUser.email);

    // 5. Firmar el JWT
    const jwt = await reply.jwtSign(
      { id: admin.id, email: admin.email },
      { expiresIn: config.jwt.expiresIn }
    );

    // 6. Setear cookie HttpOnly — el frontend nunca toca el token directamente
    reply.setCookie('token', jwt, {
      httpOnly: true,
      secure:   config.server.nodeEnv === 'production',
      sameSite: config.server.nodeEnv === 'production' ? 'none' : 'lax',
      path:     '/',
      maxAge:   60 * 60 * 24 * 7, // 7 días en segundos
    });

    // 7. Redirigir al dashboard del admin en el frontend
    reply.redirect(`${frontendUrl}/admin/dashboard`);

  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';

    if (message === 'EMAIL_NOT_ALLOWED') {
      // Correo no autorizado — redirigir con indicador de error
      reply.redirect(`${frontendUrl}/admin?error=unauthorized`);
      return;
    }

    // Error inesperado — redirigir con indicador genérico
    request.server.log.error(err, 'Google OAuth callback error');
    reply.redirect(`${frontendUrl}/admin?error=server_error`);
  }
}

/**
 * GET /api/auth/me
 * Ruta protegida — devuelve el payload del JWT activo.
 * El preHandler authenticate ya verificó el token antes de llegar aquí.
 */
export async function getMe(
  request: FastifyRequest,
  reply:   FastifyReply
): Promise<void> {
  reply.send({ user: request.user });
}

/**
 * POST /api/auth/logout
 * Borra la cookie JWT. El cliente queda desautenticado.
 */
export async function postLogout(
  _request: FastifyRequest,
  reply:    FastifyReply
): Promise<void> {
  reply.clearCookie('token', { path: '/' });
  reply.send({ message: 'Sesión cerrada' });
}