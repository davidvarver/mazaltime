ALTER TABLE "Raffle" ADD COLUMN IF NOT EXISTS "watchBrand" TEXT;
ALTER TABLE "Raffle" ADD COLUMN IF NOT EXISTS "watchModel" TEXT;

UPDATE "Raffle"
SET
  "watchBrand" = CASE
    WHEN "watchBrand" IS NULL AND "watchName" ILIKE 'Rolex %' THEN 'Rolex'
    ELSE "watchBrand"
  END,
  "watchModel" = CASE
    WHEN "watchModel" IS NULL AND "watchName" ILIKE 'Rolex %' THEN trim(regexp_replace("watchName", '^Rolex\s+', '', 'i'))
    ELSE "watchModel"
  END
WHERE "watchBrand" IS NULL OR "watchModel" IS NULL;
