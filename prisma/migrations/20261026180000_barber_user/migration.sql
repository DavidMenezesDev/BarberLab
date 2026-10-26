-- AlterTable
ALTER TABLE "Barber" ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Barber_userId_key" ON "Barber"("userId");

-- AddForeignKey
ALTER TABLE "Barber" ADD CONSTRAINT "Barber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Barbeiros que já entraram por convite passam a aparecer na lista.
INSERT INTO "Barber" ("id", "name", "isActive", "barbershopId", "userId", "updatedAt")
SELECT 'barber-' || u."id", COALESCE(u."name", split_part(u."email", '@', 1)), true, u."barbershopId", u."id", CURRENT_TIMESTAMP
FROM "User" u
WHERE u."staffRole" = 'BARBER' AND u."barbershopId" IS NOT NULL;
