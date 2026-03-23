/**
 * src/services/pattern.service.ts
 *
 * Lógica de negocio del patrón de desbloqueo.
 * Responsabilidades:
 *   - Serializar el array de nodos a string comparable
 *   - Hashear con bcrypt antes de persistir
 *   - Consultar existencia, guardar, actualizar y verificar
 *
 * El patrón se almacena en AppConfig con key = PATTERN_CONFIG_KEY.
 * El valor almacenado es siempre un hash bcrypt — nunca el patrón en texto plano.
 */

import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';

const PATTERN_CONFIG_KEY = 'unlock_pattern';
const SALT_ROUNDS = 12;

/**
 * Serializa el array de nodos a un string canónico.
 * [0, 4, 8, 2] → "0-4-8-2"
 * El orden importa: es parte del patrón.
 */
function serializeNodes(nodes: number[]): string {
  return nodes.join('-');
}

/**
 * Consulta si existe un patrón guardado en la base de datos.
 * No expone el hash — solo devuelve un booleano.
 */
export async function patternExists(): Promise<boolean> {
  const record = await prisma.appConfig.findUnique({
    where: { key: PATTERN_CONFIG_KEY },
    select: { key: true },
  });
  return record !== null;
}

/**
 * Guarda un patrón nuevo.
 * Solo debe llamarse cuando no existe patrón previo.
 * Lanza un error si ya existe uno (la capa de controller decide el status HTTP).
 */
export async function savePattern(nodes: number[]): Promise<void> {
  const exists = await patternExists();
  if (exists) {
    throw new Error('PATTERN_ALREADY_EXISTS');
  }

  const hash = await bcrypt.hash(serializeNodes(nodes), SALT_ROUNDS);

  await prisma.appConfig.create({
    data: {
      key:   PATTERN_CONFIG_KEY,
      value: hash,
    },
  });
}

/**
 * Reemplaza el patrón existente.
 * Usa upsert para que funcione aunque no haya registro previo
 * (caso edge: base de datos limpia pero la ruta requiere JWT).
 */
export async function updatePattern(nodes: number[]): Promise<void> {
  const hash = await bcrypt.hash(serializeNodes(nodes), SALT_ROUNDS);

  await prisma.appConfig.upsert({
    where:  { key: PATTERN_CONFIG_KEY },
    update: { value: hash },
    create: { key: PATTERN_CONFIG_KEY, value: hash },
  });
}

/**
 * Compara el patrón ingresado contra el hash almacenado.
 * Devuelve:
 *   - { match: true }  si coinciden
 *   - { match: false } si no coinciden
 *   - { match: false, noPattern: true } si no hay patrón guardado aún
 */
export async function verifyPattern(
  nodes: number[]
): Promise<{ match: boolean; noPattern?: boolean }> {
  const record = await prisma.appConfig.findUnique({
    where: { key: PATTERN_CONFIG_KEY },
  });

  if (!record) {
    return { match: false, noPattern: true };
  }

  const match = await bcrypt.compare(serializeNodes(nodes), record.value);
  return { match };
}