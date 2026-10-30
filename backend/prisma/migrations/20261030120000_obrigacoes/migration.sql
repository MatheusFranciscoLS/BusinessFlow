-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "obligationKey" TEXT;

-- CreateIndex
CREATE INDEX "Task_companyId_obligationKey_idx" ON "Task"("companyId", "obligationKey");

