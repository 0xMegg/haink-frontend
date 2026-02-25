-- Ensure SalesChannel enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SalesChannel') THEN
    CREATE TYPE "SalesChannel" AS ENUM ('KODY_GLOBAL', 'KPOP_WHOLESALE', 'KPOP_B2B');
  END IF;
END
$$;

-- Rename ExternalProductMap to ExternalRef and align columns/indexes
ALTER TABLE "ExternalProductMap" RENAME TO "ExternalRef";
ALTER INDEX "ExternalProductMap_pkey" RENAME TO "ExternalRef_pkey";
ALTER INDEX "ExternalProductMap_product_id_idx" RENAME TO "ExternalRef_product_id_idx";
ALTER INDEX "ExternalProductMap_system_external_id_key" RENAME TO "ExternalRef_system_external_product_id_key";
ALTER TABLE "ExternalRef" RENAME COLUMN "external_id" TO "external_product_id";
ALTER TABLE "ExternalRef" RENAME COLUMN "raw_snapshot" TO "raw_snapshot_json";
ALTER TABLE "ExternalRef" ALTER COLUMN "last_synced_at" TYPE TIMESTAMP(3) USING "last_synced_at"::timestamp(3);
ALTER TABLE "ExternalRef" ALTER COLUMN "created_at" TYPE TIMESTAMP(3) USING "created_at"::timestamp(3);
ALTER TABLE "ExternalRef" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ExternalRef" ALTER COLUMN "updated_at" TYPE TIMESTAMP(3) USING "updated_at"::timestamp(3);
ALTER TABLE "ExternalRef" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ExternalRef" RENAME CONSTRAINT "ExternalProductMap_product_id_fkey" TO "ExternalRef_product_id_fkey";
ALTER TRIGGER external_product_map_set_updated_at ON "ExternalRef" RENAME TO external_ref_set_updated_at;

-- Product core fields (barcode / release_date / label / KRW price / shipping profile)
ALTER TABLE "Product"
  ADD COLUMN "barcode" TEXT,
  ADD COLUMN "release_date" TIMESTAMP(3),
  ADD COLUMN "label" TEXT,
  ADD COLUMN "price_krw" INTEGER,
  ADD COLUMN "shipping_profile_id" TEXT;

UPDATE "Product"
SET barcode = CONCAT('AUTO-', master_code)
WHERE barcode IS NULL OR barcode = '';

UPDATE "Product"
SET release_date = '2000-01-01'::timestamp
WHERE release_date IS NULL;

UPDATE "Product"
SET label = NULLIF(BTRIM(data.brand), '')
FROM (
  SELECT er.product_id, er.raw_snapshot_json->>'브랜드' AS brand
  FROM "ExternalRef" er
) AS data
WHERE "Product".id = data.product_id
  AND ( "Product".label IS NULL OR "Product".label = '' )
  AND data.brand IS NOT NULL;

UPDATE "Product"
SET label = 'UNKNOWN'
WHERE label IS NULL OR label = '';

UPDATE "Product"
SET price_krw = COALESCE(price_sale, 0)
WHERE price_krw IS NULL;

ALTER TABLE "Product"
  ALTER COLUMN "barcode" SET NOT NULL,
  ALTER COLUMN "release_date" SET NOT NULL,
  ALTER COLUMN "label" SET NOT NULL,
  ALTER COLUMN "price_krw" SET NOT NULL;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_barcode_key" UNIQUE ("barcode");

ALTER TABLE "Product"
  DROP COLUMN "price_sale";

-- Shipping profiles
CREATE TABLE IF NOT EXISTS "ShippingProfile" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "base_country" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "template_code" TEXT,
  "bundle_allowed" BOOLEAN NOT NULL DEFAULT false,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShippingProfile_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ShippingProfile" (id, name, base_country, method, template_code, bundle_allowed, is_default)
VALUES ('default-shipping-profile', '기본 배송 프로필', 'KR', 'PARCEL', NULL, false, true)
ON CONFLICT (id) DO NOTHING;

UPDATE "Product"
SET shipping_profile_id = COALESCE(shipping_profile_id, 'default-shipping-profile');

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_shipping_profile_id_fkey"
  FOREIGN KEY ("shipping_profile_id") REFERENCES "ShippingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Product_shipping_profile_id_idx" ON "Product" ("shipping_profile_id");

-- Channel visibility
CREATE TABLE IF NOT EXISTS "ChannelVisibility" (
  "id" SERIAL NOT NULL,
  "product_id" TEXT NOT NULL,
  "channel" "SalesChannel" NOT NULL,
  "is_visible" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChannelVisibility_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ChannelVisibility_channel_idx" ON "ChannelVisibility" ("channel");
CREATE UNIQUE INDEX IF NOT EXISTS "ChannelVisibility_product_id_channel_key" ON "ChannelVisibility" ("product_id", "channel");

INSERT INTO "ChannelVisibility" (product_id, channel, is_visible)
SELECT p.id, channels.channel, p.display_status
FROM "Product" p
CROSS JOIN (
  VALUES
    ('KODY_GLOBAL'::"SalesChannel"),
    ('KPOP_WHOLESALE'::"SalesChannel"),
    ('KPOP_B2B'::"SalesChannel")
) AS channels(channel)
ON CONFLICT ("product_id", "channel") DO NOTHING;

ALTER TABLE "ChannelVisibility"
  ADD CONSTRAINT "ChannelVisibility_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Exchange rates
CREATE TABLE IF NOT EXISTS "ExchangeRate" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "base_currency" TEXT NOT NULL,
  "target_currency" TEXT NOT NULL,
  "rate" DECIMAL(18, 6) NOT NULL,
  "effective_from" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);
