-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "disabledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "priceMonthly" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "priceYearly" DECIMAL(10,2),
    "maxUnits" INTEGER,
    "maxBarbers" INTEGER,
    "features" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Barbershop" ADD COLUMN "planId" TEXT,
ADD COLUMN "suspendedAt" TIMESTAMP(3),
ADD COLUMN "featureOverrides" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

-- CreateIndex
CREATE INDEX "Barbershop_planId_idx" ON "Barbershop"("planId");

-- AddForeignKey
ALTER TABLE "Barbershop" ADD CONSTRAINT "Barbershop_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Planos iniciais. Barbearias já existentes ficam sem plano (acesso total).
INSERT INTO "Plan" ("id", "name", "slug", "description", "priceMonthly", "priceYearly", "maxUnits", "maxBarbers", "features", "isDefault", "sortOrder", "updatedAt")
VALUES
  ('plan_basico', 'Básico', 'basico', 'Agenda online para uma barbearia.', 49.90, 499.00, 1, 3, ARRAY['scheduleBlocks']::TEXT[], true, 1, CURRENT_TIMESTAMP),
  ('plan_profissional', 'Profissional', 'profissional', 'Personalização, equipe e várias unidades.', 99.90, 999.00, 5, 15, ARRAY['scheduleBlocks','appearance','multiUnit','staffInvites']::TEXT[], false, 2, CURRENT_TIMESTAMP);
