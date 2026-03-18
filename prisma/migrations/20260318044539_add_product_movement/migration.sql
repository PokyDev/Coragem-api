-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('PURCHASE', 'SALE');

-- CreateTable
CREATE TABLE "ProductMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "stockBefore" INTEGER NOT NULL,
    "stockAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductMovement_productId_idx" ON "ProductMovement"("productId");

-- CreateIndex
CREATE INDEX "ProductMovement_type_idx" ON "ProductMovement"("type");

-- CreateIndex
CREATE INDEX "ProductMovement_createdAt_idx" ON "ProductMovement"("createdAt");

-- AddForeignKey
ALTER TABLE "ProductMovement" ADD CONSTRAINT "ProductMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
