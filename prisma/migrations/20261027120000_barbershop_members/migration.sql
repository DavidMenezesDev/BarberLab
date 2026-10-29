-- CreateTable
CREATE TABLE "BarbershopMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "staffRole" "StaffRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarbershopMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BarbershopMember_userId_barbershopId_key" ON "BarbershopMember"("userId", "barbershopId");
CREATE INDEX "BarbershopMember_barbershopId_idx" ON "BarbershopMember"("barbershopId");
ALTER TABLE "BarbershopMember" ADD CONSTRAINT "BarbershopMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BarbershopMember" ADD CONSTRAINT "BarbershopMember_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Quem já estava vinculado a uma barbearia vira membro dela, com o mesmo papel.
INSERT INTO "BarbershopMember" ("id", "userId", "barbershopId", "staffRole")
SELECT 'bm_' || "id", "id", "barbershopId", COALESCE("staffRole", 'BARBER')
FROM "User"
WHERE "barbershopId" IS NOT NULL;

-- Um usuário pode atender em mais de uma unidade.
DROP INDEX "Barber_userId_key";
CREATE UNIQUE INDEX "Barber_barbershopId_userId_key" ON "Barber"("barbershopId", "userId");
CREATE INDEX "Barber_userId_idx" ON "Barber"("userId");

-- Os campos antigos saem de User.
ALTER TABLE "User" DROP CONSTRAINT "User_barbershopId_fkey";
DROP INDEX "User_barbershopId_idx";
ALTER TABLE "User" DROP COLUMN "barbershopId", DROP COLUMN "staffRole";
