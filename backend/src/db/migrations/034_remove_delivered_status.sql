-- Migrate any existing 'delivered' orders to 'confirmed'
UPDATE orders
SET status       = 'confirmed',
    confirmed_at = COALESCE(confirmed_at, delivered_at, now()),
    updated_at   = now()
WHERE status = 'delivered';

-- Remove 'delivered' from orders status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'accepted', 'rejected', 'dispatched', 'confirmed',
    'cancelled', 'partially_accepted', 'partial_confirmed'
  ));
