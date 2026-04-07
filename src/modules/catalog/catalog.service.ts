/**
 * src/modules/catalog/catalog.service.ts
 *
 * Lógica de negocio para categorías y colores dinámicos.
 * El slug se genera internamente — el cliente solo maneja name y hex.
 */

import { prisma } from '../../lib/prisma';

// ── Errores tipados ───────────────────────────────────────────────────

export class CatalogNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CatalogNotFoundError';
  }
}

export class CatalogConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CatalogConflictError';
  }
}

export class CatalogConstraintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CatalogConstraintError';
  }
}

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Genera un slug a partir del nombre.
 * "Earcuff" → "earcuff" | "Oro Rosa" → "oro-rosa"
 */
function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // elimina tildes
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// ── Categorías ────────────────────────────────────────────────────────

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: {
      id:   true,
      name: true,
      slug: true,
      _count: { select: { products: true } },
    },
  });
}

export async function createCategory(name: string) {
  const slug = toSlug(name);

  const existing = await prisma.category.findUnique({
    where:  { slug },
    select: { id: true },
  });

  if (existing) {
    throw new CatalogConflictError(`Ya existe una categoría con el nombre "${name}"`);
  }

  return prisma.category.create({
    data:   { name: name.trim(), slug },
    select: { id: true, name: true, slug: true },
  });
}

export async function updateCategory(id: string, name: string) {
  const existing = await prisma.category.findUnique({
    where:  { id },
    select: { id: true },
  });

  if (!existing) {
    throw new CatalogNotFoundError('Categoría no encontrada');
  }

  const slug = toSlug(name);

  // Verificar que el nuevo slug no colisione con otra categoría
  const conflict = await prisma.category.findFirst({
    where:  { slug, NOT: { id } },
    select: { id: true },
  });

  if (conflict) {
    throw new CatalogConflictError(`Ya existe una categoría con el nombre "${name}"`);
  }

  return prisma.category.update({
    where:  { id },
    data:   { name: name.trim(), slug },
    select: { id: true, name: true, slug: true },
  });
}

export async function deleteCategory(id: string) {
  const existing = await prisma.category.findUnique({
    where:  { id },
    select: {
      id: true,
      _count: { select: { products: true } },
    },
  });

  if (!existing) {
    throw new CatalogNotFoundError('Categoría no encontrada');
  }

  if (existing._count.products > 0) {
    throw new CatalogConstraintError(
      `No se puede eliminar: ${existing._count.products} producto(s) usan esta categoría`
    );
  }

  await prisma.category.delete({ where: { id } });
}

// ── Colores ───────────────────────────────────────────────────────────

export async function listColors() {
  return prisma.color.findMany({
    orderBy: { name: 'asc' },
    select: {
      id:   true,
      name: true,
      slug: true,
      hex:  true,
      _count: { select: { products: true } },
    },
  });
}

export async function createColor(name: string, hex: string) {
  const slug = toSlug(name);

  const existing = await prisma.color.findUnique({
    where:  { slug },
    select: { id: true },
  });

  if (existing) {
    throw new CatalogConflictError(`Ya existe un color con el nombre "${name}"`);
  }

  return prisma.color.create({
    data:   { name: name.trim(), slug, hex: hex.toUpperCase() },
    select: { id: true, name: true, slug: true, hex: true },
  });
}

export async function updateColor(id: string, name: string, hex: string) {
  const existing = await prisma.color.findUnique({
    where:  { id },
    select: { id: true },
  });

  if (!existing) {
    throw new CatalogNotFoundError('Color no encontrado');
  }

  const slug = toSlug(name);

  const conflict = await prisma.color.findFirst({
    where:  { slug, NOT: { id } },
    select: { id: true },
  });

  if (conflict) {
    throw new CatalogConflictError(`Ya existe un color con el nombre "${name}"`);
  }

  return prisma.color.update({
    where:  { id },
    data:   { name: name.trim(), slug, hex: hex.toUpperCase() },
    select: { id: true, name: true, slug: true, hex: true },
  });
}

export async function deleteColor(id: string) {
  const existing = await prisma.color.findUnique({
    where:  { id },
    select: {
      id: true,
      _count: { select: { products: true } },
    },
  });

  if (!existing) {
    throw new CatalogNotFoundError('Color no encontrado');
  }

  if (existing._count.products > 0) {
    throw new CatalogConstraintError(
      `No se puede eliminar: ${existing._count.products} producto(s) usan este color`
    );
  }

  await prisma.color.delete({ where: { id } });
}

// test