ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_type        VARCHAR(20)  NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS photo_url         TEXT,
  ADD COLUMN IF NOT EXISTS requirement_note  TEXT;
