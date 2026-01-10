-- Fix any existing invalid count values first
UPDATE "UsageCounter" SET "count" = 0 WHERE "count" < 0;
UPDATE "UsageCounter" SET "count" = 100 WHERE "count" > 100;

-- Add CHECK constraint to ensure count is between 0 and 100
ALTER TABLE "UsageCounter" ADD CONSTRAINT "UsageCounter_count_check" CHECK ("count" >= 0 AND "count" <= 100);
