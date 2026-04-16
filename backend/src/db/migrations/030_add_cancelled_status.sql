-- Add 'cancelled' to orders status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'accepted', 'rejected',
    'dispatched', 'delivered', 'confirmed',
    'cancelled',
    'return_requested', 'return_accepted', 'return_dispatched'
  ));
