-- Migrate existing photo order data into order_photo_items
INSERT INTO order_photo_items (order_id, photo_url, vehicle_brand, vehicle_model, manufacture_year, quantity, note)
SELECT id, photo_url, vehicle_brand, vehicle_model, manufacture_year, COALESCE(photo_quantity, 1), requirement_note
FROM orders
WHERE order_type = 'photo' AND photo_url IS NOT NULL;

-- Drop photo-specific columns from orders (now lives in order_photo_items)
ALTER TABLE orders
  DROP COLUMN IF EXISTS photo_url,
  DROP COLUMN IF EXISTS requirement_note,
  DROP COLUMN IF EXISTS vehicle_brand,
  DROP COLUMN IF EXISTS vehicle_model,
  DROP COLUMN IF EXISTS manufacture_year,
  DROP COLUMN IF EXISTS photo_quantity;
