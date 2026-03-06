/**
 * src/controllers/pattern.controller.ts
 *
 * Recibe requests, delega al service y formatea la respuesta HTTP.
 * No contiene lógica de negocio ni acceso directo a Prisma.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import * as patternService from '../services/pattern.service';

interface PatternBody {
  nodes: number[];
}

/**
 * GET /api/pattern/exists
 * Público — el frontend consulta esto al cargar /admin
 * para saber si debe mostrar "define tu patrón" o "ingresa tu patrón".
 */
export async function getPatternExists(
  _req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const exists = await patternService.patternExists();
  reply.send({ exists });
}

/**
 * POST /api/pattern
 * Público — solo funciona si no existe patrón previo (setup inicial).
 * Si ya existe, devuelve 409 Conflict.
 */
export async function postSavePattern(
  req: FastifyRequest<{ Body: PatternBody }>,
  reply: FastifyReply
): Promise<void> {
  try {
    await patternService.savePattern(req.body.nodes);
    reply.code(201).send({ message: 'Patrón guardado correctamente' });
  } catch (err) {
    if (err instanceof Error && err.message === 'PATTERN_ALREADY_EXISTS') {
      reply.code(409).send({ error: 'Ya existe un patrón configurado' });
      return;
    }
    throw err;
  }
}

/**
 * POST /api/pattern/verify
 * Público — compara el patrón ingresado contra el almacenado.
 * El rate limiting se aplica a nivel de ruta en routes/.
 *
 * Responde siempre con 200 para no revelar información por el status code.
 * La diferencia está en el campo `match` del body.
 */
export async function postVerifyPattern(
  req: FastifyRequest<{ Body: PatternBody }>,
  reply: FastifyReply
): Promise<void> {
  const result = await patternService.verifyPattern(req.body.nodes);

  if (result.noPattern) {
    // No hay patrón: el frontend debería redirigir al setup.
    reply.code(404).send({ error: 'No hay patrón configurado' });
    return;
  }

  reply.send({ match: result.match });
}

/**
 * PUT /api/pattern
 * Protegido JWT — reemplaza el patrón existente.
 * Solo un admin autenticado con Google puede cambiar el patrón.
 */
export async function putUpdatePattern(
  req: FastifyRequest<{ Body: PatternBody }>,
  reply: FastifyReply
): Promise<void> {
  await patternService.updatePattern(req.body.nodes);
  reply.send({ message: 'Patrón actualizado correctamente' });
}