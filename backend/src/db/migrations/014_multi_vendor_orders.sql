-- Create sub_orders table (one per vendor per main order)
CREATE TABLE IF NOT EXISTS sub_orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_order_number TEXT NOT NULL UNIQUE,
  order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  vendor_id        UUID NOT NULL REFERENCES users(id),
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','accepted','rejected','dispatched','delivered')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add sub_order_id to order_items (nullable first for migration)
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS sub_order_id UUID REFERENCES sub_orders(id) ON DELETE CASCADE;

-- Migrate existing orders: create a sub_order for each existing order
INSERT INTO sub_orders (sub_order_number, order_id, vendor_id, status, created_at, updated_at)
SELECT 'S-' || order_number, id, vendor_id, status, created_at, updated_at
FROM orders
WHERE vendor_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Link existing order_items to their sub_orders
UPDATE order_items oi
SET sub_order_id = so.id
FROM sub_orders so
WHERE so.order_id = oi.order_id AND oi.sub_order_id IS NULL;

-- Make sub_order_id NOT NULL and drop old order_id
ALTER TABLE order_items ALTER COLUMN sub_order_id SET NOT NULL;
ALTER TABLE order_items DROP COLUMN IF EXISTS order_id;

-- Remove vendor_id and status from orders (now lives on sub_orders)
ALTER TABLE orders DROP COLUMN IF EXISTS vendor_id;
ALTER TABLE orders DROP COLUMN IF EXISTS status;
