-- Add approved_quantity to order_items (vendor's promised quantity on partial accept)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS approved_quantity INTEGER;

-- Expand orders status constraint to include new partial-acceptance states
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'accepted', 'rejected',
    'partially_accepted', 'partial_confirmed',
    'dispatched', 'delivered', 'confirmed',
    'cancelled',
    'return_requested', 'return_accepted', 'return_dispatched'
  ));
