-- Make order_item_id nullable (photo order returns won't have it)
ALTER TABLE return_items
  ALTER COLUMN order_item_id DROP NOT NULL;

-- Add FK to photo items
ALTER TABLE return_items
  ADD COLUMN IF NOT EXISTS order_photo_item_id INT REFERENCES order_photo_items(id);
