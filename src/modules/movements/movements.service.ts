/**
 * src/modules/movements/movements.service.ts
 */

import type { MovementType } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export class MovementValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MovementValidationError';
  }
}

export class MovementNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MovementNotFoundError';
  }
}

const movementSelect = {
  id:          true,
  productId:   true,
  type:        true,
  quantity:    true,
  stockBefore: true,
  stockAfter:  true,
  createdAt:   true,
  product: {
    select: { id: true, name: true },
  },
} as const;

// ── Crear movimiento ──────────────────────────────────────────────────

export async function createMovement(
  productId: string,
  type:      MovementType,
  quantity:  number,
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where:  { id: productId },
      select: { id: true, stock: true },
    });

    if (!product) {
      throw new MovementNotFoundError('Producto no encontrado');
    }

    if (type === 'SALE' && quantity > product.stock) {
      throw new MovementValidationError(
        `Stock insuficiente. Disponible: ${product.stock}, solicitado: ${quantity}`,
      );
    }

    const stockBefore = product.stock;
    const stockAfter  = type === 'PURCHASE'
      ? stockBefore + quantity
      : stockBefore - quantity;

    await tx.product.update({
      where: { id: productId },
      data:  { stock: stockAfter, isVisible: stockAfter > 0 },
    });

    return tx.productMovement.create({
      data:   { productId, type, quantity, stockBefore, stockAfter },
      select: movementSelect,
    });
  });
}

// ── Listar movimientos ────────────────────────────────────────────────

export async function getMovements(filters: { type?: MovementType; limit?: number }) {
  return prisma.productMovement.findMany({
    where:   filters.type ? { type: filters.type } : undefined,
    orderBy: { createdAt: 'desc' },
    take:    filters.limit ?? 50,
    select:  movementSelect,
  });
}

// ── Movimiento por ID ─────────────────────────────────────────────────

export async function getMovementById(id: string) {
  const movement = await prisma.productMovement.findUnique({
    where:  { id },
    select: movementSelect,
  });

  if (!movement) {
    throw new MovementNotFoundError('Movimiento no encontrado');
  }

  return movement;
}