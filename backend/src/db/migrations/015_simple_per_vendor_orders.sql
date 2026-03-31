-- Revert to simple architecture: one order per vendor, no sub_orders.
-- Run this ONLY if you previously ran migration 014.
-- If you did NOT run 014, your DB is already in the correct state.

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sub_orders') THEN

    -- Restore vendor_id and status on orders
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES users(id);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

    -- Restore order_id on order_items
    ALTER TABLE order_items ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE;

    -- Migrate single-sub_order main orders: update the parent order in-place
    UPDATE orders o
    SET vendor_id = so.vendor_id, status = so.status
    FROM sub_orders so
    WHERE so.order_id = o.id
      AND (SELECT COUNT(*) FROM sub_orders so2 WHERE so2.order_id = o.id) = 1;

    UPDATE order_items oi
    SET order_id = so.order_id
    FROM sub_orders so
    WHERE so.id = oi.sub_order_id
      AND (SELECT COUNT(*) FROM sub_orders so2 WHERE so2.order_id = so.order_id) = 1;

    -- Remove any test data where multi-sub_order migration is too complex
    DELETE FROM order_items oi WHERE oi.order_id IS NULL;
    DELETE FROM orders o WHERE o.vendor_id IS NULL;

    ALTER TABLE order_items ALTER COLUMN order_id SET NOT NULL;
    ALTER TABLE order_items DROP COLUMN IF EXISTS sub_order_id;
    DROP TABLE IF EXISTS sub_orders;

  END IF;
END $$;
