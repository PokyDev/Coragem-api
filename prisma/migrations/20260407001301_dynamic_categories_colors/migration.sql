-- Paso 1: Crear tablas con nombres que no colisionan con los enums
CREATE TABLE "ProductCategory" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductColor" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "hex"       TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductColor_pkey" PRIMARY KEY ("id")
);

-- Paso 2: Unique e índices
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "ProductCategory"("name");
CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug");
CREATE INDEX "ProductCategory_slug_idx" ON "ProductCategory"("slug");

CREATE UNIQUE INDEX "ProductColor_name_key" ON "ProductColor"("name");
CREATE UNIQUE INDEX "ProductColor_slug_key" ON "ProductColor"("slug");
CREATE INDEX "ProductColor_slug_idx" ON "ProductColor"("slug");

-- Paso 3: Poblar categorías
INSERT INTO "ProductCategory" ("id", "name", "slug", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Earcuff',   'earcuff',   NOW(), NOW()),
  (gen_random_uuid()::text, 'Anillo',    'anillo',    NOW(), NOW()),
  (gen_random_uuid()::text, 'Dije',      'dije',      NOW(), NOW()),
  (gen_random_uuid()::text, 'Cadena',    'cadena',    NOW(), NOW()),
  (gen_random_uuid()::text, 'Topos',     'topos',     NOW(), NOW()),
  (gen_random_uuid()::text, 'Candongas', 'candongas', NOW(), NOW()),
  (gen_random_uuid()::text, 'Conjuntos', 'conjuntos', NOW(), NOW());

-- Paso 4: Poblar colores
INSERT INTO "ProductColor" ("id", "name", "slug", "hex", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Rojo',   'rojo',   '#EF4444', NOW(), NOW()),
  (gen_random_uuid()::text, 'Negro',  'negro',  '#1C1C1C', NOW(), NOW()),
  (gen_random_uuid()::text, 'Blanco', 'blanco', '#F5F5F5', NOW(), NOW()),
  (gen_random_uuid()::text, 'Rosado', 'rosado', '#F9A8D4', NOW(), NOW()),
  (gen_random_uuid()::text, 'Silver', 'silver', '#C0C0C0', NOW(), NOW());

-- Paso 5: Columnas nuevas en Product (nullable temporalmente)
ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "Product" ADD COLUMN "colorId"    TEXT;

-- Paso 6: Rellenar desde los enums actuales
UPDATE "Product" p
SET "categoryId" = c."id"
FROM "ProductCategory" c
WHERE LOWER(p."category"::text) = c."slug";

UPDATE "Product" p
SET "colorId" = col."id"
FROM "ProductColor" col
WHERE LOWER(p."color"::text) = col."slug";

-- Paso 7: NOT NULL ahora que están pobladas
ALTER TABLE "Product" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "colorId"    SET NOT NULL;

-- Paso 8: Foreign keys
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_colorId_fkey"
  FOREIGN KEY ("colorId") REFERENCES "ProductColor"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Paso 9: Índices en Product
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_colorId_idx"    ON "Product"("colorId");

-- Paso 10: Eliminar columnas viejas
ALTER TABLE "Product" DROP COLUMN "category";
ALTER TABLE "Product" DROP COLUMN "color";

-- Paso 11: Eliminar los enums
DROP TYPE IF EXISTS "Category";
DROP TYPE IF EXISTS "Color";