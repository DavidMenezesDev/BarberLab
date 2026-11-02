-- AlterTable
ALTER TABLE "Barber" ADD COLUMN "commissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Booking"
  ADD COLUMN "chargedAmount" DECIMAL(10,2),
  ADD COLUMN "commissionPercent" DECIMAL(5,2),
  ADD COLUMN "commissionAmount" DECIMAL(10,2);

-- Atendimentos já concluídos entram no financeiro sem comissão: a porcentagem
-- dos barbeiros começa em 0, então todo o valor fica com a barbearia.
UPDATE "Booking" b
SET "chargedAmount" = s."price",
    "commissionPercent" = 0,
    "commissionAmount" = 0
FROM "BarbershopService" s
WHERE s."id" = b."serviceId" AND b."status" = 'COMPLETED';

-- CreateIndex
CREATE INDEX "Booking_status_date_idx" ON "Booking"("status", "date");
