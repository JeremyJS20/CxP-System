-- Add account columns to conceptos_pago
ALTER TABLE "conceptos_pago" ADD COLUMN "cuentaDebitoId" INTEGER;
ALTER TABLE "conceptos_pago" ADD COLUMN "cuentaCreditoId" INTEGER;

-- Backfill existing rows with default mapping (4=Gasto, 2=Cuentas por Pagar)
UPDATE "conceptos_pago" SET "cuentaDebitoId" = 4, "cuentaCreditoId" = 2 WHERE "cuentaDebitoId" IS NULL;

ALTER TABLE "conceptos_pago" ALTER COLUMN "cuentaDebitoId" SET NOT NULL;
ALTER TABLE "conceptos_pago" ALTER COLUMN "cuentaCreditoId" SET NOT NULL;

-- Drop old column
ALTER TABLE "conceptos_pago" DROP COLUMN "cuentaContable";