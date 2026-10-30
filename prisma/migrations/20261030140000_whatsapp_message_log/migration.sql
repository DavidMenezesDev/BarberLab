-- CreateEnum
CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "WhatsAppMessageLog" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" "WhatsAppMessageStatus" NOT NULL,
    "error" TEXT,
    "phone" TEXT,
    "body" TEXT,
    "bookingId" TEXT,
    "barbershopName" TEXT,
    "connectionId" TEXT,
    "connectionName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppMessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsAppMessageLog_createdAt_idx" ON "WhatsAppMessageLog"("createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppMessageLog_bookingId_idx" ON "WhatsAppMessageLog"("bookingId");

-- AddForeignKey
ALTER TABLE "WhatsAppMessageLog" ADD CONSTRAINT "WhatsAppMessageLog_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "WhatsAppConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
