/**
 * src/scripts/seed.ts
 *
 * Pobla la base de datos con los productos reales del catálogo.
 * Sube las imágenes desde /src/scripts/seed-images/ a Cloudinary
 * antes de insertar cada producto en PostgreSQL.
 *
 * Uso:
 *   npm run seed
 *
 * Requisitos:
 *   - Variables de entorno configuradas en .env
 *   - Imágenes en src/scripts/seed-images/
 *     (producto_1.jpeg … producto_8.jpeg)
 */

import path from 'path';
import fs   from 'fs';
import { PrismaClient, Category, Color } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

import { uploadImageBuffer } from '../lib/cloudinary';

// ── Clientes ──────────────────────────────────────────────────────────

const prisma = new PrismaClient();

// ── Tipos ─────────────────────────────────────────────────────────────

interface SeedProduct {
  name:      string;
  price:     number;
  category:  Category;
  color:     Color;
  stock:     number;
  ventas:    number;
  imageFile: string;
}

// ── Productos reales del catálogo ─────────────────────────────────────

const PRODUCTS: SeedProduct[] = [
  {
    name:      'Earcuff de cadena',
    price:     8000,
    category:  Category.EARCUFF,
    color:     Color.SILVER,
    stock:     2,
    ventas:    34,
    imageFile: 'producto_1.jpeg',
  },
  {
    name:      'Anillo de corazón',
    price:     12000,
    category:  Category.ANILLO,
    color:     Color.ROSADO,
    stock:     3,
    ventas:    58,
    imageFile: 'producto_2.jpeg',
  },
  {
    name:      'Dije sol',
    price:     10000,
    category:  Category.DIJE,
    color:     Color.BLANCO,
    stock:     5,
    ventas:    21,
    imageFile: 'producto_3.jpeg',
  },
  {
    name:      'Cadena Singapur',
    price:     9000,
    category:  Category.CADENA,
    color:     Color.SILVER,
    stock:     8,
    ventas:    76,
    imageFile: 'producto_4.jpeg',
  },
  {
    name:      'Topos girasol',
    price:     15000,
    category:  Category.TOPOS,
    color:     Color.BLANCO,
    stock:     0,
    ventas:    12,
    imageFile: 'producto_5.jpeg',
  },
  {
    name:      'Candongas doble cara',
    price:     15000,
    category:  Category.CANDONGAS,
    color:     Color.NEGRO,
    stock:     10,
    ventas:    43,
    imageFile: 'producto_6.jpeg',
  },
  {
    name:      'Cadena trébol corta',
    price:     30000,
    category:  Category.CADENA,
    color:     Color.SILVER,
    stock:     0,
    ventas:    89,
    imageFile: 'producto_7.jpeg',
  },
  {
    name:      'Conjunto rosa roja',
    price:     24000,
    category:  Category.CONJUNTOS,
    color:     Color.ROJO,
    stock:     2,
    ventas:    67,
    imageFile: 'producto_8.jpeg',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────

const IMAGES_DIR        = path.resolve(__dirname, 'seed-images');
const CLOUDINARY_FOLDER = 'coragem/products';

async function uploadLocalImage(
  filename: string,
): Promise<{ url: string; publicId: string; width: number; height: number }> {
  const filePath = path.join(IMAGES_DIR, filename);
  const buffer   = fs.readFileSync(filePath);
  const publicId = path.parse(filename).name;

  return uploadImageBuffer(buffer, CLOUDINARY_FOLDER, publicId);
}

// ── Runner principal ──────────────────────────────────────────────────

async function main() {
  console.log('🌱 Iniciando seed...\n');

  console.log('🧹 Limpiando productos existentes...');
  await prisma.product.deleteMany();
  console.log('   ✓ Tabla Product vaciada (cascade elimina Images)\n');

  for (const productData of PRODUCTS) {
    const { imageFile, ...productFields } = productData;

    console.log(`📦 Creando: ${productFields.name}`);

    process.stdout.write(`   ↑ Subiendo ${imageFile}...`);
    const uploaded = await uploadLocalImage(imageFile);
    process.stdout.write(' ✓\n');

    const isVisible = productFields.stock > 0;

    const created = await prisma.product.create({
      data: {
        ...productFields,
        isVisible,
        images: {
          create: {
            url:      uploaded.url,
            publicId: uploaded.publicId,
            width:    uploaded.width,
            height:   uploaded.height,
            order:    0,
          },
        },
      },
      select: { id: true, isVisible: true },
    });

    console.log(`   ✓ ID: ${created.id} — isVisible: ${created.isVisible}\n`);
  }

  const total  = PRODUCTS.length;
  const hidden = PRODUCTS.filter(p => p.stock === 0).length;

  console.log('✅ Seed completado.');
  console.log(`   ${total} productos insertados (${hidden} ocultos por stock = 0).`);
}

main()
  .catch((err) => {
    console.error('❌ Error durante el seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });