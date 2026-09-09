-- Migration 002: update the existing visits table to the Part B schema.
-- Migration 001 already creates visits, so this migration renames its legacy
-- columns instead of trying to create the same table a second time.

CREATE TABLE IF NOT EXISTS visits (
  id            SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  amount        NUMERIC(10, 2) NOT NULL,
  visited_at    DATE NOT NULL,
  created_at    TIMESTAMP DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'restaurantId'
  ) THEN
    ALTER TABLE visits RENAME COLUMN "restaurantId" TO restaurant_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'amountSpent'
  ) THEN
    ALTER TABLE visits RENAME COLUMN "amountSpent" TO amount;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'date'
  ) THEN
    ALTER TABLE visits RENAME COLUMN date TO visited_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'created_at'
      AND data_type = 'timestamp with time zone'
  ) THEN
    ALTER TABLE visits
      ALTER COLUMN created_at TYPE TIMESTAMP
      USING created_at AT TIME ZONE 'UTC';
  END IF;
END $$;

ALTER TABLE visits ALTER COLUMN amount SET NOT NULL;
ALTER TABLE visits DROP COLUMN IF EXISTS notes;

ALTER TABLE visits DROP CONSTRAINT IF EXISTS "visits_restaurantId_fkey";
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_restaurant_id_fkey;
ALTER TABLE visits
  ADD CONSTRAINT visits_restaurant_id_fkey
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id);

CREATE INDEX IF NOT EXISTS idx_visits_restaurant_id ON visits (restaurant_id);
