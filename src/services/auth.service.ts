/**
 * src/services/auth.service.ts
 *
 * Lógica de negocio de autenticación OAuth.
 * Responsabilidades:
 *   - Consultar el perfil del usuario a la API de Google
 *   - Verificar que el correo esté en la whitelist (.env)
 *   - Hacer upsert del AdminUser en la base de datos
 *
 * El firmado del JWT y el seteo de la cookie son
 * responsabilidad del controller, no del service.
 */

import { prisma } from '../lib/prisma';
import { config } from '../lib/config';

interface GoogleUserInfo {
  sub:            string;
  email:          string;
  email_verified: boolean;
  name:           string;
  picture:        string;
}

/**
 * Consulta el perfil del usuario autenticado a la API de Google
 * usando el access token obtenido en el callback OAuth.
 */
export async function getGoogleUserInfo(
  accessToken: string
): Promise<GoogleUserInfo> {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Google user info');
  }

  return response.json() as Promise<GoogleUserInfo>;
}

/**
 * Verifica que el correo del usuario esté en la whitelist.
 * Solo se permite el correo definido en ADMIN_ALLOWED_EMAIL.
 * Lanza un error tipado que el controller convierte en 403.
 */
export function assertEmailAllowed(email: string): void {
  const allowed = config.auth.adminAllowedEmail.toLowerCase().trim();
  if (email.toLowerCase().trim() !== allowed) {
    throw new Error('EMAIL_NOT_ALLOWED');
  }
}

/**
 * Crea o devuelve el AdminUser asociado al correo de Google.
 * Upsert: si el admin ya existe (login posterior), simplemente lo retorna.
 * Si es la primera vez, lo crea.
 *
 * No se almacena contraseña porque la autenticación es exclusivamente OAuth.
 * El campo passwordHash se deja vacío — nunca se usará para bcrypt.
 */
export async function upsertAdminFromGoogle(
  email: string
): Promise<{ id: string; email: string }> {
  const admin = await prisma.adminUser.upsert({
    where:  { email },
    update: {},
    create: { email },
    select: { id: true, email: true },
  });

  return admin;
}